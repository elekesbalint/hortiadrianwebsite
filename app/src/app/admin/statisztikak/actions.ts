'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type StatsPeriod = 'day' | 'week' | 'month' | 'year'

export type StatsRow = {
  periodLabel: string
  periodKey: string
  page_views: number
  place_views: number
  place_clicks: number
  direction_clicks: number
}

export type StatsResult = {
  byPeriod: StatsRow[]
  totals: { page_views: number; place_views: number; place_clicks: number; direction_clicks: number }
  byPlace: { place_id: string; place_name: string; place_views: number; place_clicks: number; direction_clicks: number }[]
}

/** Service role kliens (RLS-t kihagyja); ha nincs key, null. */
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getDateRange(period: StatsPeriod): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date()
  switch (period) {
    case 'day':
      from.setDate(from.getDate() - 31)
      break
    case 'week':
      from.setDate(from.getDate() - 12 * 7)
      break
    case 'month':
      from.setMonth(from.getMonth() - 12)
      break
    case 'year':
      from.setFullYear(from.getFullYear() - 5)
      break
  }
  return { from, to }
}

function periodKey(date: Date, period: StatsPeriod): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  switch (period) {
    case 'year':
      return `${y}`
    case 'month':
      return `${y}-${m}`
    case 'week': {
      const start = new Date(date)
      const day = start.getDay()
      const diff = start.getDate() - (day === 0 ? 6 : day - 1)
      start.setDate(diff)
      const ym = start.getFullYear()
      const mm = String(start.getMonth() + 1).padStart(2, '0')
      const dd = String(start.getDate()).padStart(2, '0')
      return `${ym}-${mm}-${dd}`
    }
    default:
      return `${y}-${m}-${d}`
  }
}

function periodLabel(key: string, period: StatsPeriod): string {
  if (period === 'year') return key
  if (period === 'month') {
    const [y, m] = key.split('-')
    const months = ['jan', 'feb', 'már', 'ápr', 'máj', 'jún', 'júl', 'aug', 'szep', 'okt', 'nov', 'dec']
    return `${y} ${months[parseInt(m, 10) - 1] || m}`
  }
  if (period === 'week') return key
  return key
}

export async function getStatisticsForAdmin(
  period: StatsPeriod,
  placeId?: string | null
): Promise<StatsResult | null> {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return null
    const { from, to } = getDateRange(period)
    const fromStr = from.toISOString()
    const toStr = to.toISOString()

    let query = supabase
      .from('statistics')
      .select('id, place_id, event_type, created_at')
      .gte('created_at', fromStr)
      .lte('created_at', toStr)

    if (placeId) query = query.eq('place_id', placeId)
    const { data, error } = await query

    if (error) {
      console.error('[getStatisticsForAdmin]', error.message)
      return null
    }

    type StatRow = { created_at: string; event_type: string; place_id: string | null }
    const rows = (data ?? []) as StatRow[]

    const byPeriodMap = new Map<string, { page_views: number; place_views: number; place_clicks: number; direction_clicks: number }>()
    const totals = { page_views: 0, place_views: 0, place_clicks: 0, direction_clicks: 0 }
    const byPlaceMap = new Map<string, { place_views: number; place_clicks: number; direction_clicks: number }>()

    for (const r of rows) {
      const d = new Date(r.created_at)
      const key = periodKey(d, period)
      if (!byPeriodMap.has(key)) {
        byPeriodMap.set(key, { page_views: 0, place_views: 0, place_clicks: 0, direction_clicks: 0 })
      }
      const row = byPeriodMap.get(key)!
      switch (r.event_type) {
        case 'page_view': row.page_views++; totals.page_views++; break
        case 'place_view': row.place_views++; totals.place_views++; break
        case 'place_click': row.place_clicks++; totals.place_clicks++; break
        case 'direction_click': row.direction_clicks++; totals.direction_clicks++; break
      }
      if (r.place_id && (r.event_type === 'place_view' || r.event_type === 'place_click' || r.event_type === 'direction_click')) {
        if (!byPlaceMap.has(r.place_id)) {
          byPlaceMap.set(r.place_id, { place_views: 0, place_clicks: 0, direction_clicks: 0 })
        }
        const placeRow = byPlaceMap.get(r.place_id)!
        if (r.event_type === 'place_view') placeRow.place_views++
        if (r.event_type === 'place_click') placeRow.place_clicks++
        if (r.event_type === 'direction_click') placeRow.direction_clicks++
      }
    }

    const sortedKeys = Array.from(byPeriodMap.keys()).sort()
    const byPeriod: StatsRow[] = sortedKeys.map((key) => {
      const v = byPeriodMap.get(key)!
      return {
        periodLabel: periodLabel(key, period),
        periodKey: key,
        page_views: v.page_views,
        place_views: v.place_views,
        place_clicks: v.place_clicks,
        direction_clicks: v.direction_clicks,
      }
    })

    // Helynevek lekérése a byPlace-hoz
    const placeIds = Array.from(byPlaceMap.keys())
    let placeNames: Record<string, string> = {}
    if (placeIds.length > 0) {
      const { data } = await supabase.from('places').select('id, name').in('id', placeIds)
      const places = (data ?? []) as { id: string; name: string }[]
      placeNames = places.reduce<Record<string, string>>((acc, p) => {
        acc[p.id] = p.name
        return acc
      }, {})
    }
    const byPlace = placeIds.map((pid) => {
      const v = byPlaceMap.get(pid)!
      return {
        place_id: pid,
        place_name: placeNames[pid] || pid,
        place_views: v.place_views,
        place_clicks: v.place_clicks,
        direction_clicks: v.direction_clicks,
      }
    }).sort((a, b) => (b.place_clicks + b.place_views + b.direction_clicks) - (a.place_clicks + a.place_views + a.direction_clicks))

    return { byPeriod, totals, byPlace }
  } catch (e) {
    console.error('[getStatisticsForAdmin]', e)
    return null
  }
}
