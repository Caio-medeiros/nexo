import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// archive-stale-orders — arquiva comandas presas (itens nunca marcados como
// prontos) no fim do dia, para não ficarem em aberto indefinidamente na
// Cozinha/Sala.
//
// Modelo de dados: o NEXO usa `comandas` (não uma tabela `orders`). Arquivar a
// comanda retira do ecrã todas as suas rondas presas.
//
// Lógica (idêntica à função SQL archive_stale_comandas):
//   UPDATE comandas SET archived_at = now()
//   WHERE archived_at IS NULL
//     AND status NOT IN ('closed','cancelled')   -- != 'completed' neste schema
//     AND created_at < now() - interval '18 hours'
//
// Deploy:   supabase functions deploy archive-stale-orders
// Schedule: 0 5 * * *  (≈ 06:00 Europe/Lisbon — pg_cron/Dashboard correm em UTC)
//
// Preferimos a RPC archive_stale_comandas() (migração 030) como fonte única de
// verdade; se não existir, caímos para o UPDATE directo.

serve(async () => {
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let archived = 0

  // 1) Caminho preferido: RPC (já regista no error_log e devolve a contagem).
  const rpc = await db.rpc('archive_stale_comandas')
  if (!rpc.error && typeof rpc.data === 'number') {
    archived = rpc.data
  } else {
    // 2) Fallback: UPDATE directo.
    const cutoff = new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
    const { data, error } = await db
      .from('comandas')
      .update({ archived_at: new Date().toISOString() })
      .is('archived_at', null)
      .not('status', 'in', '("closed","cancelled")')
      .lt('created_at', cutoff)
      .select('id')

    if (error) {
      console.error('archive-stale-orders:', error.message)
      await db.from('error_log').insert({
        source: 'archive-stale-orders',
        error_code: 'UPDATE_FAILED',
        error_message: error.message,
      })
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
    archived = data?.length ?? 0
  }

  console.log(`archive-stale-orders: ${archived} comandas arquivadas`)
  return new Response(
    JSON.stringify({ ok: true, archived }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
