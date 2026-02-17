'use server'

import { supabase, createServerSupabaseClient } from '@/lib/supabase'

const KEY_PARTNEREINKNEK = 'partnereinknek'

/** Nyilvános: lekéri egy dokumentum URL-jét (pl. Partnereinknek PDF). */
export async function getSiteDocumentUrl(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('site_documents')
    .select('url')
    .eq('key', key)
    .maybeSingle()
  if (error) {
    console.error('[getSiteDocumentUrl]', error)
    return null
  }
  const row = data as { url: string } | null
  return row?.url ?? null
}

/** Partnereinknek oldal PDF URL-je. */
export async function getPartnereinknekPdfUrl(): Promise<string | null> {
  return getSiteDocumentUrl(KEY_PARTNEREINKNEK)
}

/** Admin: beállítja a Partnereinknek dokumentum URL-jét. */
export async function setPartnereinknekPdfUrl(url: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServerSupabaseClient()
  const { error } = await admin.from('site_documents').upsert(
    {
      key: KEY_PARTNEREINKNEK,
      url,
      updated_at: new Date().toISOString(),
      updated_by: null,
    },
    { onConflict: 'key' }
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
