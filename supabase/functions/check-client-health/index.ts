import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { startInvocation, cronGuard, safeError, fetchWithTimeout, json } from '../_shared/observability.ts'

// Hourly client health check — scheduled via Supabase cron (HTTP + cron secret,
// migração 032). Deploy: supabase functions deploy check-client-health
//
// Só-cron: FALHA FECHADO no cron secret (cronGuard required).
// Required secrets (Project Settings → Edge Functions → Secrets):
//   NEXO_CRON_SECRET       — igual ao guardado no Vault (migração 032)
//   CALLMEBOT_KEY          — apikey from CallMeBot WhatsApp setup
//   CAIO_WHATSAPP_NUMBER   — e.g. 351912345678 (no + or spaces)

serve(async (req) => {
  const { log, cid } = startInvocation('check-client-health', req)

  // Só o pg_cron (header do Vault, migração 032) invoca esta função.
  const denied = cronGuard(req, log, { required: true })
  if (denied) return denied

  try {
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now    = new Date()
  const hourPT = parseInt(now.toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon', hour: 'numeric', hour12: false }), 10)

  // Only alert during restaurant operating hours (10–24h PT)
  if (hourPT < 10) {
    log.info('skipped_outside_hours', { hourPT })
    return json({ skipped: 'outside operating hours', hourPT, cid })
  }

  const { data: menus, error: menusErr } = await db
    .from('menus')
    .select(`slug, clients!inner (id, name, status, plan)`)
    .eq('clients.status', 'active')
    .neq('clients.plan', 'evento')

  if (menusErr) throw menusErr // erro de leitura → observável (catch → Sentry)

  if (!menus?.length) {
    log.info('no_active_clients')
    return json({ message: 'No active clients', cid })
  }
  log.info('start', { total_menus: menus.length, hourPT })

  const twoHoursAgo     = new Date(now.getTime() -  7_200_000).toISOString()
  const twentyFourHoursAgo = new Date(now.getTime() - 86_400_000).toISOString()
  const sevenDaysAgo    = new Date(now.getTime() - 7 * 86_400_000).toISOString()

  // ── COOLDOWN ──────────────────────────────────────────────────────────
  // Um problema persistente só volta ao WhatsApp 24h depois do último
  // alerta — nunca de hora a hora. Reconstruímos "quando foi o último
  // alerta por slug" a partir do monitoring_log (zero config, zero
  // tabelas novas). Linhas antigas sem o campo `alerted` contam como
  // alertadas, o que corta o spam em curso logo no primeiro run.
  const { data: recentRuns } = await db
    .from('monitoring_log')
    .select('checked_at, results')
    .gte('checked_at', twentyFourHoursAgo)
    .order('checked_at', { ascending: false })
    .limit(30)

  const lastAlerted: Record<string, true> = {}
  for (const run of recentRuns ?? []) {
    for (const r of (run.results as { slug?: string; issues?: string[]; alerted?: boolean }[]) ?? []) {
      if (r?.slug && r.issues?.length && r.alerted !== false) lastAlerted[r.slug] = true
    }
  }

  const isPeakHours = hourPT >= 12 && hourPT <= 22
  const issues: string[] = []
  const stats: Record<string, unknown>[] = []

  for (const menu of menus) {
    const slug       = menu.slug
    const clientName = (menu.clients as { name: string }).name

    const [ev2h, ev24h, ev7d, ord24h, errRows, lastEvRow] = await Promise.all([
      db.from('menu_events')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_slug', slug)
        .gte('created_at', twoHoursAgo),
      db.from('menu_events')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_slug', slug)
        .gte('created_at', twentyFourHoursAgo),
      db.from('menu_events')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_slug', slug)
        .gte('created_at', sevenDaysAgo),
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

    // ── BASELINE ────────────────────────────────────────────────────────
    // Silêncio só é anómalo se o menu tem tráfego real (≥20 eventos na
    // última semana ≈ 3 aberturas/dia). Demos e menus ainda não lançados
    // nunca alarmam por estarem parados; quando o restaurante entrar em
    // uso real, os alertas armam-se sozinhos. Erros alertam sempre.
    const hasBaseline = (ev7d.count ?? 0) >= 20

    if (hasBaseline && isPeakHours && (ev2h.count ?? 0) === 0) {
      menuIssues.push(`sem eventos há ${Math.round(hoursSinceLast)}h`)
    }

    if (hasBaseline && hourPT >= 14 && (ev24h.count ?? 0) === 0) {
      menuIssues.push('zero eventos hoje')
    }

    if ((errRows.count ?? 0) > 5) {
      menuIssues.push(`${errRows.count} erros nas últimas 24h`)
    }

    // Cooldown: problema já alertado nas últimas 24h não repete WhatsApp.
    const alertNow = menuIssues.length > 0 && !lastAlerted[slug]

    stats.push({
      slug,
      client: clientName,
      events_2h:  ev2h.count  ?? 0,
      events_24h: ev24h.count ?? 0,
      events_7d:  ev7d.count  ?? 0,
      orders_24h: ord24h.count ?? 0,
      errors_24h: errRows.count ?? 0,
      hours_since_last_event: Math.round(hoursSinceLast * 10) / 10,
      baseline: hasBaseline,
      issues: menuIssues,
      alerted: alertNow,
    })

    if (alertNow) {
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

    await sendAlert(db, msg, log)
    log.warn('alert_sent', { issues: issues.length, total: menus.length })
  }

  // Log run result (non-critical — ignore errors)
  await db.from('monitoring_log').insert({
    checked_at:   now.toISOString(),
    total_menus:  menus.length,
    issues_found: issues.length,
    results:      stats,
  }).catch(() => {})

  log.info('done', { total: menus.length, issues: issues.length })
  // Nunca devolver `stats` no corpo HTTP — contém métricas por cliente e a
  // resposta é ignorada pelo pg_cron. O detalhe fica no monitoring_log.
  return json({ checked_at: now.toISOString(), total: menus.length, issues: issues.length, cid })
  } catch (err) {
    return await safeError(err, { log, cid, fn: 'check-client-health' })
  }
})

async function sendAlert(
  db: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2').createClient>,
  message: string,
  log: { warn: (m: string, f?: Record<string, unknown>) => void },
) {
  const key   = Deno.env.get('CALLMEBOT_KEY')
  const phone = Deno.env.get('CAIO_WHATSAPP_NUMBER')

  if (key && phone) {
    try {
      // timeout: nunca prender a função à espera do CallMeBot.
      const r = await fetchWithTimeout(
        `https://api.callmebot.com/whatsapp.php` +
        `?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${key}`,
        {}, 5000,
      )
      if (r.ok) return
      log.warn('callmebot_non_ok', { status: r.status })
    } catch (_) {
      log.warn('callmebot_failed')
    }
  }

  // Fallback: save to system_alerts so the portal can surface it
  await db.from('system_alerts').insert({
    message,
    severity: 'warning',
    sent_at: new Date().toISOString(),
  }).catch(() => {})
}
