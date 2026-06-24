import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Hourly client health check — scheduled via Supabase cron.
// Deploy: supabase functions deploy check-client-health
// Schedule in Dashboard → Edge Functions → check-client-health → Schedules: 0 * * * *
//
// Required secrets (Project Settings → Edge Functions → Secrets):
//   CALLMEBOT_KEY          — apikey from CallMeBot WhatsApp setup
//   CAIO_WHATSAPP_NUMBER   — e.g. 351912345678 (no + or spaces)

serve(async () => {
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now    = new Date()
  const hourPT = parseInt(now.toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon', hour: 'numeric', hour12: false }), 10)

  // Only alert during restaurant operating hours (10–24h PT)
  if (hourPT < 10) {
    return new Response(
      JSON.stringify({ skipped: 'outside operating hours', hourPT }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { data: menus } = await db
    .from('menus')
    .select(`slug, clients!inner (id, name, status, plan)`)
    .eq('clients.status', 'active')
    .neq('clients.plan', 'evento')

  if (!menus?.length) {
    return new Response(
      JSON.stringify({ message: 'No active clients' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  const twoHoursAgo     = new Date(now.getTime() -  7_200_000).toISOString()
  const twentyFourHoursAgo = new Date(now.getTime() - 86_400_000).toISOString()

  const isPeakHours = hourPT >= 12 && hourPT <= 22
  const issues: string[] = []
  const stats: Record<string, unknown>[] = []

  for (const menu of menus) {
    const slug       = menu.slug
    const clientName = (menu.clients as { name: string }).name

    const [ev2h, ev24h, ord24h, errRows, lastEvRow] = await Promise.all([
      db.from('menu_events')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_slug', slug)
        .gte('created_at', twoHoursAgo),
      db.from('menu_events')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_slug', slug)
        .gte('created_at', twentyFourHoursAgo),
      db.from('orders_log')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_slug', slug)
        .gte('created_at', twentyFourHoursAgo),
      // error_log.context is JSONB with key espaco_slug
      db.from('error_log')
        .select('*', { count: 'exact', head: true })
        .filter("context->>'espaco_slug'", 'eq', slug)
        .eq('resolved', false)
        .gte('created_at', twentyFourHoursAgo),
      db.from('menu_events')
        .select('created_at')
        .eq('espaco_slug', slug)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const hoursSinceLast = lastEvRow.data
      ? (now.getTime() - new Date(lastEvRow.data.created_at).getTime()) / 3_600_000
      : 999

    const menuIssues: string[] = []

    if (isPeakHours && (ev2h.count ?? 0) === 0) {
      menuIssues.push(`sem eventos há ${Math.round(hoursSinceLast)}h`)
    }

    if (hourPT >= 14 && (ev24h.count ?? 0) === 0) {
      menuIssues.push('zero eventos hoje')
    }

    if ((errRows.count ?? 0) > 5) {
      menuIssues.push(`${errRows.count} erros nas últimas 24h`)
    }

    stats.push({
      slug,
      client: clientName,
      events_2h:  ev2h.count  ?? 0,
      events_24h: ev24h.count ?? 0,
      orders_24h: ord24h.count ?? 0,
      errors_24h: errRows.count ?? 0,
      hours_since_last_event: Math.round(hoursSinceLast * 10) / 10,
      issues: menuIssues,
    })

    if (menuIssues.length > 0) {
      issues.push(`⚠️ ${clientName} (${slug}): ${menuIssues.join(', ')}`)
    }
  }

  if (issues.length > 0) {
    const time = now.toLocaleTimeString('pt-PT', {
      timeZone: 'Europe/Lisbon',
      hour: '2-digit',
      minute: '2-digit',
    })
    const msg =
      `🔴 NEXO MONITOR — ${time}\n\n` +
      `${issues.length} menu${issues.length !== 1 ? 's' : ''} com problema:\n\n` +
      issues.join('\n') +
      `\n\nTotal activos: ${menus.length}` +
      `\nVer: nexosolutions.pt/portal/status/`

    await sendAlert(db, msg)
  }

  // Log run result (non-critical — ignore errors)
  await db.from('monitoring_log').insert({
    checked_at:   now.toISOString(),
    total_menus:  menus.length,
    issues_found: issues.length,
    results:      stats,
  }).catch(() => {})

  return new Response(
    JSON.stringify({ checked_at: now.toISOString(), total: menus.length, issues: issues.length, stats }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

async function sendAlert(db: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2').createClient>, message: string) {
  const key   = Deno.env.get('CALLMEBOT_KEY')
  const phone = Deno.env.get('CAIO_WHATSAPP_NUMBER')

  if (key && phone) {
    try {
      await fetch(
        `https://api.callmebot.com/whatsapp.php` +
        `?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${key}`
      )
      return
    } catch (_) {}
  }

  // Fallback: save to system_alerts so the portal can surface it
  await db.from('system_alerts').insert({
    message,
    severity: 'warning',
    sent_at: new Date().toISOString(),
  }).catch(() => {})
}
