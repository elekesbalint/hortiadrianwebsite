'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY hiányzik')
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type SiteStatistic = {
  key: string
  value: number
  display_label: string | null
}

/** Publikus: statisztikák lekérése (mindenki láthatja) */
export async function getSiteStatistics(): Promise<SiteStatistic[]> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data, error } = await supabase
    .from('site_statistics')
    .select('key, value, display_label')
    .order('key')
  
  if (error) {
    console.error('[getSiteStatistics]', error)
    return []
  }
  
  return (data ?? []) as SiteStatistic[]
}

/** Admin: statisztikák frissítése */
export async function updateSiteStatistic(
  key: string,
  value: number,
  displayLabel?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getAdminClient()
    
    const { error } = await supabase
      .from('site_statistics')
      .upsert(
        {
          key,
          value,
          display_label: displayLabel || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      )
    
    if (error) {
      return { ok: false, error: error.message }
    }
    
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ismeretlen hiba' }
  }
}

/** Admin: összes statisztika lekérése */
export async function getSiteStatisticsForAdmin(): Promise<SiteStatistic[]> {
  const supabase = getAdminClient()
  
  const { data, error } = await supabase
    .from('site_statistics')
    .select('key, value, display_label')
    .order('key')
  
  if (error) {
    console.error('[getSiteStatisticsForAdmin]', error)
    return []
  }
  
  return (data ?? []) as SiteStatistic[]
}
