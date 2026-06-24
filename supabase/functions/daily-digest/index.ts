import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Daily digest — scheduled at 09:00 UTC (10:00 Lisboa) every day.
// Deploy: supabase functions deploy daily-digest
// Schedule in Dashboard → Edge Functions → daily-digest → Schedules: 0 9 * * *

serve(async () => {
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now       = new Date()
  const yesterday = new Date(now.getTime() - 86_400_000)
  const yStart    = yesterday.toISOString().split('T')[0] + 'T00:00:00Z'
  const yEnd      = yesterday.toISOString().split('T')[0] + 'T23:59:59Z'

  const { data: menus } = await db
    .from('menus')
    .select(`slug, clients!inner (name, status, plan)`)
    .eq('clients.status', 'active')
    .neq('clients.plan', 'evento')

  if (!menus?.length) return new Response('ok')

  let totalEvents  = 0
  let totalOrders  = 0
  let totalRevenue = 0
  let totalCalls   = 0
  const lines: string[]       = []
  const silentMenus: string[] = []

  for (const menu of menus) {
    const slug = menu.slug
    const name = (menu.clients as { name: string }).name

    const [evRes, ordRes, callRes] = await Promise.all([
      db.from('menu_events')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_slug', slug)
        .gte('created_at', yStart)
        .lte('created_at', yEnd),
      db.from('orders_log')
        .select('total')
        .eq('espaco_slug', slug)
        .gte('created_at', yStart)
        .lte('created_at', yEnd),
      db.from('staff_calls')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_slug', slug)
        .gte('created_at', yStart)
        .lte('created_at', yEnd),
    ])

    const events  = evRes.count ?? 0
    const orders  = (ordRes.data as { total: number | null }[] | null) ?? []
    const revenue = orders.reduce((s, o) => s + (o.total ?? 0), 0)
    const calls   = callRes.count ?? 0

    totalEvents  += events
    totalOrders  += orders.length
    totalRevenue += revenue
    totalCalls   += calls

    if (events === 0) {
      silentMenus.push(name)
    } else {
      lines.push(
        `• ${name}: ${events} visitas · ${orders.length} pedidos · €${revenue.toFixed(2)}`
      )
    }
  }

  const dateStr = yesterday.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Lisbon',
  })

  const message =
    `📊 NEXO Daily — ${dateStr}\n\n` +
    `Clientes activos: ${menus.length}\n` +
    `Total visitas: ${totalEvents}\n` +
    `Total pedidos: ${totalOrders}\n` +
    `Total faturado: €${totalRevenue.toFixed(2)}\n` +
    `Chamadas staff: ${totalCalls}\n\n` +
    (lines.length > 0 ? `Por cliente:\n${lines.join('\n')}\n\n` : '') +
    (silentMenus.length > 0
      ? `⚠️ Sem actividade ontem:\n${silentMenus.map(n => `• ${n}`).join('\n')}\n\n`
      : '') +
    (totalEvents > 0
      ? `✅ Sistema operacional`
      : `⚠️ Zero eventos — verificar sistema`)

  const key   = Deno.env.get('CALLMEBOT_KEY')
  const phone = Deno.env.get('CAIO_WHATSAPP_NUMBER')

  if (key && phone) {
    await fetch(
      `https://api.callmebot.com/whatsapp.php` +
      `?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${key}`
    ).catch(() => {})
  }

  return new Response(
    JSON.stringify({ sent: true, date: yesterday.toISOString().split('T')[0], message }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
