import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const DAYS: Record<string, string> = {
  '0': 'Dom',
  '1': 'Seg',
  '2': 'Ter',
  '3': 'Qua',
  '4': 'Qui',
  '5': 'Sex',
  '6': 'Sáb',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { reservation_id, type } = await req.json()
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: res } = await db
      .from('reservations').select('*')
      .eq('id', reservation_id).single()
    if (!res) {
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    const { data: settings } = await db
      .from('reservation_settings').select('*')
      .eq('espaco_slug', res.espaco_slug).maybeSingle()

    const date = new Date(res.reservation_date)
    const dayName = DAYS[date.getDay().toString()]
    const dateStr = date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    const timeStr = String(res.reservation_time).slice(0, 5)
    const firstName = res.guest_name.split(' ')[0]

    let restaurantMsg = ''
    let guestMsg = ''

    if (type === 'new_booking') {
      restaurantMsg =
        `🔔 *Nova Reserva*\n\n👤 ${res.guest_name}\n📱 ${res.guest_phone}\n👥 ${res.party_size} pessoa(s)\n📅 ${dayName}, ${dateStr}\n🕐 ${timeStr}${res.special_requests ? '\n💬 ' + res.special_requests : ''}\nRef: ${res.reference}`
      guestMsg =
        `Olá ${firstName}! 👋\n\nO seu pedido de reserva foi recebido.\n\n📅 ${dayName}, ${dateStr}\n🕐 ${timeStr}\n👥 ${res.party_size} pessoa(s)\nRef: *${res.reference}*\n\n${settings?.confirmation_message ?? 'Confirmamos brevemente.'}\n\n_Powered by NEXO._`
    }
    if (type === 'confirmation') {
      guestMsg =
        `✅ *Reserva confirmada!*\n\nOlá ${firstName}, a sua reserva está confirmada.\n\n📅 ${dayName}, ${dateStr}\n🕐 ${timeStr}\n👥 ${res.party_size} pessoa(s)\nRef: *${res.reference}*\n\nAté breve! 🍽️`
    }
    if (type === 'cancellation') {
      guestMsg =
        `A sua reserva (${res.reference}) foi cancelada. Para dúvidas contacte-nos diretamente.`
    }
    if (type === 'reminder') {
      guestMsg =
        `Olá ${firstName}! 😊\n\nLembrete: tem uma reserva *amanhã*.\n📅 ${dayName}, ${dateStr} às ${timeStr}\n👥 ${res.party_size} pessoa(s)\n\nSe precisar alterar, contacte-nos.`
      await db.from('reservations')
        .update({ reminded_at: new Date().toISOString() })
        .eq('id', reservation_id)
    }

    const results: Record<string, string> = {}

    if (restaurantMsg && settings?.whatsapp_notify) {
      const n = settings.whatsapp_notify.replace(/\D/g, '')
      results.restaurant_url = `https://wa.me/${n}?text=${encodeURIComponent(restaurantMsg)}`
    }
    if (guestMsg && res.guest_phone) {
      const n = res.guest_phone.replace(/\D/g, '')
      results.guest_url = `https://wa.me/${n}?text=${encodeURIComponent(guestMsg)}`
      results.guest_message = guestMsg
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }
})
