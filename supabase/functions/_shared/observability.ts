// ═══════════════════════════════════════════════════════════════════════════
// NEXO — Observabilidade partilhada das Edge Functions (Deno)
//
// Um só módulo, importado por todas as functions (padrão _shared do Supabase):
//   • Logger  — logs JSON de UMA linha (pesquisáveis), com nível + correlation
//               id (cid). SEM PII: loga slugs/contagens/ids, nunca nomes,
//               notas, emails, telefones ou tokens.
//   • cronGuard — valida o x-nexo-cron-secret (migração 032) e FALHA FECHADO:
//               numa função só-cron, se o segredo não estiver configurado ou o
//               header não bater, devolve 401 (nunca corre sem prova).
//   • captureException — envia o erro para o Sentry (via envelope HTTP, sem SDK)
//               quando SENTRY_DSN existe; caso contrário é no-op. Sempre
//               fail-safe: um erro no reporting nunca parte a função.
//   • safeError — regista o detalhe completo no servidor (+Sentry) e devolve ao
//               cliente uma mensagem GENÉRICA + o cid (nunca schema/stack/SQL).
//   • json — Response JSON com headers coerentes.
//
// Objectivo: uma function que falha gera um alerta observável (Sentry + log
// estruturado), nunca uma falha silenciosa descoberta pelo cliente.
// ═══════════════════════════════════════════════════════════════════════════

export type Level = 'debug' | 'info' | 'warn' | 'error';

const ENV = (Deno.env.get('NEXO_ENV') ?? Deno.env.get('SUPABASE_ENV') ?? 'production').toLowerCase();

/** Correlation id novo (uuid v4). Viaja em todos os logs de uma invocação. */
export function newCid(): string {
  try { return crypto.randomUUID(); } catch { return 'cid-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
}

/** Logger estruturado por invocação. Emite JSON de uma linha para stdout. */
export class Logger {
  constructor(readonly fn: string, readonly cid: string) {}

  private emit(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      fn: this.fn,
      cid: this.cid,
      msg,
      ...fields,
    });
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  debug(msg: string, fields?: Record<string, unknown>): void { this.emit('debug', msg, fields); }
  info(msg: string, fields?: Record<string, unknown>): void { this.emit('info', msg, fields); }
  warn(msg: string, fields?: Record<string, unknown>): void { this.emit('warn', msg, fields); }
  error(msg: string, fields?: Record<string, unknown>): void { this.emit('error', msg, fields); }
}

/** Cria { log, cid } para uma invocação. Reaproveita um cid recebido se existir. */
export function startInvocation(fn: string, req?: Request): { log: Logger; cid: string } {
  const incoming = req?.headers.get('x-correlation-id') || req?.headers.get('x-request-id');
  const cid = (incoming && /^[\w-]{6,64}$/.test(incoming)) ? incoming : newCid();
  return { log: new Logger(fn, cid), cid };
}

/**
 * Guarda de cron. FALHA FECHADO.
 *   required: true  → função SÓ-cron. Sem NEXO_CRON_SECRET configurado OU header
 *                     em falta/errado ⇒ 401. Nunca corre sem prova.
 *   required: false → se o segredo estiver configurado, é enforçado; se não
 *                     estiver, deixa passar (para functions públicas/mistas).
 * Devolve uma Response 401 (a devolver de imediato) ou null (segue).
 */
export function cronGuard(req: Request, log: Logger, opts: { required?: boolean } = {}): Response | null {
  const secret = Deno.env.get('NEXO_CRON_SECRET');
  const header = req.headers.get('x-nexo-cron-secret');

  if (opts.required && !secret) {
    log.error('cron_secret_missing', { reason: 'NEXO_CRON_SECRET não configurado numa função só-cron' });
    return unauthorized();
  }
  if (secret && header !== secret) {
    log.warn('cron_secret_mismatch', { hasHeader: !!header });
    return unauthorized();
  }
  return null;
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Envia o erro para o Sentry (envelope HTTP, sem dependência de SDK) se
 * SENTRY_DSN existir. Regista SEMPRE em log estruturado. Fail-safe: qualquer
 * problema no reporting é engolido — nunca parte a função.
 * NÃO passar PII em ctx (só fn/cid/slug/contagens).
 */
export async function captureException(
  err: unknown,
  ctx: { fn: string; cid: string; [k: string]: unknown },
): Promise<void> {
  const e = normaliseError(err);
  // log estruturado (fica sempre nos logs do Supabase, mesmo sem Sentry)
  console.error(JSON.stringify({
    ts: new Date().toISOString(), level: 'error', fn: ctx.fn, cid: ctx.cid,
    msg: 'exception', err_type: e.type, err_message: e.message,
    ...omit(ctx, ['fn', 'cid']),
  }));

  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) return;
  try {
    const parsed = parseDsn(dsn);
    if (!parsed) return;
    const eventId = newCid().replace(/-/g, '');
    const event = {
      event_id: eventId,
      timestamp: Date.now() / 1000,
      platform: 'javascript',
      level: 'error',
      logger: ctx.fn,
      environment: ENV,
      server_name: `edge:${ctx.fn}`,
      tags: { fn: ctx.fn, cid: ctx.cid },
      extra: omit(ctx, ['fn', 'cid']),
      exception: { values: [{ type: e.type, value: e.message, stacktrace: e.stack ? framesFrom(e.stack) : undefined }] },
    };
    const envelope =
      JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn }) + '\n' +
      JSON.stringify({ type: 'event' }) + '\n' +
      JSON.stringify(event) + '\n';

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 3000);
    await fetch(parsed.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=nexo-edge/1.0, sentry_key=${parsed.publicKey}`,
      },
      body: envelope,
      signal: ac.signal,
    }).finally(() => clearTimeout(t));
  } catch (_) { /* reporting nunca parte a função */ }
}

/**
 * Response de erro para o cliente. Regista + captura o detalhe no servidor e
 * devolve uma mensagem GENÉRICA + o cid (para o cliente reportar sem vazar
 * schema/stack/SQL). Espelha a filosofia de getPublicErrorMessage no servidor.
 */
export async function safeError(
  err: unknown,
  o: { log: Logger; cid: string; fn: string; status?: number; publicMessage?: string; headers?: Record<string, string> },
): Promise<Response> {
  await captureException(err, { fn: o.fn, cid: o.cid });
  const body = {
    error: o.publicMessage ?? 'Ocorreu um erro. Tente novamente.',
    cid: o.cid, // permite correlacionar com os logs sem expor nada sensível
  };
  return new Response(JSON.stringify(body), {
    status: o.status ?? 500,
    headers: { 'Content-Type': 'application/json', ...(o.headers ?? {}) },
  });
}

/** Response JSON com Content-Type coerente. */
export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** fetch com timeout (para chamadas externas: CallMeBot, web-push, etc.). */
export async function fetchWithTimeout(input: string | URL, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

// ── helpers internos ───────────────────────────────────────────────────────
function normaliseError(err: unknown): { type: string; message: string; stack?: string } {
  if (err instanceof Error) return { type: err.name || 'Error', message: err.message, stack: err.stack };
  if (typeof err === 'object' && err) {
    const o = err as Record<string, unknown>;
    return { type: String(o.name ?? o.code ?? 'Error'), message: String(o.message ?? JSON.stringify(o)) };
  }
  return { type: 'Error', message: String(err) };
}

function omit(o: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o)) if (!keys.includes(k)) out[k] = o[k];
  return out;
}

function parseDsn(dsn: string): { url: string; publicKey: string } | null {
  // https://<publicKey>@<host>/<projectId>
  const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
  if (!m) return null;
  const [, publicKey, host, projectId] = m;
  return { url: `https://${host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`, publicKey };
}

function framesFrom(stack: string): { frames: { filename: string; function: string }[] } {
  const frames = stack.split('\n').slice(1, 20).reverse().map((l) => {
    const at = l.trim().replace(/^at\s+/, '');
    return { filename: at, function: at.split(' ')[0] || '?' };
  });
  return { frames };
}
