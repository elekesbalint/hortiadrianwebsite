'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { recordStatistic } from '@/lib/db/statistics'
import { getPlaceBySlug } from '@/lib/db/places'

/**
 * Minden oldalváltáskor rögzíti:
 * - page_view
 * - ha /hely/[slug], akkor place_view is.
 */
export function StatisticsTracker() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    // Oldalmegtekintés
    void recordStatistic('page_view')

    // Hely részletes oldal: /hely/[slug]
    const match = pathname.match(/^\/hely\/(.+)$/)
    if (match) {
      const slug = match[1]
      getPlaceBySlug(slug).then((place) => {
        if (place) {
          void recordStatistic('place_view', place.id)
        }
      })
    }
  }, [pathname])

  return null
}

