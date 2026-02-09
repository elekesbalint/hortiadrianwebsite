'use server'

import { supabase, createServerSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

/** Admin írásokhoz (RLS kihagyása); hiányzó key esetén null. */
function getAdminClient() {
  try {
    return createServerSupabaseClient()
  } catch {
    return null
  }
}

type PlaceRow = Database['public']['Tables']['places']['Row']
type PlaceRowWithCategory = PlaceRow & { categories: { name: string; slug: string } | null }

export type AppPlace = {
  id: string
  name: string
  category: string
  category_id: string
  categorySlug: string
  description: string
  address: string
  rating: number
  ratingCount: number
  isOpen: boolean
  isPremium: boolean
  priceLevel: number
  lat: number
  lng: number
  imageUrl: string
  /** Teljes fotólista: első = hero/banner, többi = Fotók fülön */
  images: string[]
  slug: string
  menuUrl?: string | null
  website?: string | null
  instagram?: string | null
  facebook?: string | null
  youtube?: string | null
  tiktok?: string | null
  email?: string | null
  featured_order?: number | null
  distance?: number
  /** Helyhez rendelt szűrők ID-k */
  filterIds?: string[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'hely'
}

/** Egyedi slug generálása: ha a slug már létezik, hozzáad egy számot a végéhez. */
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 2
  while (true) {
    // UNIQUE constraint minden helyre vonatkozik (aktív és inaktív is), ezért minden helyet ellenőrizünk
    const query = supabase
      .from('places')
      .select('id')
      .eq('slug', slug)
      .limit(1)
    if (excludeId) {
      query.neq('id', excludeId)
    }
    const { data } = await query
    if (!data || data.length === 0) {
      return slug
    }
    slug = `${baseSlug}-${counter}`
    counter++
    // Biztonsági limit, hogy ne legyen végtelen ciklus
    if (counter > 1000) {
      // Ha 1000 próbálkozás után sem találunk egyedi slug-ot, timestamp-et adunk hozzá
      slug = `${baseSlug}-${Date.now()}`
      return slug
    }
  }
}

function rowToAppPlace(row: PlaceRowWithCategory): AppPlace {
  const images: string[] = Array.isArray(row.images) ? (row.images as string[]) : []
  return {
    id: row.id,
    name: row.name,
    category: row.categories?.name ?? '',
    category_id: row.category_id,
    categorySlug: row.categories?.slug ?? '',
    description: row.description ?? '',
    address: row.address,
    rating: row.rating,
    ratingCount: row.rating_count,
    isOpen: row.is_open,
    isPremium: row.is_premium,
    priceLevel: row.price_level ?? 2,
    lat: row.latitude,
    lng: row.longitude,
    imageUrl: images.length > 0 ? images[0] : '',
    images,
    slug: row.slug,
    menuUrl: row.menu_url ?? null,
    website: row.website ?? null,
    instagram: row.instagram ?? null,
    facebook: row.facebook ?? null,
    youtube: row.youtube ?? null,
    tiktok: row.tiktok ?? null,
    email: row.email ?? null,
    featured_order: (row as PlaceRowWithCategory & { featured_order?: number | null }).featured_order ?? null,
  }
}

export async function getPlaces(): Promise<AppPlace[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getPlaces error', error)
    return []
  }
  const places = (data ?? []).map((r) => rowToAppPlace(r as PlaceRowWithCategory))
  
  // Helyekhez rendelt szűrők betöltése
  if (places.length > 0) {
    const placeIds = places.map((p) => p.id)
    const { data: placeFiltersData } = await supabase
      .from('place_filters')
      .select('place_id, filter_id')
      .in('place_id', placeIds)
    
    // Szűrők csoportosítása hely szerint
    const filtersByPlaceId = new Map<string, string[]>()
    if (placeFiltersData) {
      for (const pf of placeFiltersData as { place_id: string; filter_id: string }[]) {
        if (!filtersByPlaceId.has(pf.place_id)) {
          filtersByPlaceId.set(pf.place_id, [])
        }
        filtersByPlaceId.get(pf.place_id)!.push(pf.filter_id)
      }
    }
    
    // Szűrők hozzáadása a helyekhez
    return places.map((p) => ({
      ...p,
      filterIds: filtersByPlaceId.get(p.id) ?? [],
    }))
  }
  
  return places
}

/** Felkapott helyek a kezdőlaphoz: featured_order szerint, max 12. */
export async function getFeaturedPlaces(): Promise<AppPlace[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .not('featured_order', 'is', null)
    .order('featured_order', { ascending: true })
    .limit(12)
  if (error) {
    console.error('getFeaturedPlaces error', error)
    return []
  }
  const places = (data ?? []).map((r) => rowToAppPlace(r as PlaceRowWithCategory))
  
  // Helyekhez rendelt szűrők betöltése
  if (places.length > 0) {
    const placeIds = places.map((p) => p.id)
    const { data: placeFiltersData } = await supabase
      .from('place_filters')
      .select('place_id, filter_id')
      .in('place_id', placeIds)
    
    const filtersByPlaceId = new Map<string, string[]>()
    if (placeFiltersData) {
      for (const pf of placeFiltersData as { place_id: string; filter_id: string }[]) {
        if (!filtersByPlaceId.has(pf.place_id)) {
          filtersByPlaceId.set(pf.place_id, [])
        }
        filtersByPlaceId.get(pf.place_id)!.push(pf.filter_id)
      }
    }
    
    return places.map((p) => ({
      ...p,
      filterIds: filtersByPlaceId.get(p.id) ?? [],
    }))
  }
  
  return places
}

export async function getPlaceById(id: string): Promise<AppPlace | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*, categories(name, slug)')
    .eq('id', id)
    .eq('is_active', true)
    .single()
  if (error || !data) return null
  return rowToAppPlace(data as PlaceRowWithCategory)
}

/** Hely lekérése slug alapján (SEO-barát URL-hez). */
export async function getPlaceBySlug(slug: string): Promise<AppPlace | null> {
  // URL-decode, ha szükséges
  const decodedSlug = decodeURIComponent(slug)
  
  // Először próbáljuk meg a decode-olt slug-gal
  let { data, error } = await supabase
    .from('places')
    .select('*, categories(name, slug)')
    .eq('slug', decodedSlug)
    .eq('is_active', true)
    .single()
  
  // Ha nem található, próbáljuk meg az eredeti slug-gal is (hátha már decode-olva volt)
  if (error && decodedSlug !== slug) {
    const { data: data2, error: error2 } = await supabase
      .from('places')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (!error2 && data2) {
      data = data2
      error = null
    }
  }
  
  if (error || !data) return null
  return rowToAppPlace(data as PlaceRowWithCategory)
}

export async function getPlacesByIds(ids: string[]): Promise<AppPlace[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('places')
    .select('*, categories(name, slug)')
    .in('id', ids)
    .eq('is_active', true)
  if (error) {
    console.error('getPlacesByIds error', error)
    return []
  }
  const places = (data ?? []).map((r) => rowToAppPlace(r as PlaceRowWithCategory))
  
  // Helyekhez rendelt szűrők betöltése
  if (places.length > 0) {
    const { data: placeFiltersData } = await supabase
      .from('place_filters')
      .select('place_id, filter_id')
      .in('place_id', ids)
    
    const filtersByPlaceId = new Map<string, string[]>()
    if (placeFiltersData) {
      for (const pf of placeFiltersData as { place_id: string; filter_id: string }[]) {
        if (!filtersByPlaceId.has(pf.place_id)) {
          filtersByPlaceId.set(pf.place_id, [])
        }
        filtersByPlaceId.get(pf.place_id)!.push(pf.filter_id)
      }
    }
    
    return places.map((p) => ({
      ...p,
      filterIds: filtersByPlaceId.get(p.id) ?? [],
    }))
  }
  
  return places
}

export type PlaceFormInput = {
  name: string
  category_id: string
  description: string
  address: string
  rating: number
  ratingCount: number
  isOpen: boolean
  isPremium: boolean
  priceLevel: number
  lat: number
  lng: number
  imageUrl: string
  /** Teljes fotólista (első = fő kép, többi = galéria). Ha megadva, felülírja az imageUrl-ból származó [imageUrl]-t. */
  images?: string[]
  menuUrl?: string | null
  /** 0 vagy üres = nem felkapott; 1, 2, 3... = sorrend a kezdőlapon */
  featured_order?: number | null
  website?: string | null
  instagram?: string | null
  facebook?: string | null
  youtube?: string | null
  tiktok?: string | null
  email?: string | null
}

export async function insertPlace(input: PlaceFormInput): Promise<{ id: string } | { error: string }> {
  const baseSlug = slugify(input.name)
  const slug = await ensureUniqueSlug(baseSlug)
  const baseRow = {
    name: input.name,
    slug,
    description: input.description || null,
    category_id: input.category_id,
    address: input.address,
    city: input.address.split(',')[0]?.trim() ?? '',
    county: null,
    latitude: input.lat,
    longitude: input.lng,
    phone: null,
    email: input.email ?? null,
    website: input.website ?? null,
    instagram: input.instagram ?? null,
    facebook: input.facebook ?? null,
    youtube: input.youtube ?? null,
    tiktok: input.tiktok ?? null,
    opening_hours: null,
    is_open: input.isOpen,
    is_premium: input.isPremium,
    price_level: input.priceLevel,
    rating: input.rating,
    rating_count: input.ratingCount,
    images: input.images !== undefined ? input.images : (input.imageUrl ? [input.imageUrl] : []),
    menu_url: input.menuUrl || null,
    features: [],
    is_active: true,
  }
  const rowWithFeatured = {
    ...baseRow,
    featured_order: input.featured_order && input.featured_order > 0 ? input.featured_order : null,
  }
  const admin = getAdminClient()
  if (!admin) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY hiányzik. Admin mentéshez szükséges a .env.local-ban.' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result = await (admin.from('places') as any).insert(rowWithFeatured).select('id').single()
  if (result.error && (String(result.error.message || '').includes('featured_order') || String(result.error.message || '').includes('does not exist'))) {
    result = await (admin.from('places') as any).insert(baseRow).select('id').single()
  }
  const { data, error } = result
  if (error) {
    console.error('insertPlace error', error)
    const msg = error.message || String(error)
    return { error: msg.includes('featured_order') ? 'A featured_order oszlop hiányzik. Futtasd a Supabase migrációt: 0012_featured_order.sql (SQL Editor).' : msg }
  }
  return data ? { id: (data as { id: string }).id } : { error: 'Ismeretlen hiba' }
}

export async function updatePlace(id: string, input: PlaceFormInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseSlug = slugify(input.name)
  const slug = await ensureUniqueSlug(baseSlug, id)
  const baseUpdate = {
    name: input.name,
    slug,
    description: input.description || null,
    category_id: input.category_id,
    address: input.address,
    city: input.address.split(',')[0]?.trim() ?? '',
    latitude: input.lat,
    longitude: input.lng,
    is_open: input.isOpen,
    is_premium: input.isPremium,
    price_level: input.priceLevel,
    rating: input.rating,
    rating_count: input.ratingCount,
    images: input.images !== undefined ? input.images : (input.imageUrl ? [input.imageUrl] : []),
    menu_url: input.menuUrl ?? null,
    website: input.website ?? null,
    instagram: input.instagram ?? null,
    facebook: input.facebook ?? null,
    youtube: input.youtube ?? null,
    tiktok: input.tiktok ?? null,
    email: input.email ?? null,
  }
  const updateWithFeatured = {
    ...baseUpdate,
    featured_order: input.featured_order && input.featured_order > 0 ? input.featured_order : null,
  }
  const admin = getAdminClient()
  if (!admin) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY hiányzik. Admin mentéshez szükséges a .env.local-ban.' }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result = await (admin.from('places') as any).update(updateWithFeatured).eq('id', id)
  if (result.error && (String(result.error.message || '').includes('featured_order') || String(result.error.message || '').includes('does not exist'))) {
    result = await (admin.from('places') as any).update(baseUpdate).eq('id', id)
  }
  const { error } = result
  if (error) {
    console.error('updatePlace error', error)
    const msg = error.message || String(error)
    return { ok: false, error: msg.includes('featured_order') ? 'A featured_order oszlop hiányzik. Futtasd a Supabase migrációt: 0012_featured_order.sql.' : msg }
  }
  return { ok: true }
}

export async function deletePlace(id: string): Promise<boolean> {
  const admin = getAdminClient()
  if (!admin) {
    console.error('deletePlace: SUPABASE_SERVICE_ROLE_KEY hiányzik')
    return false
  }
  // Tényleges törlés az adatbázisból (CASCADE miatt automatikusan törlődnek a kapcsolódó rekordok is:
  // favorites, reviews, place_filters. A statistics táblában a place_id SET NULL lesz.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('places') as any).delete().eq('id', id)
  if (error) {
    console.error('deletePlace error', error)
    return false
  }
  return true
}
