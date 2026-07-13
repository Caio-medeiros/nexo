import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import { startInvocation, safeError, json } from '../_shared/observability.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-correlation-id',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { log, cid } = startInvocation('send-push-notification', req)

  try {
    const { espaco_slug, table_label } = await req.json()

    if (!espaco_slug) {
      log.warn('bad_request', { reason: 'espaco_slug em falta' })
      return json({ error: 'espaco_slug required', cid }, 400, corsHeaders)
    }
    log.info('start', { slug: espaco_slug, hasTable: !!table_label })

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
      log.info('no_subscriptions', { slug: espaco_slug })
      return json({ delivered: 0, message: 'No active subscriptions', cid }, 200, corsHeaders)
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

    const failed = subscriptions.length - delivered
    log.info('ok', { slug: espaco_slug, delivered, total: subscriptions.length, failed })
    return json({ delivered, total: subscriptions.length, cid }, 200, corsHeaders)

  } catch (err) {
    // String(err) vazava stack/detalhe interno → mensagem genérica + cid.
    return await safeError(err, {
      log, cid, fn: 'send-push-notification',
      publicMessage: 'Não foi possível enviar a notificação.',
      headers: corsHeaders,
    })
  }
})
