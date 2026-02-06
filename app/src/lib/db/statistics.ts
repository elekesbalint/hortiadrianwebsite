'use client'

import { supabase } from '@/lib/supabase'

export type StatEventType = 'page_view' | 'place_view' | 'place_click' | 'direction_click'

const COOKIE_CONSENT_KEY = 'programlaz_cookie_consent'

/**
 * Ellenőrzi, hogy a felhasználó elfogadta-e a cookie-kat.
 * Csak akkor rögzítünk statisztikákat, ha elfogadták.
 */
function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return false
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
  return consent === 'accepted'
}

/**
 * Ügyfél oldalon hívjuk: rögzíti a megtekintést/kattintást.
 * Anonim és bejelentkezett felhasználó is rögzíthet (RLS engedélyezi).
 * Csak akkor rögzít, ha a felhasználó elfogadta a cookie-kat.
 */
export async function recordStatistic(
  eventType: StatEventType,
  placeId?: string | null
): Promise<void> {
  // Csak akkor rögzítünk, ha elfogadták a cookie-kat
  if (!hasCookieConsent()) {
    return
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- statistics table Insert type not inferred by client
    const { error } = await supabase.from('statistics').insert({
      event_type: eventType,
      place_id: placeId ?? null,
      user_id: user?.id ?? null,
    } as any)
    if (error) console.warn('[statistics] insert error:', error.message)
  } catch (e) {
    console.warn('[statistics] record error:', e)
  }
}
