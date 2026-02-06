'use client'

import { supabase } from '@/lib/supabase'

const MENUS_BUCKET = 'menus'

/** Étlap feltöltése (JPG/PDF). Visszaadja a nyilvános URL-t, vagy null. */
export async function uploadMenuFile(placeId: string, file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
  const safeName = `${placeId}/${Date.now()}-menu.${ext}`
  const { data, error } = await supabase.storage
    .from(MENUS_BUCKET)
    .upload(safeName, file, { cacheControl: '3600', upsert: true })
  if (error) {
    console.error('uploadMenuFile error', error)
    return null
  }
  const { data: urlData } = supabase.storage.from(MENUS_BUCKET).getPublicUrl(data.path)
  return urlData?.publicUrl ?? null
}
