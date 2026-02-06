'use server'

import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import type { Database } from '@/types/database'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type SendPushResult = {
  ok: boolean
  sent: number
  failed: number
  message: string
}

export async function sendPushToAll(
  title: string,
  body: string,
  url?: string
): Promise<SendPushResult> {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublic || !vapidPrivate) {
    return { ok: false, sent: 0, failed: 0, message: 'VAPID kulcsok hiányoznak (.env.local: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY). Futtasd: npx web-push generate-vapid-keys' }
  }

  const supabase = getAdminSupabase()
  if (!supabase) {
    return { ok: false, sent: 0, failed: 0, message: 'Admin Supabase (SUPABASE_SERVICE_ROLE_KEY) hiányzik.' }
  }

  type SubRow = { id: string; endpoint: string; p256dh: string; auth: string }
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
  if (error) {
    return { ok: false, sent: 0, failed: 0, message: `Hiba: ${error.message}` }
  }
  const subs = (data ?? []) as SubRow[]
  if (!subs.length) {
    return { ok: true, sent: 0, failed: 0, message: 'Nincs feliratkozó. Egy felhasználó a Beállításokban engedélyezheti a push értesítéseket.' }
  }

  webpush.setVapidDetails(
    'mailto:admin@programlaz.hu',
    vapidPublic,
    vapidPrivate
  )

  // base64 -> base64url (web-push expects base64url for keys)
  const toBase64Url = (s: string) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const payload = JSON.stringify({
    title: title || 'Programláz',
    body: body || '',
    url: url || '/',
  })

  let sent = 0
  let failed = 0
  const toDelete: string[] = []

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: toBase64Url(sub.p256dh), auth: toBase64Url(sub.auth) },
        },
        payload,
        { TTL: 86400 }
      )
      sent++
    } catch (err: unknown) {
      failed++
      const code = err && typeof err === 'object' && 'statusCode' in err ? (err as { statusCode: number }).statusCode : 0
      if (code === 410 || code === 404) toDelete.push(sub.id)
    }
  }

  if (toDelete.length) {
    await supabase.from('push_subscriptions').delete().in('id', toDelete)
  }

  // Mentés az oldalon belüli értesítéslistához (minden fiókban látható: Fiók → Értesítések, header csengő)
  // @ts-expect-error Supabase Tables type inference for sent_notifications insert
  const { error: insertErr } = await supabase.from('sent_notifications').insert({
    title: title || 'Programláz',
    body: body || '',
    url: url || null,
  })

  let listNote = ''
  if (insertErr) {
    listNote = ' Az értesítéslistába mentés sikertelen – futtasd a Supabase migrációt: 0011_sent_notifications.sql (SQL Editor).'
  }

  return {
    ok: true,
    sent,
    failed,
    message: `Elküldve: ${sent}, sikertelen: ${failed}${toDelete.length ? ` (${toDelete.length} feliratkozás törölve).` : '.'}${listNote}`,
  }
}
