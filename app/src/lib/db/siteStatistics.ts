'use server'

import { supabase, createServerSupabaseClient } from '@/lib/supabase'

export type SiteStatistic = {
  key: string
  value: number
  display_label: string | null
}

export async function getSiteStatistics(): Promise<SiteStatistic[]> {
  const { data, error } = await supabase
    .from('site_statistics')
    .select('key, value, display_label')
    .order('key', { ascending: true })
  if (error) {
    console.error('[getSiteStatistics]', error)
    return []
  }
  return (data ?? []) as SiteStatistic[]
}

function getAdminClient() {
  try {
    return createServerSupabaseClient()
  } catch {
    return null
  }
}

export async function updateSiteStatistic(
  key: string,
  value: number,
  displayLabel?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = getAdminClient()
  if (!admin) return { ok: false, error: 'Nincs admin kliens.' }
  const { error } = await (admin.from('site_statistics') as any).update({
    value,
    display_label: displayLabel ?? null,
    updated_at: new Date().toISOString(),
  }).eq('key', key)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getSiteStatisticsForAdmin(): Promise<SiteStatistic[]> {
  const admin = getAdminClient()
  if (!admin) return []
  const { data, error } = await admin.from('site_statistics').select('key, value, display_label').order('key', { ascending: true })
  if (error) {
    console.error('[getSiteStatisticsForAdmin]', error)
    return []
  }
  return (data ?? []) as SiteStatistic[]
}
