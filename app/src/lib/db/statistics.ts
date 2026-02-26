'use client'

import { supabase } from '@/lib/supabase'

export type StatEventType = 'page_view' | 'place_view' | 'place_click' | 'direction_click'

const COOKIE_CONSENT_KEY = 'programlaz_cookie_consent'

function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return false
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
  return consent === 'accepted'
}

export async function recordStatistic(eventType: StatEventType, placeId?: string | null): Promise<void> {
  if (!hasCookieConsent()) return

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('statistics').insert({
      event_type: eventType,
      place_id: placeId ?? null,
      user_id: user?.id ?? null,
    } as any)

    if (error) {
      // Nem dobjuk tovább, csak logoljuk, hogy a felhasználói élményt ne zavarja
      console.warn('[statistics] insert error:', error.message)
    }
  } catch (e) {
    console.warn('[statistics] record error:', e)
  }
}

