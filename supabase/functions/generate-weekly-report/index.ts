import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Wrapper fino: toda a lógica (métricas + texto + cache) está na função SQL
// SECURITY DEFINER generate_weekly_report (migração 010). Usamos a chave anon
// porque a service-role legada já não autentica neste projeto.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { espaco_slug, week_start, week_end, espaco_name } = await req.json()
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
      return new Response(JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify(data),
      { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
