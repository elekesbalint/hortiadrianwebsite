'use client'

import { supabase } from '@/lib/supabase'
import { optimizeImageForBanner } from '@/lib/imageOptimize'

const BUCKET = 'category-banners'

/** Kategória banner kép feltöltése (optimalizálás: átméretezés + jpeg minőség). Visszaadja a nyilvános URL-t, vagy null. */
export async function uploadCategoryBanner(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    console.error('uploadCategoryBanner: only image types allowed')
    return null
  }
  const toUpload = await optimizeImageForBanner(file)
  const fileToUpload = toUpload ?? file
  const finalExt = fileToUpload.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${finalExt}`
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, fileToUpload, { cacheControl: '3600', upsert: false })
  if (error) {
    console.error('uploadCategoryBanner error', error)
    return null
  }
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return urlData?.publicUrl ?? null
}
