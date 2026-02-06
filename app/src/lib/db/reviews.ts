'use client'

import { supabase } from '@/lib/supabase'

export type AppReview = {
  id: string
  user_id: string
  place_id: string
  rating: number
  comment: string | null
  images: string[]
  user_name: string
  created_at: string
}

/** Egy hely értékelései (legújabb először). Kliensről hívandó. */
export async function getReviewsByPlaceId(placeId: string): Promise<AppReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, place_id, rating, comment, images, user_name, created_at')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getReviewsByPlaceId error', error)
    return []
  }
  return (data ?? []) as AppReview[]
}

const REVIEW_IMAGES_BUCKET = 'review-images'

/** Kép feltöltése értékeléshez. Visszaadja a nyilvános URL-t, vagy null. */
export async function uploadReviewImage(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const ext = file.name.split('.').pop() || 'jpg'
  const name = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from(REVIEW_IMAGES_BUCKET)
    .upload(name, file, { cacheControl: '3600', upsert: false })
  if (error) {
    console.error('uploadReviewImage error', error)
    return null
  }
  const { data: urlData } = supabase.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(data.path)
  return urlData?.publicUrl ?? null
}

/** Új értékelés írása. Kliensről hívandó (bejelentkezett user). images: opcionális feltöltött képek URL-jei. */
export async function addReview(
  placeId: string,
  rating: number,
  comment: string,
  images: string[] = []
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Felhasználó'
  // @ts-expect-error Supabase Tables type inference for reviews insert
  const { error } = await supabase.from('reviews').insert({
    user_id: user.id,
    place_id: placeId,
    rating,
    comment: comment.trim() || null,
    user_name: String(userName).trim() || 'Felhasználó',
    images: Array.isArray(images) && images.length > 0 ? images : [],
  })
  if (error) {
    console.error('addReview error', error)
    return false
  }
  return true
}
