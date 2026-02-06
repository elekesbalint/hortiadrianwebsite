'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { recordStatistic } from '@/lib/db/statistics'

/**
 * Minden oldalváltáskor rögzít: page_view, és ha /hely/[id] akkor place_view is.
 */
export function StatisticsTracker() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    recordStatistic('page_view')

    const match = pathname.match(/^\/hely\/([a-f0-9-]+)$/i)
    if (match) {
      recordStatistic('place_view', match[1])
    }
  }, [pathname])

  return null
}
