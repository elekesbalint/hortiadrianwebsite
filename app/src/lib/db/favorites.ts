'use client'

import { supabase } from '@/lib/supabase'
import { getPlacesByIds } from '@/lib/db/places'
import type { AppPlace } from '@/lib/db/places'

/** Bejelentkezett user kedvenc helyeinek ID-i. Kliensről hívandó (session kell). */
export async function getFavoritePlaceIds(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('favorites')
    .select('place_id')
    // @ts-expect-error - Supabase type inference issue with user_id column after auth config change
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getFavoritePlaceIds error', error)
    return []
  }
  const rows = (data ?? []) as { place_id: string }[]
  return rows.map((r) => r.place_id)
}

/** Kedvenc helyek teljes adatai. Kliensről hívandó. */
export async function getFavoritePlaces(): Promise<AppPlace[]> {
  const ids = await getFavoritePlaceIds()
  if (ids.length === 0) return []
  return getPlacesByIds(ids)
}

/** Kedvencnek jelölés. Kliensről hívandó. */
export async function addFavorite(placeId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('favorites')
    // @ts-expect-error Supabase Tables type inference for favorites insert
    .insert({ user_id: user.id, place_id: placeId })
  if (error) {
    if (error.code === '23505') return true // már benne van (unique)
    console.error('addFavorite error', error)
    return false
  }
  return true
}

/** Kedvencből törlés. Kliensről hívandó. */
export async function removeFavorite(placeId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('favorites')
    .delete()
    // @ts-expect-error - Supabase type inference issue with user_id column after auth config change
    .eq('user_id', user.id)
    // @ts-expect-error - Supabase type inference issue after auth config change
    .eq('place_id', placeId)
  if (error) {
    console.error('removeFavorite error', error)
    return false
  }
  return true
}
