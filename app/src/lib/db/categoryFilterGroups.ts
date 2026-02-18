'use server'

import { supabase, createServerSupabaseClient } from '@/lib/supabase'

/** Összes kategória → szűrőcsoport (group_slug) lista. Publikus oldal használja. */
export async function getCategoryFilterGroupsMap(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('category_filter_groups')
    .select('category_id, group_slug')
  if (error) {
    console.error('getCategoryFilterGroupsMap error', error)
    return {}
  }
  const rows = (data ?? []) as { category_id: string; group_slug: string }[]
  const map: Record<string, string[]> = {}
  for (const row of rows) {
    if (!map[row.category_id]) map[row.category_id] = []
    map[row.category_id].push(row.group_slug)
  }
  return map
}

/** Egy kategóriához tartozó szűrőcsoport slug-ok (admin + publikus). */
export async function getFilterGroupSlugsForCategory(categoryId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('category_filter_groups')
    .select('group_slug')
    .eq('category_id', categoryId)
  if (error) {
    console.error('getFilterGroupSlugsForCategory error', error)
    return []
  }
  return ((data ?? []) as { group_slug: string }[]).map((r) => r.group_slug)
}

/** Kategória szűrőcsoportjainak felülírása (admin). */
export async function setFilterGroupsForCategory(
  categoryId: string,
  groupSlugs: string[]
): Promise<boolean> {
  const admin = createServerSupabaseClient()
  type Table = {
    delete: () => { eq: (col: string, val: string) => Promise<{ error: unknown }> }
    insert: (rows: { category_id: string; group_slug: string }[]) => Promise<{ error: unknown }>
  }
  const table = (admin as unknown as { from: (t: string) => Table }).from('category_filter_groups')
  const { error: deleteError } = await table.delete().eq('category_id', categoryId)
  if (deleteError) {
    console.error('setFilterGroupsForCategory delete error', deleteError)
    return false
  }
  if (groupSlugs.length > 0) {
    const rows = groupSlugs.map((group_slug) => ({ category_id: categoryId, group_slug }))
    const { error: insertError } = await table.insert(rows)
    if (insertError) {
      console.error('setFilterGroupsForCategory insert error', insertError)
      return false
    }
  }
  return true
}

/** Szűrőcsoport (group_slug) → kategórianevek (admin szűrők oldalhoz). */
export async function getCategoriesByFilterGroupSlug(groupSlug: string): Promise<{ id: string; name: string; slug: string }[]> {
  const { data, error } = await supabase
    .from('category_filter_groups')
    .select('category_id')
    .eq('group_slug', groupSlug)
  if (error) {
    console.error('getCategoriesByFilterGroupSlug error', error)
    return []
  }
  const categoryIds = ((data ?? []) as { category_id: string }[]).map((r) => r.category_id)
  if (categoryIds.length === 0) return []
  const { data: cats, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug')
    .in('id', categoryIds)
  if (catError) return []
  return (cats ?? []) as { id: string; name: string; slug: string }[]
}
