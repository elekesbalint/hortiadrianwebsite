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
  const payload = {
    key: KEY_PARTNEREINKNEK,
    url,
    updated_at: new Date().toISOString(),
    updated_by: null,
  }
  // Table may be missing from generated Supabase types in build; cast via unknown
  const table = (admin as unknown as { from: (t: string) => { upsert: (v: typeof payload, o: { onConflict: string }) => Promise<{ error: { message: string } | null }> } }).from('site_documents')
  const { error } = await table.upsert(payload, { onConflict: 'key' })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Admin: eltávolítja a Partnereinknek dokumentumot (a nyilvános oldal nem fog PDF-et mutatni). */
export async function deletePartnereinknekPdf(): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServerSupabaseClient()
  type DeleteBuilder = { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> }
  const table = (admin as unknown as { from: (t: string) => { delete: () => DeleteBuilder } }).from('site_documents')
  const { error } = await table.delete().eq('key', KEY_PARTNEREINKNEK)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
