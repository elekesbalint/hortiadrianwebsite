'use server'

import { supabase, createServerSupabaseClient } from '@/lib/supabase'

export type AppCategory = { id: string; slug: string; name: string; show_in_header: boolean; order: number; image: string | null; icon: string | null; detail_page_title: string | null }

function getAdminClient() {
  try {
    return createServerSupabaseClient()
  } catch {
    return null
  }
}

export async function getCategories(): Promise<AppCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, show_in_header, "order", image, icon, detail_page_title')
    .order('order', { ascending: true })
  if (error) {
    if (String(error.message || '').includes('show_in_header')) {
      const fallback = await supabase.from('categories').select('id, slug, name, "order", icon, detail_page_title').order('order', { ascending: true })
      const rows = (fallback.data ?? []) as { id: string; slug: string; name: string; order?: number; icon?: string | null; detail_page_title?: string | null }[]
      return rows.map((r) => ({ ...r, show_in_header: true, order: r.order ?? 0, image: null, icon: r.icon ?? null, detail_page_title: r.detail_page_title ?? null }))
    }
    console.error('getCategories error', error)
    return []
  }
  return ((data ?? []) as { id: string; slug: string; name: string; show_in_header?: boolean; order?: number; image?: string | null; icon?: string | null; detail_page_title?: string | null }[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    show_in_header: r.show_in_header ?? true,
    order: r.order ?? 0,
    image: r.image ?? null,
    icon: r.icon ?? null,
    detail_page_title: r.detail_page_title ?? null,
  }))
}

/** Csak a headerben megjelenítendő kategóriák (navigációhoz, ikonnal). */
export async function getCategoriesForHeader(): Promise<{ id: string; slug: string; name: string; icon: string | null }[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, icon')
    .eq('is_active', true)
    .eq('show_in_header', true)
    .order('order', { ascending: true })
  if (error) {
    if (String(error.message || '').includes('show_in_header')) {
      const fallback = await supabase.from('categories').select('id, slug, name, icon').eq('is_active', true).order('order', { ascending: true })
      const rows = (fallback.data ?? []) as { id: string; slug: string; name: string; icon?: string | null }[]
      return rows.map((r) => ({ ...r, icon: r.icon ?? null }))
    }
    console.error('getCategoriesForHeader error', error)
    return []
  }
  return ((data ?? []) as { id: string; slug: string; name: string; icon?: string | null }[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    icon: r.icon ?? null,
  }))
}

export async function insertCategory(slug: string, name: string, show_in_header = true, image: string | null = null, icon: string | null = null, detail_page_title: string | null = null): Promise<{ id: string } | null> {
  const admin = getAdminClient()
  if (!admin) {
    console.error('insertCategory: SUPABASE_SERVICE_ROLE_KEY hiányzik')
    return null
  }
  const row = { slug, name, order: 0, is_active: true, show_in_header, image: image || null, icon: icon || null, detail_page_title: detail_page_title ?? null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('categories') as any).insert(row).select('id').single()
  if (error) {
    console.error('insertCategory error', error)
    return null
  }
  return data ? { id: (data as { id: string }).id } : null
}

export async function updateCategory(
  id: string,
  slug: string,
  name: string,
  opts?: { show_in_header?: boolean; image?: string | null; icon?: string | null; detail_page_title?: string | null; order?: number }
): Promise<boolean> {
  const admin = getAdminClient()
  if (!admin) {
    console.error('updateCategory: SUPABASE_SERVICE_ROLE_KEY hiányzik')
    return false
  }
  const update: { slug: string; name: string; show_in_header?: boolean; image?: string | null; icon?: string | null; detail_page_title?: string | null; order?: number } = { slug, name }
  if (opts?.show_in_header !== undefined) update.show_in_header = opts.show_in_header
  if (opts?.image !== undefined) update.image = opts.image
  if (opts?.icon !== undefined) update.icon = opts.icon
  if (opts?.detail_page_title !== undefined) update.detail_page_title = opts.detail_page_title
  if (opts?.order !== undefined) update.order = opts.order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result = await (admin.from('categories') as any).update(update).eq('id', id)
  if (result.error && String(result.error.message || '').includes('show_in_header')) {
    result = await (admin.from('categories') as any).update({ slug, name, ...(opts?.image !== undefined && { image: opts.image }), ...(opts?.icon !== undefined && { icon: opts.icon }), ...(opts?.detail_page_title !== undefined && { detail_page_title: opts.detail_page_title }), ...(opts?.order !== undefined && { order: opts.order }) }).eq('id', id)
  }
  if (result.error) {
    console.error('updateCategory error', result.error)
    return false
  }
  return true
}

export async function deleteCategory(id: string): Promise<boolean> {
  const admin = getAdminClient()
  if (!admin) {
    console.error('deleteCategory: SUPABASE_SERVICE_ROLE_KEY hiányzik')
    return false
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('categories') as any).delete().eq('id', id)
  if (error) {
    console.error('deleteCategory error', error)
    return false
  }
  return true
}

/** Fel/Le: kategória sorrendjének cseréje a szomszédossal. */
export async function moveCategoryUp(id: string): Promise<boolean> {
  const list = await getCategories()
  const idx = list.findIndex((c) => c.id === id)
  if (idx <= 0) return true
  const admin = getAdminClient()
  if (!admin) return false
  const prev = list[idx - 1]
  const curr = list[idx]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u1 = await (admin.from('categories') as any).update({ order: prev.order }).eq('id', curr.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u2 = await (admin.from('categories') as any).update({ order: curr.order }).eq('id', prev.id)
  return !u1.error && !u2.error
}

export async function moveCategoryDown(id: string): Promise<boolean> {
  const list = await getCategories()
  const idx = list.findIndex((c) => c.id === id)
  if (idx < 0 || idx >= list.length - 1) return true
  const admin = getAdminClient()
  if (!admin) return false
  const next = list[idx + 1]
  const curr = list[idx]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u1 = await (admin.from('categories') as any).update({ order: next.order }).eq('id', curr.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u2 = await (admin.from('categories') as any).update({ order: curr.order }).eq('id', next.id)
  return !u1.error && !u2.error
}
