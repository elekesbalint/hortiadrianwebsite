import type { Metadata } from 'next'
import { Dancing_Script } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { getCategories, getFeaturedCategories, getCategoriesForHeader } from '@/lib/db/categories'
import { getPlaces, getFeaturedPlaces, getUpcomingEvents } from '@/lib/db/places'
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
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://programlaz.hu'
const DEFAULT_TITLE = 'Programláz - Fedezd fel Magyarország legjobb helyeit'
const DEFAULT_DESCRIPTION = 'Éttermek, szállások, látnivalók és programok egy helyen, interaktív térképen. Fedezd fel Magyarország legjobb helyeit!'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: '%s | Programláz' },
  description: DEFAULT_DESCRIPTION,
  keywords: ['éttermek', 'szállások', 'látnivalók', 'programok', 'Magyarország', 'térkép', 'kirándulás', 'utazás', 'programláz', 'helyek', 'felfedezés'],
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'hu_HU',
    url: SITE_URL,
    siteName: 'Programláz',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Programláz' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/logo.png'],
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// Minden kérésnél friss adat (kategóriák, helyek) – ne cache-eljük a layoutot, különben az admin változtatások (pl. show_in_header) nem jelennek meg frissítésig
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [categories, featuredCategories, headerCategories, places, featuredPlacesRaw, upcomingEvents, siteStats] = await Promise.all([
    getCategories(),
    getFeaturedCategories(),
    getCategoriesForHeader(),
    getPlaces(),
    getFeaturedPlaces(),
    getUpcomingEvents(),
    getSiteStatistics(),
  ])
  const featuredPlaces = featuredPlacesRaw.length > 0 ? featuredPlacesRaw : places.slice(0, 8)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Programláz',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
        contactPoint: { '@type': 'ContactPoint', email: 'info@programlaz.hu', contactType: 'customer service' },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Programláz',
        description: DEFAULT_DESCRIPTION,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'hu-HU',
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/terkep?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
      },
    ],
  }

  return (
    <html lang="hu">
      <body className={`${fontBrand.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <GoogleAnalytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <AuthProviderWrapper>
          <CategoriesProvider
            initialCategories={categories}
            initialFeaturedCategories={featuredCategories}
            initialHeaderCategories={headerCategories}
            initialPlaces={places}
            initialFeaturedPlaces={featuredPlaces}
            initialUpcomingEvents={upcomingEvents}
            initialSiteStats={siteStats}
          >
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
