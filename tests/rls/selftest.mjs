#!/usr/bin/env node
/**
 * Selftest do canário RLS — prova, sem tocar em nenhum Supabase, que
 * tests/rls/rls.mjs FALHA quando as políticas regridem para using(true).
 *
 * Sobe um PostgREST falso em dois modos e corre o rls.mjs contra cada um:
 *   INSEGURO (using(true)): GETs devolvem linhas sem x-comanda-token,
 *     faturação aberta a anon            → rls.mjs TEM de sair com código 1
 *   SEGURO (037/038): leituras filtradas pelo token, faturação 401
 *     → rls.mjs TEM de sair com código 0
 *
 *   node tests/rls/selftest.mjs
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function makeServer(insecure) {
  const state = { comandas: [], items: [], rounds: [] };
  return createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const path = url.pathname;
    const tok = req.headers['x-comanda-token'] || null;
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const json = (code, obj) => {
        res.writeHead(code, { 'content-type': 'application/json' });
        res.end(JSON.stringify(obj));
      };
      const parsed = body ? JSON.parse(body) : null;
      // visibilidade: modo inseguro devolve tudo; modo seguro exige token igual
      const visible = (rows, tokenOf) =>
        insecure ? rows : rows.filter((r) => tok && tokenOf(r) === tok);

      if (path === '/rest/v1/comandas' && req.method === 'POST') {
        const row = { id: 'c-' + (state.comandas.length + 1), ...parsed };
        state.comandas.push(row);
        // returning respeita a política de SELECT (como o PostgREST real)
        return json(201, insecure || tok === row.client_token ? [row] : []);
      }
      if (path === '/rest/v1/comandas') {
        return json(200, visible(state.comandas, (r) => r.client_token));
      }
      if (path === '/rest/v1/comanda_items' && req.method === 'POST') {
        const row = { id: 'i-' + (state.items.length + 1), ...parsed };
        state.items.push(row);
        return json(201, [row]);
      }
      if (path === '/rest/v1/comanda_items') {
        const tokenOf = (r) => (state.comandas.find((c) => c.id === r.comanda_id) || {}).client_token;
        return json(200, visible(state.items, tokenOf));
      }
      if (path === '/rest/v1/comanda_rounds' && req.method === 'POST') {
        const row = { id: 'r-' + (state.rounds.length + 1), ...parsed };
        state.rounds.push(row);
        return json(201, [row]);
      }
      if (path === '/rest/v1/comanda_rounds') {
        const tokenOf = (r) => (state.comandas.find((c) => c.id === r.comanda_id) || {}).client_token;
        return json(200, visible(state.rounds, tokenOf));
      }
      if (path === '/rest/v1/rpc/nm_financeiro_stats') {
        return insecure ? json(200, { views: 42, revenue: 999 })
                        : json(401, { code: '42501', message: 'permission denied' });
      }
      if (path === '/rest/v1/orders_log') {
        return insecure ? json(200, [{ total: 10 }])
                        : json(401, { code: '42501', message: 'permission denied' });
      }
      if (path === '/rest/v1/venue_settings') {
        const cols = url.searchParams.get('select') || '';
        if (cols.includes('table_tokens') && !insecure) {
          return json(401, { code: '42501', message: 'permission denied for column' });
        }
        return json(200, [{ espaco_slug: 'x', table_count: 10, ...(insecure ? { table_tokens: { 1: 'LEAK' } } : {}) }]);
      }
      if (path === '/rest/v1/rpc/nexo_table_access') {
        return json(200, insecure
          ? { valid: true, comanda: { client_token: 'LEAKED-TOKEN' } }
          : { valid: false, table_count: 10 });
      }
      return json(200, []);
    });
  });
}

function runAgainst(insecure) {
  return new Promise((resolve) => {
    const server = makeServer(insecure);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      // spawn assíncrono — spawnSync bloquearia o event loop deste processo,
      // que é quem está a servir o PostgREST falso
      const child = spawn(process.execPath, [join(__dirname, 'rls.mjs')], {
        env: {
          ...process.env,
          NEXO_RLS_URL: `http://127.0.0.1:${port}`,
          NEXO_RLS_ANON_KEY: 'fake-anon-key',
          NEXO_RLS_SLUG: 'venue-teste',
          NEXO_RLS_OWNER_EMAIL: '', NEXO_RLS_OWNER_PASSWORD: '', NEXO_RLS_OTHER_SLUG: '',
        },
      });
      let stdout = '', stderr = '';
      child.stdout.on('data', (c) => (stdout += c));
      child.stderr.on('data', (c) => (stderr += c));
      const killer = setTimeout(() => child.kill('SIGKILL'), 60_000);
      child.on('close', (status) => {
        clearTimeout(killer);
        server.close();
        resolve({ status, stdout, stderr });
      });
    });
  });
}

const insecureRun = await runAgainst(true);
const secureRun = await runAgainst(false);

let fails = 0;
if (insecureRun.status === 1) {
  console.log('✓ modo INSEGURO (using(true)) → rls.mjs FALHOU como devia (exit 1)');
} else {
  fails++;
  console.error(`✗ modo INSEGURO devia falhar; exit=${insecureRun.status}\n${insecureRun.stdout}\n${insecureRun.stderr}`);
}
if (secureRun.status === 0) {
  console.log('✓ modo SEGURO (037/038) → rls.mjs passou (exit 0)');
} else {
  fails++;
  console.error(`✗ modo SEGURO devia passar; exit=${secureRun.status}\n${secureRun.stdout}\n${secureRun.stderr}`);
}
process.exit(fails ? 1 : 0);
