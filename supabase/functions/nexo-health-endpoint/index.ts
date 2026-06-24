import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Public health endpoint — monitored by UptimeRobot every 5 minutes.
// Deploy with: supabase functions deploy nexo-health-endpoint --no-verify-jwt
// UptimeRobot: send Authorization: Bearer <anon-key> as custom header.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()

  try {
    // Active paying clients (not leads, not churned, not one-time events)
    const { data: clients, error: clientsErr } = await db
      .from('clients')
      .select(`id, name, menus (slug)`)
      .eq('status', 'active')
      .neq('plan', 'evento')

    if (clientsErr) throw clientsErr

    const oneHourAgo   = new Date(now.getTime() -      3_600_000).toISOString()
    const oneDayAgo    = new Date(now.getTime() -  86_400_000).toISOString()

    // PT timezone offset (UTC+1 standard, UTC+2 summer — approximate with UTC+1)
    const hourPT = (now.getUTCHours() + 1) % 24
    const isOperatingHours = hourPT >= 11 && hourPT <= 23

    const clientResults = []
    let totalIssues = 0

    for (const client of clients ?? []) {
      for (const menu of (client.menus as { slug: string }[]) ?? []) {
        const slug = menu.slug

        const [ev1h, ev24h, ord24h, lastEvRow] = await Promise.all([
          db.from('menu_events')
            .select('*', { count: 'exact', head: true })
            .eq('espaco_slug', slug)
            .gte('created_at', oneHourAgo),
          db.from('menu_events')
            .select('*', { count: 'exact', head: true })
            .eq('espaco_slug', slug)
            .gte('created_at', oneDayAgo),
          db.from('orders_log')
            .select('*', { count: 'exact', head: true })
            .eq('espaco_slug', slug)
            .gte('created_at', oneDayAgo),
          db.from('menu_events')
            .select('created_at')
            .eq('espaco_slug', slug)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        const hasIssue = isOperatingHours && (ev24h.count ?? 0) === 0

        if (hasIssue) totalIssues++

        clientResults.push({
          slug,
          client_name: client.name,
          events_last_1h:  ev1h.count  ?? 0,
          events_last_24h: ev24h.count ?? 0,
          orders_last_24h: ord24h.count ?? 0,
          last_event_at:   lastEvRow.data?.created_at ?? null,
          status: hasIssue ? 'warning' : 'ok',
        })
      }
    }

    const total = clientResults.length
    const overallStatus =
      totalIssues === 0 ? 'ok' :
      totalIssues > total / 2 ? 'critical' : 'warning'

    return new Response(
      JSON.stringify({
        generated_at: now.toISOString(),
        status: totalIssues === 0 ? 'ok' : 'warning',
        clients: clientResults,
        summary: {
          total_active_menus: total,
          menus_with_issues: totalIssues,
          overall_status: overallStatus,
        },
      }),
      { headers: corsHeaders }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({
        generated_at: now.toISOString(),
        status: 'error',
        error: 'Health check failed',
        summary: { overall_status: 'error' },
        clients: [],
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
