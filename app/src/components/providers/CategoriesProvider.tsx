'use client'

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import type { AppCategory } from '@/lib/db/categories'
import type { AppPlace } from '@/lib/db/places'
import type { SiteStatistic } from '@/lib/db/siteStatistics'

export type HeaderCategory = { id: string; slug: string; name: string; icon: string | null }

type CategoriesContextValue = {
  categories: AppCategory[]
  featuredCategories: AppCategory[]
  headerCategories: HeaderCategory[]
  places: AppPlace[]
  featuredPlaces: AppPlace[]
  upcomingEvents: AppPlace[]
  siteStats: SiteStatistic[]
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({
  children,
  initialCategories,
  initialFeaturedCategories,
  initialHeaderCategories,
  initialPlaces,
  initialFeaturedPlaces,
  initialUpcomingEvents,
  initialSiteStats,
}: {
  children: ReactNode
  initialCategories: AppCategory[]
  initialFeaturedCategories: AppCategory[]
  initialHeaderCategories: HeaderCategory[]
  initialPlaces: AppPlace[]
  initialFeaturedPlaces: AppPlace[]
  initialUpcomingEvents: AppPlace[]
  initialSiteStats: SiteStatistic[]
}) {
  const [categories] = useState<AppCategory[]>(initialCategories)
  const [featuredCategories] = useState<AppCategory[]>(initialFeaturedCategories)
  const [headerCategories] = useState<HeaderCategory[]>(initialHeaderCategories)
  const [places] = useState<AppPlace[]>(initialPlaces)
  const [featuredPlaces] = useState<AppPlace[]>(initialFeaturedPlaces)
  const [upcomingEvents] = useState<AppPlace[]>(initialUpcomingEvents)
  const [siteStats] = useState<SiteStatistic[]>(initialSiteStats)

  const value = useMemo(
    () => ({
      categories,
      featuredCategories,
      headerCategories,
      places,
      featuredPlaces,
      upcomingEvents,
      siteStats,
    }),
    [categories, featuredCategories, headerCategories, places, featuredPlaces, upcomingEvents, siteStats]
  )

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategoriesContext(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext)
  if (!ctx) {
    throw new Error('useCategoriesContext must be used within CategoriesProvider')
  }
  return ctx
}
