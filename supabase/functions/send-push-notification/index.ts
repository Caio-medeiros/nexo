import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { espaco_slug, table_label } = await req.json()

    if (!espaco_slug) {
      return new Response(
        JSON.stringify({ error: 'espaco_slug required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    webpush.setVapidDetails(
      Deno.env.get('VAPID_EMAIL')!,
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('espaco_slug', espaco_slug)
      .eq('is_active', true)

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ delivered: 0, message: 'No active subscriptions' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tableText = table_label || 'Mesa não especificada'

    const payload = JSON.stringify({
      title: '🙋 Chamada de Mesa',
      body: `${tableText} — precisa de assistência`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: `staff-call-${Date.now()}`,
      renotify: true,
      vibrate: [200, 100, 200, 100, 200],
      data: { espaco_slug, table_label, url: '/' }
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, payload)
          return { id: sub.id, success: true }
        } catch (err: unknown) {
          // Deactivate expired/invalid subscriptions (HTTP 410 Gone)
          if (err instanceof Error && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', sub.id)
          }
          return { id: sub.id, success: false }
        }
      })
    )

    const delivered = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length

    await supabase.from('staff_calls').insert({
      espaco_slug,
      table_label: tableText,
      delivered_count: delivered,
    })

    return new Response(
      JSON.stringify({ delivered, total: subscriptions.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
