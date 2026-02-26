'use server'

import { supabase, createServerSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type CategoryViewRow = Database['public']['Tables']['category_view_stats']['Row']
type PlaceViewRow = Database['public']['Tables']['place_view_stats']['Row']

export type AggregatedCategoryView = CategoryViewRow & { name: string; slug: string }
export type AggregatedPlaceView = PlaceViewRow & { name: string; category_name: string | null }

/** Napi kategória megtekintések adott dátumtartományban (alap: utolsó 90 nap). */
export async function getCategoryViewStats(from: string, to: string): Promise<AggregatedCategoryView[]> {
  const admin = createServerSupabaseClient()
  const { data, error } = await admin
    .from('category_view_stats')
    .select('category_id, date, views, categories(name, slug)')
    .gte('date', from)
    .lte('date', to)

  if (error || !data) return []
  return (data as unknown as (CategoryViewRow & { categories: { name: string; slug: string } | null })[])
    .map((row) => ({
      category_id: row.category_id,
      date: row.date,
      views: row.views,
      name: row.categories?.name ?? '',
      slug: row.categories?.slug ?? '',
    }))
}

/** Napi hely megtekintések adott dátumtartományban (alap: utolsó 90 nap). */
export async function getPlaceViewStats(from: string, to: string): Promise<AggregatedPlaceView[]> {
  const admin = createServerSupabaseClient()
  const { data, error } = await admin
    .from('place_view_stats')
    .select('place_id, date, views, places(name, categories(name))')
    .gte('date', from)
    .lte('date', to)

  if (error || !data) return []
  return (data as unknown as (PlaceViewRow & { places: { name: string; categories: { name: string } | null } | null })[])
    .map((row) => ({
      place_id: row.place_id,
      date: row.date,
      views: row.views,
      name: row.places?.name ?? '',
      category_name: row.places?.categories?.name ?? null,
    }))
}

