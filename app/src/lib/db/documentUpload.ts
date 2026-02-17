'use client'

import { supabase } from '@/lib/supabase'

const BUCKET = 'documents'

/** PDF feltöltése a documents bucketbe; visszaadja a nyilvános URL-t, vagy null. */
export async function uploadPartnereinknekPdf(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
  if (ext !== 'pdf') {
    console.error('uploadPartnereinknekPdf: only PDF allowed')
    return null
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const path = `partnereinknek/${user.id}-${Date.now()}.pdf`
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (error) {
    console.error('uploadPartnereinknekPdf error', error)
    return null
  }
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return urlData?.publicUrl ?? null
}
