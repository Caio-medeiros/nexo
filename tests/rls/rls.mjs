#!/usr/bin/env node
/**
 * NEXO RLS / isolamento multi-tenant — plain Node, zero dependências.
 * Fala directamente com o PostgREST/GoTrue de um projeto Supabase de TESTE
 * usando só fetch. ESCREVE (cria uma comanda de teste) — nunca apontar a
 * produção. O arquivo diário (030) limpa os restos em <24h.
 *
 * Uso:
 *   NEXO_RLS_URL=https://<projeto-teste>.supabase.co \
 *   NEXO_RLS_ANON_KEY=eyJ... \
 *   NEXO_RLS_SLUG=marisca-petisca \
 *   node tests/rls/rls.mjs
 *
 * Opcionais (activam os testes de dono autenticado):
 *   NEXO_RLS_OWNER_EMAIL / NEXO_RLS_OWNER_PASSWORD  — conta do dono de SLUG
 *   NEXO_RLS_OTHER_SLUG — venue que o dono NÃO possui (cross-tenant)
 *   NEXO_RLS_OPTIONAL=1 — sem config → exit 0 com aviso (local); por
 *                         omissão a falta de config FALHA (gate de CI real)
 *
 * O QUE PROVA (mapa para as migrações):
 *   • comandas/itens/rondas sem x-comanda-token → 0 linhas (037).
 *     ESTE É O CANÁRIO: se alguma política SELECT voltar a using(true),
 *     o teste 2 devolve a linha que acabámos de criar e o script FALHA.
 *   • token errado → 0 linhas; token certo → só a própria comanda (037).
 *   • faturação: rpc nm_financeiro_stats nega anon (038); orders_log sem
 *     SELECT para anon (021).
 *   • venue_settings.table_tokens invisível a anon; table_count visível (037).
 *   • nexo_table_access com token de mesa errado → valid:false sem fuga (037).
 *   • dono autenticado vê o seu slug e NÃO vê o slug de outro venue (021/037).
 */

const URL_ = (process.env.NEXO_RLS_URL || '').replace(/\/+$/, '');
const ANON = process.env.NEXO_RLS_ANON_KEY || '';
const SLUG = process.env.NEXO_RLS_SLUG || 'marisca-petisca';
const OWNER_EMAIL = process.env.NEXO_RLS_OWNER_EMAIL || '';
const OWNER_PASS = process.env.NEXO_RLS_OWNER_PASSWORD || '';
const OTHER_SLUG = process.env.NEXO_RLS_OTHER_SLUG || '';

if (!URL_ || !ANON) {
  const msg = `RLS tests: falta NEXO_RLS_URL / NEXO_RLS_ANON_KEY (projeto Supabase de TESTE).
Configura os secrets no repositório (Settings → Secrets → Actions):
  NEXO_RLS_URL, NEXO_RLS_ANON_KEY, NEXO_RLS_SLUG,
  NEXO_RLS_OWNER_EMAIL, NEXO_RLS_OWNER_PASSWORD, NEXO_RLS_OTHER_SLUG
Ver tests/rls/README.md para o seed necessário.`;
  if (process.env.NEXO_RLS_OPTIONAL === '1') {
    console.warn('⚠ SKIP — ' + msg);
    process.exit(0);
  }
  console.error('✗ ' + msg);
  process.exit(1);
}

// ── mini-harness ────────────────────────────────────────────────────────────
const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log('✓ ' + name); }
  catch (e) { results.push({ name, ok: false, err: e.message }); console.error('✗ ' + name + '\n    ' + e.message); }
}
function skip(name, why) { console.warn('- SKIP ' + name + ' (' + why + ')'); }
const ok = (c, m) => { if (!c) throw new Error(m); };

// fetch com timeout + headers PostgREST
async function api(path, { method = 'GET', token, comandaToken, headers = {}, body, prefer } = {}) {
  const h = {
    apikey: ANON,
    Authorization: `Bearer ${token || ANON}`,
    'Content-Type': 'application/json',
    ...(comandaToken ? { 'x-comanda-token': comandaToken } : {}),
    ...(prefer ? { Prefer: prefer } : {}),
    ...headers,
  };
  const res = await fetch(URL_ + path, {
    method, headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* respostas vazias (201/204) */ }
  return { status: res.status, ok: res.ok, data };
}
const uuid = () => crypto.randomUUID();

// ── suite ───────────────────────────────────────────────────────────────────
const myToken = uuid();
let comandaId = null;

await test('setup: anon cria comanda de teste (insert 021 + returning com token 037)', async () => {
  const r = await api('/rest/v1/comandas', {
    method: 'POST', comandaToken: myToken, prefer: 'return=representation',
    body: { espaco_slug: SLUG, table_label: 'Mesa RLS-CI', guest_count: 1, client_token: myToken },
  });
  ok(r.status === 201, `esperava 201, veio ${r.status}: ${JSON.stringify(r.data)} — o slug '${SLUG}' existe em menus no projeto de teste?`);
  ok(Array.isArray(r.data) && r.data[0] && r.data[0].id,
    'returning não devolveu a linha — a política SELECT não aceita o x-comanda-token do criador (037)');
  comandaId = r.data[0].id;
});

await test('CANÁRIO using(true): anon SEM token não lê comandas do venue (espera 0 linhas)', async () => {
  const r = await api(`/rest/v1/comandas?espaco_slug=eq.${SLUG}&select=id,table_label`);
  ok(r.status === 200, `esperava 200, veio ${r.status}`);
  ok(Array.isArray(r.data) && r.data.length === 0,
    `FURO DE ISOLAMENTO: anon sem token leu ${r.data.length} comanda(s) de ${SLUG} ` +
    '(a comanda de teste existe de certeza — a política SELECT voltou a using(true)?)');
});

await test('token ERRADO → 0 linhas', async () => {
  const r = await api(`/rest/v1/comandas?id=eq.${comandaId}&select=id`, { comandaToken: uuid() });
  ok(r.status === 200 && r.data.length === 0,
    `token errado leu ${r.data && r.data.length} linha(s)`);
});

await test('token certo → só a PRÓPRIA comanda (nunca as dos outros)', async () => {
  const r = await api('/rest/v1/comandas?select=id&limit=100', { comandaToken: myToken });
  ok(r.status === 200, `esperava 200, veio ${r.status}`);
  ok(r.data.length >= 1, 'o portador do token deixou de ver a própria comanda (menu partia)');
  ok(r.data.every((row) => row.id === comandaId),
    `o token de UMA comanda expôs ${r.data.length} comandas — o escopo é por linha, não por pedido`);
});

await test('comanda_items herda o escopo (sem token → 0; com token → 1)', async () => {
  const ins = await api('/rest/v1/comanda_items', {
    method: 'POST', comandaToken: myToken,
    body: { comanda_id: comandaId, espaco_slug: SLUG, item_name: 'Item RLS-CI', item_price: 1, quantity: 1 },
  });
  ok(ins.status === 201, `insert do item falhou: ${ins.status} ${JSON.stringify(ins.data)}`);
  const noTok = await api(`/rest/v1/comanda_items?comanda_id=eq.${comandaId}&select=id`);
  ok(noTok.status === 200 && noTok.data.length === 0,
    `itens visíveis sem token (${noTok.data && noTok.data.length} linhas) — scoped_read_comanda_items caiu?`);
  const withTok = await api(`/rest/v1/comanda_items?comanda_id=eq.${comandaId}&select=id`, { comandaToken: myToken });
  ok(withTok.data.length === 1, 'o dono do token deixou de ver os próprios itens');
});

await test('comanda_rounds herda o escopo (sem token → 0)', async () => {
  const ins = await api('/rest/v1/comanda_rounds', {
    method: 'POST', comandaToken: myToken,
    body: { comanda_id: comandaId, espaco_slug: SLUG, round_number: 1 },
  });
  ok(ins.status === 201, `insert da ronda falhou: ${ins.status} ${JSON.stringify(ins.data)}`);
  const noTok = await api(`/rest/v1/comanda_rounds?comanda_id=eq.${comandaId}&select=id`);
  ok(noTok.status === 200 && noTok.data.length === 0,
    `rondas visíveis sem token (${noTok.data && noTok.data.length} linhas) — scoped_read_round caiu?`);
});

await test('faturação: rpc nm_financeiro_stats NEGA anon (038)', async () => {
  const r = await api('/rest/v1/rpc/nm_financeiro_stats', { method: 'POST', body: { p_days: 1 } });
  ok(!r.ok, `anon obteve os agregados de faturação (HTTP ${r.status}) — a 038 foi revertida?`);
});

await test('faturação: orders_log sem SELECT para anon (021)', async () => {
  const r = await api('/rest/v1/orders_log?select=total&limit=1');
  ok(!r.ok, `anon leu orders_log (HTTP ${r.status}) — grant SELECT indevido`);
});

await test('venue_settings.table_tokens invisível a anon; table_count visível (037)', async () => {
  const secret = await api('/rest/v1/venue_settings?select=table_tokens&limit=1');
  ok(!secret.ok, `anon leu table_tokens (HTTP ${secret.status}) — o bypass do TAT reabriu`);
  const open = await api('/rest/v1/venue_settings?select=espaco_slug,table_count&limit=1');
  ok(open.ok, `anon deixou de ler table_count (HTTP ${open.status}) — o placeholder "1 a N" do menu parte`);
});

await test('nexo_table_access com token de mesa errado → valid:false, sem client_token', async () => {
  const r = await api('/rest/v1/rpc/nexo_table_access', {
    method: 'POST', body: { p_slug: SLUG, p_table_num: 1, p_table_token: 'token-errado-ci' },
  });
  ok(r.ok, `a RPC devia existir e responder 200 (veio ${r.status}) — 037 aplicada?`);
  ok(r.data && r.data.valid === false, 'token de mesa errado foi aceite');
  ok(!JSON.stringify(r.data).includes('client_token'), 'a resposta inválida vazou um client_token');
});

// ── dono autenticado (opcional) ────────────────────────────────────────────
if (OWNER_EMAIL && OWNER_PASS) {
  let jwt = null;
  await test('auth: login do dono de teste', async () => {
    const r = await api('/auth/v1/token?grant_type=password', {
      method: 'POST', body: { email: OWNER_EMAIL, password: OWNER_PASS },
    });
    ok(r.ok && r.data.access_token, `login falhou (HTTP ${r.status})`);
    jwt = r.data.access_token;
  });

  if (jwt) {
    await test('dono autenticado vê as comandas do SEU slug (owns_espaco)', async () => {
      const r = await api(`/rest/v1/comandas?espaco_slug=eq.${SLUG}&select=id&limit=5`, { token: jwt });
      ok(r.ok, `HTTP ${r.status}`);
      ok(r.data.length >= 1, 'o dono não vê a comanda de teste do próprio venue — sala/cozinha partiam');
    });

    if (OTHER_SLUG) {
      await test(`dono NÃO vê comandas de outro venue (${OTHER_SLUG})`, async () => {
        const r = await api(`/rest/v1/comandas?espaco_slug=eq.${OTHER_SLUG}&select=id&limit=5`, { token: jwt });
        ok(r.ok, `HTTP ${r.status}`);
        ok(r.data.length === 0,
          `CROSS-TENANT: o dono de ${SLUG} leu ${r.data.length} comanda(s) de ${OTHER_SLUG}`);
      });
      await test(`dono NÃO vê orders_log de outro venue (${OTHER_SLUG})`, async () => {
        const r = await api(`/rest/v1/orders_log?espaco_slug=eq.${OTHER_SLUG}&select=id&limit=5`, { token: jwt });
        ok(r.ok, `HTTP ${r.status}`);
        ok(r.data.length === 0, `CROSS-TENANT: faturação de ${OTHER_SLUG} legível por outro dono`);
      });
    } else {
      skip('cross-tenant do dono', 'define NEXO_RLS_OTHER_SLUG');
    }
  }
} else {
  skip('testes de dono autenticado', 'define NEXO_RLS_OWNER_EMAIL/PASSWORD');
}

// ── limpeza best-effort (o arquivo 030 apanha o resto em <24h) ─────────────
if (comandaId) {
  await api(`/rest/v1/comandas?id=eq.${comandaId}`, {
    method: 'PATCH', comandaToken: myToken, body: { status: 'cancelled' },
  }).catch(() => {});
}

// ── sumário ────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passaram`);
if (failed.length) {
  console.error(`✗ ${failed.length} falha(s) de isolamento — MERGE BLOQUEADO`);
  process.exit(1);
}
console.log('✓ Isolamento multi-tenant intacto.');
