import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { startInvocation, safeError, json } from '../_shared/observability.ts'

// Wrapper fino: toda a lógica (métricas + texto + cache) está na função SQL
// SECURITY DEFINER generate_weekly_report (migração 010). Usamos a chave anon
// porque a service-role legada já não autentica neste projeto.
//
// Chamado pelo portal (/portal/estatisticas). Observabilidade: log estruturado
// + Sentry; os erros NUNCA vazam (a mensagem da BD fica no servidor).

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const { log, cid } = startInvocation('generate-weekly-report', req)
  const started = Date.now()

  try {
    const { espaco_slug, week_start, week_end, espaco_name } = await req.json()
    if (!espaco_slug || !week_start || !week_end) {
      log.warn('bad_request', { hasSlug: !!espaco_slug, hasWeek: !!week_start && !!week_end })
      return json({ error: 'Parâmetros em falta.', cid }, 400, cors)
    }
    log.info('start', { slug: espaco_slug, week_start, week_end })

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )
    const { data, error } = await db.rpc('generate_weekly_report', {
      p_slug: espaco_slug,
      p_ws: week_start,
      p_we: week_end,
      p_name: espaco_name ?? null,
    })
    if (error) {
      // A mensagem da BD (schema/SQL) fica no servidor; o cliente recebe genérico.
      return await safeError(error, {
        log, cid, fn: 'generate-weekly-report',
        publicMessage: 'Não foi possível gerar o relatório agora.',
        headers: cors,
      })
    }

    log.info('ok', { slug: espaco_slug, ms: Date.now() - started })
    return json(data, 200, cors)
  } catch (err) {
    return await safeError(err, {
      log, cid, fn: 'generate-weekly-report',
      publicMessage: 'Não foi possível gerar o relatório agora.',
      headers: cors,
    })
  }
})
