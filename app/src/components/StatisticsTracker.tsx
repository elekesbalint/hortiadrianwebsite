'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { recordStatistic } from '@/lib/db/statistics'
import { getPlaceBySlug } from '@/lib/db/places'

/**
 * Minden oldalváltáskor rögzít: page_view, és ha /hely/[slug] akkor place_view is.
 */
export function StatisticsTracker() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    recordStatistic('page_view')

    // Slug-alapú URL: /hely/[slug]
    const match = pathname.match(/^\/hely\/(.+)$/)
    if (match) {
      const slug = match[1]
      // Slug-ból lekérjük a place-t és a place.id-t használjuk a statisztikához
      getPlaceBySlug(slug).then((place) => {
        if (place) {
          recordStatistic('place_view', place.id)
        }
      })
    }
  }, [pathname])

  return null
}
