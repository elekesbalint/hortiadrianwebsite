'use server'

import { supabase, createServerSupabaseClient } from '@/lib/supabase'

function getAdminClient() {
  try {
    return createServerSupabaseClient()
  } catch {
    return null
  }
}

export type AppFilter = {
  id: string
  group_name: string
  group_slug: string
  name: string
  slug: string
  order: number
  is_active: boolean
}

export async function getFilters(): Promise<AppFilter[]> {
  const { data, error } = await supabase
    .from('filters')
    .select('id, group_name, group_slug, name, slug, order, is_active')
    .order('group_slug', { ascending: true })
    .order('order', { ascending: true })
    .order('name', { ascending: true })
  if (error) {
    console.error('getFilters error', error)
    return []
  }
  return (data ?? []) as AppFilter[]
}

/** Egyedi szűrőcsoportok (group_slug, group_name) – admin kategória szűrő hozzárendeléshez. */
export async function getFilterGroupOptions(): Promise<{ group_slug: string; group_name: string }[]> {
  const list = await getFilters()
  const seen = new Set<string>()
  const out: { group_slug: string; group_name: string }[] = []
  for (const f of list) {
    if (seen.has(f.group_slug)) continue
    seen.add(f.group_slug)
    out.push({ group_slug: f.group_slug, group_name: f.group_name })
  }
  return out.sort((a, b) => a.group_name.localeCompare(b.group_name))
}

export async function insertFilter(
  groupName: string,
  groupSlug: string,
  name: string,
  slug: string,
  order: number = 0
): Promise<{ id: string } | null> {
  const admin = getAdminClient()
  if (!admin) {
    console.error('insertFilter: SUPABASE_SERVICE_ROLE_KEY hiányzik')
    return null
  }
  const row = {
    group_name: groupName,
    group_slug: groupSlug,
    name,
    slug,
    order,
    is_active: true,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('filters') as any).insert(row).select('id').single()
  if (error) {
    console.error('insertFilter error', error)
    return null
  }
  return data ? { id: (data as { id: string }).id } : null
}

export async function updateFilter(
  id: string,
  groupName: string,
  groupSlug: string,
  name: string,
  slug: string,
  order: number,
  isActive: boolean
): Promise<boolean> {
  const admin = getAdminClient()
  if (!admin) {
    console.error('updateFilter: SUPABASE_SERVICE_ROLE_KEY hiányzik')
    return false
  }
  const update = { group_name: groupName, group_slug: groupSlug, name, slug, order, is_active: isActive }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('filters') as any).update(update).eq('id', id)
  if (error) {
    console.error('updateFilter error', error)
    return false
  }
  return true
}

export async function deleteFilter(id: string): Promise<boolean> {
  const admin = getAdminClient()
  if (!admin) {
    console.error('deleteFilter: SUPABASE_SERVICE_ROLE_KEY hiányzik')
    return false
  }
  const { error } = await admin.from('filters').delete().eq('id', id)
  if (error) {
    console.error('deleteFilter error', error)
    return false
  }
  return true
}

/** Helyhez rendelt szűrők lekérése */
export async function getPlaceFilters(placeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('place_filters')
    .select('filter_id')
    .eq('place_id', placeId)
  if (error) {
    console.error('getPlaceFilters error', error)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((row: { filter_id: string }) => row.filter_id)
}

/** Helyhez rendelt szűrők mentése (felülírja a meglévőket) */
export async function setPlaceFilters(placeId: string, filterIds: string[]): Promise<boolean> {
  const admin = getAdminClient()
  if (!admin) {
    console.error('setPlaceFilters: SUPABASE_SERVICE_ROLE_KEY hiányzik')
    return false
  }
  
  // Töröljük a meglévőket
  const { error: deleteError } = await admin
    .from('place_filters')
    .delete()
    .eq('place_id', placeId)
  
  if (deleteError) {
    console.error('setPlaceFilters delete error', deleteError)
    return false
  }
  
  // Újakat beszúrjuk
  if (filterIds.length > 0) {
    const rows = filterIds.map((filterId) => ({ place_id: placeId, filter_id: filterId }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (admin.from('place_filters') as any).insert(rows)
    if (insertError) {
      console.error('setPlaceFilters insert error', insertError)
      return false
    }
  }
  
  return true
}
