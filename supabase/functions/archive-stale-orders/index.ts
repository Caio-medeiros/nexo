import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { startInvocation, cronGuard, safeError, json } from '../_shared/observability.ts'

// archive-stale-orders — arquiva comandas presas (itens nunca marcados como
// prontos) no fim do dia, para não ficarem em aberto indefinidamente na
// Cozinha/Sala.
//
// Modelo de dados: o NEXO usa `comandas` (não uma tabela `orders`). Arquivar a
// comanda retira do ecrã todas as suas rondas presas.
//
// Preferimos a RPC archive_stale_comandas() (migração 030) como fonte única de
// verdade; se não existir, caímos para o UPDATE directo. A operação é
// IDEMPOTENTE (só toca comandas ainda não arquivadas > 18h) — reexecutar é
// seguro.
//
// Manutenção só-cron: FALHA FECHADO no cron secret (cronGuard required).
// Deploy:   supabase functions deploy archive-stale-orders
// Schedule: 0 5 * * *  (≈ 06:00 Europe/Lisbon)

serve(async (req) => {
  const { log, cid } = startInvocation('archive-stale-orders', req)

  // Função só-cron: sem prova do cron secret, não corre.
  const denied = cronGuard(req, log, { required: true })
  if (denied) return denied

  try {
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let archived = 0

    // 1) Caminho preferido: RPC (já regista no error_log e devolve a contagem).
    const rpc = await db.rpc('archive_stale_comandas')
    if (!rpc.error && typeof rpc.data === 'number') {
      archived = rpc.data
      log.info('archived_via_rpc', { archived })
    } else {
      if (rpc.error) log.warn('rpc_unavailable_fallback', { code: (rpc.error as { code?: string }).code ?? null })
      // 2) Fallback: UPDATE directo (mesma semântica, idempotente).
      const cutoff = new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
      const { data, error } = await db
        .from('comandas')
        .update({ archived_at: new Date().toISOString() })
        .is('archived_at', null)
        .not('status', 'in', '("closed","cancelled")')
        .lt('created_at', cutoff)
        .select('id')

      if (error) {
        // Não vaza: regista no error_log + safeError devolve genérico + cid.
        try {
          await db.from('error_log').insert({
            source: 'archive-stale-orders',
            error_code: (error as { code?: string }).code ?? 'UPDATE_FAILED',
            error_message: error.message,
            context: { cid },
          })
        } catch (_) { /* best-effort */ }
        return await safeError(error, {
          log, cid, fn: 'archive-stale-orders',
          publicMessage: 'Falha ao arquivar comandas.',
        })
      }
      archived = data?.length ?? 0
      log.info('archived_via_fallback', { archived })
    }

    return json({ ok: true, archived, cid })
  } catch (err) {
    return await safeError(err, {
      log, cid, fn: 'archive-stale-orders',
      publicMessage: 'Falha ao arquivar comandas.',
    })
  }
})
