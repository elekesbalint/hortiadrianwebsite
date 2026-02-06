'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Hírlevél feliratkozó hozzáadása (server-side, service role – nem függ az RLS-től). */
export async function addNewsletterSubscriber(email: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = email?.trim()?.toLowerCase()
  if (!normalized) return { ok: false, error: 'Érvénytelen e-mail.' }

  const supabase = getServiceSupabase()
  if (!supabase) return { ok: false, error: 'Szerver konfiguráció hiányzik.' }

  const { error } = await (supabase.from('newsletter_subscribers') as any).insert({
    email: normalized,
  })

  if (error) {
    if (error.code === '23505') return { ok: true } // már feliratkozott
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
