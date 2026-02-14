'use client'

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import type { AppCategory } from '@/lib/db/categories'

export type HeaderCategory = { id: string; slug: string; name: string; icon: string | null }

type CategoriesContextValue = {
  categories: AppCategory[]
  featuredCategories: AppCategory[]
  headerCategories: HeaderCategory[]
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({
  children,
  initialCategories,
  initialFeaturedCategories,
  initialHeaderCategories,
}: {
  children: ReactNode
  initialCategories: AppCategory[]
  initialFeaturedCategories: AppCategory[]
  initialHeaderCategories: HeaderCategory[]
}) {
  const [categories] = useState<AppCategory[]>(initialCategories)
  const [featuredCategories] = useState<AppCategory[]>(initialFeaturedCategories)
  const [headerCategories] = useState<HeaderCategory[]>(initialHeaderCategories)

  const value = useMemo(
    () => ({ categories, featuredCategories, headerCategories }),
    [categories, featuredCategories, headerCategories]
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
