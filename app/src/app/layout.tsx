import type { Metadata } from 'next'
import { Dancing_Script } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { getCategories, getFeaturedCategories, getCategoriesForHeader } from '@/lib/db/categories'
import { getPlaces, getFeaturedPlaces } from '@/lib/db/places'
import { getSiteStatistics } from '@/lib/db/siteStatistics'
import { CategoriesProvider } from '@/components/providers/CategoriesProvider'

const fontBrand = Dancing_Script({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-brand',
  display: 'swap',
})
import { Footer } from '@/components/layout/Footer'
import { CookieConsent } from '@/components/layout/CookieConsent'
import { AuthProviderWrapper } from '@/components/providers/AuthProviderWrapper'
import { StatisticsTracker } from '@/components/StatisticsTracker'

export const metadata: Metadata = {
  title: 'Programláz - Fedezd fel Magyarország legjobb helyeit',
  description: 'Éttermek, szállások, látnivalók és programok egy helyen, interaktív térképen. Fedezd fel Magyarország legjobb helyeit!',
  keywords: 'éttermek, szállások, látnivalók, programok, Magyarország, térkép, kirándulás, utazás, programláz',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [categories, featuredCategories, headerCategories, places, featuredPlacesRaw, siteStats] = await Promise.all([
    getCategories(),
    getFeaturedCategories(),
    getCategoriesForHeader(),
    getPlaces(),
    getFeaturedPlaces(),
    getSiteStatistics(),
  ])
  const featuredPlaces = featuredPlacesRaw.length > 0 ? featuredPlacesRaw : places.slice(0, 8)

  return (
    <html lang="hu">
      <body className={`${fontBrand.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <AuthProviderWrapper>
          <CategoriesProvider
            initialCategories={categories}
            initialFeaturedCategories={featuredCategories}
            initialHeaderCategories={headerCategories}
            initialPlaces={places}
            initialFeaturedPlaces={featuredPlaces}
            initialSiteStats={siteStats}
          >
            <StatisticsTracker />
            <Header />
            <main className="flex-1 min-w-0 w-full">
              {children}
            </main>
            <Footer />
            <CookieConsent />
          </CategoriesProvider>
        </AuthProviderWrapper>
      </body>
    </html>
  )
}
