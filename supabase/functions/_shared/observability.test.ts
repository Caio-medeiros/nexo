// Testes das garantias de observabilidade. Correr:
//   deno test supabase/functions/_shared/observability.test.ts
import { assert, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Logger, cronGuard, safeError, startInvocation, newCid } from './observability.ts';

function reqWith(headers: Record<string, string> = {}): Request {
  return new Request('https://x/fn', { method: 'POST', headers });
}

Deno.test('cronGuard FALHA FECHADO: função só-cron sem NEXO_CRON_SECRET → 401', () => {
  Deno.env.delete('NEXO_CRON_SECRET');
  const log = new Logger('t', 'cid');
  const res = cronGuard(reqWith(), log, { required: true });
  assert(res, 'devia recusar');
  assertEquals(res!.status, 401);
});

Deno.test('cronGuard: secret configurado + header errado → 401', () => {
  Deno.env.set('NEXO_CRON_SECRET', 'segredo');
  const log = new Logger('t', 'cid');
  const res = cronGuard(reqWith({ 'x-nexo-cron-secret': 'errado' }), log, { required: true });
  assertEquals(res!.status, 401);
  Deno.env.delete('NEXO_CRON_SECRET');
});

Deno.test('cronGuard: secret configurado + header certo → passa (null)', () => {
  Deno.env.set('NEXO_CRON_SECRET', 'segredo');
  const log = new Logger('t', 'cid');
  const res = cronGuard(reqWith({ 'x-nexo-cron-secret': 'segredo' }), log, { required: true });
  assertEquals(res, null);
  Deno.env.delete('NEXO_CRON_SECRET');
});

Deno.test('cronGuard não-cron (required=false) sem secret → passa', () => {
  Deno.env.delete('NEXO_CRON_SECRET');
  const log = new Logger('t', 'cid');
  assertEquals(cronGuard(reqWith(), log, {}), null);
});

Deno.test('safeError NUNCA vaza schema/stack — só mensagem genérica + cid', async () => {
  Deno.env.delete('SENTRY_DSN');
  const log = new Logger('gen', 'CID-123');
  const dbErr = { code: '42P01', message: 'relation "clients" does not exist', details: 'SELECT * FROM clients JOIN ...' };
  const res = await safeError(dbErr, { log, cid: 'CID-123', fn: 'gen', publicMessage: 'Erro genérico.' });
  assertEquals(res.status, 500);
  const body = await res.json();
  // a mensagem interna NÃO pode aparecer no corpo
  const raw = JSON.stringify(body);
  assert(!raw.includes('does not exist'), 'vazou a mensagem SQL');
  assert(!raw.includes('42P01'), 'vazou o código SQL');
  assert(!raw.includes('clients'), 'vazou nome de tabela');
  assertEquals(body.error, 'Erro genérico.');
  assertEquals(body.cid, 'CID-123'); // cid permite correlacionar sem vazar
});

Deno.test('safeError default message é genérica', async () => {
  Deno.env.delete('SENTRY_DSN');
  const res = await safeError(new Error('stack secreto'), { log: new Logger('f', 'c'), cid: 'c', fn: 'f' });
  const body = await res.json();
  assert(!JSON.stringify(body).includes('stack secreto'));
  assertStringIncludes(body.error, 'erro');
});

Deno.test('Logger emite JSON de uma linha, com nível/fn/cid/ts, sem PII automática', () => {
  const original = console.log;
  let captured = '';
  console.log = (s: string) => { captured = s; };
  try {
    new Logger('minha-fn', 'CID-9').info('start', { slug: 'marisca', count: 3 });
  } finally { console.log = original; }
  const parsed = JSON.parse(captured); // tem de ser JSON válido de uma linha
  assertEquals(parsed.level, 'info');
  assertEquals(parsed.fn, 'minha-fn');
  assertEquals(parsed.cid, 'CID-9');
  assertEquals(parsed.msg, 'start');
  assertEquals(parsed.slug, 'marisca');
  assert(typeof parsed.ts === 'string');
  assert(!captured.includes('\n'), 'log tem de ser uma linha (pesquisável)');
});

Deno.test('startInvocation reutiliza x-correlation-id válido; gera novo se ausente/inválido', () => {
  const a = startInvocation('f', reqWith({ 'x-correlation-id': 'abc-12345' }));
  assertEquals(a.cid, 'abc-12345');
  const b = startInvocation('f', reqWith({ 'x-correlation-id': 'x' })); // curto demais → novo
  assert(b.cid !== 'x' && b.cid.length >= 6);
  const c = startInvocation('f'); // sem header → novo
  assert(c.cid.length >= 6);
});

Deno.test('newCid é único', () => {
  assert(newCid() !== newCid());
});
