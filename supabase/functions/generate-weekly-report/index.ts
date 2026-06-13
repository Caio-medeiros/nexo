import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Relatório semanal SEM custo de API — gerado por regras a partir das métricas.
// (Não usa Anthropic/OpenAI. Zero custo, zero rate limits, funciona offline.)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const LANGS: Record<string, string> = {
  pt: 'Português', en: 'Inglês', es: 'Espanhol', fr: 'Francês', de: 'Alemão', it: 'Italiano',
}
const eur = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n || 0)

function buildReport(name: string, ws: string, we: string, m: any): string {
  const d = (s: string) => {
    const [y, mo, da] = s.split('-')
    return `${da}/${mo}`
  }
  const parts: string[] = []

  // Abertura
  parts.push(
    `Relatório de ${d(ws)} a ${d(we)} para ${name}. ` +
    `Esta semana o menu digital teve ${m.sessions} ${m.sessions === 1 ? 'visita' : 'visitas'} ` +
    `e ${m.items_viewed} ${m.items_viewed === 1 ? 'prato visto' : 'pratos vistos'}.`,
  )

  // Pontos positivos
  const pos: string[] = []
  if (m.orders_placed > 0) {
    pos.push(
      `Foram registados ${m.orders_placed} ${m.orders_placed === 1 ? 'pedido' : 'pedidos'}` +
      (m.total_revenue > 0 ? `, num total de ${eur(m.total_revenue)}` : ''),
    )
  }
  if (m.google_clicks > 0) {
    pos.push(
      `${m.google_clicks} ${m.google_clicks === 1 ? 'cliente seguiu' : 'clientes seguiram'} ` +
      `para deixar avaliação no Google — visibilidade que normalmente custaria a pedir à mão`,
    )
  }
  if (m.reservations > 0) {
    pos.push(
      `recebeu ${m.reservations} ${m.reservations === 1 ? 'reserva' : 'reservas'} online ` +
      `(${m.reservations_confirmed} ${m.reservations_confirmed === 1 ? 'confirmada' : 'confirmadas'}), sem comissões`,
    )
  }
  if (m.top_items && m.top_items.length) {
    pos.push(`o prato mais visto foi "${m.top_items[0][0]}"`)
  }
  if (pos.length) {
    parts.push('Destaques: ' + pos.slice(0, 3).join('; ') + '.')
  } else {
    parts.push('Foi uma semana mais calma — bom momento para divulgar o menu nas redes e na porta do espaço.')
  }

  // Idiomas
  const langEntries = Object.entries(m.languages || {}).sort(
    (a: any, b: any) => b[1] - a[1],
  )
  if (langEntries.length > 1) {
    const top = langEntries.slice(0, 3).map(([l, c]) => `${LANGS[l] ?? l} (${c})`).join(', ')
    parts.push(`Os clientes consultaram o menu em vários idiomas: ${top}. Vale a pena manter as traduções afinadas.`)
  }

  // Hora de pico
  if (m.sessions > 0) {
    parts.push(`O pico de movimento foi por volta das ${m.peak_hour}h — reforce a equipa e os destaques nesse horário.`)
  }

  // Ponto de atenção
  if (m.reviews_prompted > 0 && m.google_clicks === 0) {
    parts.push(`Atenção: pediu ${m.reviews_prompted} avaliações mas nenhuma chegou ao Google. Reveja o momento em que o pedido aparece.`)
  } else if (m.staff_calls > 5) {
    parts.push(`Atenção: ${m.staff_calls} chamadas de mesa esta semana. Se for recorrente nas mesmas alturas, pode indicar falta de apoio em sala no pico.`)
  } else if (m.reservations > 0 && m.reservations_confirmed < m.reservations) {
    const pend = m.reservations - m.reservations_confirmed
    parts.push(`Atenção: ${pend} ${pend === 1 ? 'reserva ficou' : 'reservas ficaram'} por confirmar. Confirmar cedo reduz faltas.`)
  }

  // Sugestão concreta
  if (m.google_clicks > 0) {
    parts.push(`Sugestão: responda às avaliações recentes do Google — aumenta a confiança de quem procura o espaço.`)
  } else if (m.top_items && m.top_items.length) {
    parts.push(`Sugestão: destaque "${m.top_items[0][0]}" no topo do menu ou sugira um acompanhamento para aumentar o valor médio por mesa.`)
  } else {
    parts.push(`Sugestão: partilhe o link do menu e das reservas no Instagram e no Google para atrair mais visitas na próxima semana.`)
  }

  return parts.join('\n\n')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { espaco_slug, week_start, week_end, espaco_name } = await req.json()

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Relatório em cache?
    const { data: existing } = await db
      .from('weekly_reports')
      .select('report_text, metrics_snapshot')
      .eq('espaco_slug', espaco_slug)
      .eq('week_start', week_start)
      .maybeSingle()
    if (existing) {
      return new Response(
        JSON.stringify({ report: existing.report_text, metrics: existing.metrics_snapshot, cached: true }),
        { headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    const [evRes, ordRes, resRes, callRes] = await Promise.all([
      db.from('menu_events').select('*').eq('espaco_slug', espaco_slug)
        .gte('created_at', week_start).lte('created_at', week_end + 'T23:59:59Z'),
      db.from('orders_log').select('*').eq('espaco_slug', espaco_slug)
        .gte('created_at', week_start).lte('created_at', week_end + 'T23:59:59Z'),
      db.from('reservations').select('*').eq('espaco_slug', espaco_slug)
        .gte('reservation_date', week_start).lte('reservation_date', week_end),
      db.from('staff_calls').select('*').eq('espaco_slug', espaco_slug)
        .gte('created_at', week_start).lte('created_at', week_end + 'T23:59:59Z'),
    ])

    const events = evRes.data ?? []
    const orders = ordRes.data ?? []
    const reservs = resRes.data ?? []
    const calls = callRes.data ?? []

    const get = (n: string) => events.filter((e) => e.event_name === n)
    const sessions = new Set(events.map((e) => e.session_id).filter(Boolean)).size
    const languages = events.reduce((acc: Record<string, number>, e) => {
      if (e.language) acc[e.language] = (acc[e.language] ?? 0) + 1
      return acc
    }, {})
    const topItems = events
      .filter((e) => e.event_name === 'item_viewed' && e.item_name)
      .reduce((acc: Record<string, number>, e) => {
        acc[e.item_name] = (acc[e.item_name] ?? 0) + 1
        return acc
      }, {})
    const topItemsSorted = Object.entries(topItems)
      .sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5)
    const hourCounts = Array(24).fill(0)
    events.forEach((e) => hourCounts[new Date(e.created_at).getHours()]++)
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
    const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)

    const metrics = {
      sessions,
      menu_opens: get('menu_opened').length,
      items_viewed: get('item_viewed').length,
      orders_placed: orders.length,
      total_revenue: totalRevenue,
      reviews_prompted: get('review_prompted').length,
      reviews_positive: get('review_positive').length,
      google_clicks: get('review_google_clicked').length,
      staff_calls: calls.length,
      reservations: reservs.length,
      reservations_confirmed: reservs.filter(
        (r) => r.status === 'confirmed' || r.status === 'seated' || r.status === 'completed',
      ).length,
      languages,
      top_items: topItemsSorted,
      peak_hour: peakHour,
    }

    const report = buildReport(espaco_name || 'o seu espaço', week_start, week_end, metrics)

    await db.from('weekly_reports').upsert({
      espaco_slug, week_start, week_end, report_text: report, metrics_snapshot: metrics,
    }, { onConflict: 'espaco_slug,week_start' })

    return new Response(
      JSON.stringify({ report, metrics }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }
})
