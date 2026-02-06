'use server'

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import type { Database } from '@/types/database'
import { wrapNewsletterHtml } from './newsletterTemplate'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type NewsletterSubscribersResult = {
  emails: string[]
  error?: string
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscribersResult> {
  const supabase = getAdminSupabase()
  if (!supabase) {
    return { emails: [], error: 'Admin Supabase (SUPABASE_SERVICE_ROLE_KEY) hiányzik.' }
  }
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .order('created_at', { ascending: false })
  if (error) {
    return { emails: [], error: error.message }
  }
  const list = (data ?? []) as { email: string }[]
  const emails = list.map((r) => r.email)
  return { emails }
}

export type RemoveSubscriberResult = { ok: boolean; error?: string }

export async function removeNewsletterSubscriber(email: string): Promise<RemoveSubscriberResult> {
  const supabase = getAdminSupabase()
  if (!supabase) {
    return { ok: false, error: 'Admin Supabase hiányzik.' }
  }
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('email', email)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export type SendNewsletterResult = {
  ok: boolean
  sent: number
  failed: number
  message: string
}

export async function sendNewsletter(
  subject: string,
  htmlBody: string
): Promise<SendNewsletterResult> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL
    if (!apiKey || !fromEmail) {
      return {
        ok: false,
        sent: 0,
        failed: 0,
        message:
          'Resend nincs beállítva. .env.local: RESEND_API_KEY, RESEND_FROM_EMAIL (pl. Programláz <info@programlaz.hu>).',
      }
    }

    const supabase = getAdminSupabase()
    if (!supabase) {
      return { ok: false, sent: 0, failed: 0, message: 'Admin Supabase hiányzik.' }
    }

    const { data: rows, error } = await supabase
      .from('newsletter_subscribers')
      .select('email')
    if (error) {
      return { ok: false, sent: 0, failed: 0, message: `Hiba: ${error.message}` }
    }
    const list = (rows ?? []) as { email: string }[]
    const emails = list.map((r) => r.email)
    if (!emails.length) {
      return { ok: true, sent: 0, failed: 0, message: 'Nincs feliratkozó.' }
    }

    const resend = new Resend(apiKey)
    let sentCount = 0
    let failedCount = 0
    let firstError: string | null = null

    for (const to of emails) {
      try {
        const { error: sendErr } = await resend.emails.send({
          from: fromEmail,
          to,
          subject: subject || 'Hírlevél – Programláz',
          html: wrapNewsletterHtml(htmlBody || ''),
        })
        if (sendErr) {
          failedCount++
          if (!firstError) firstError = sendErr.message || JSON.stringify(sendErr)
        } else {
          sentCount++
        }
      } catch (err) {
        failedCount++
        if (!firstError) {
          firstError = err instanceof Error ? err.message : String(err)
        }
      }
    }

    const baseMessage = `Elküldve: ${sentCount}, sikertelen: ${failedCount}.`
    const message = firstError ? `${baseMessage} Első hiba: ${firstError}` : baseMessage
    return {
      ok: failedCount === 0,
      sent: sentCount,
      failed: failedCount,
      message,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      sent: 0,
      failed: 0,
      message: `Hiba: ${msg}`,
    }
  }
}
