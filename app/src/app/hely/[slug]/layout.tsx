import type { Metadata } from 'next'
import { getPlaceBySlug } from '@/lib/db/places'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://programlaz.hu'

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const place = await getPlaceBySlug(decodeURIComponent(slug))
  if (!place) return { title: 'Hely nem található' }

  const title = `${place.name} – ${place.category}`
  const description =
    place.description?.slice(0, 160).trim().replace(/\s+/g, ' ') ||
    `${place.name} – ${place.category}${place.address ? ` · ${place.address}` : ''}. Fedezd fel a Programláz térképen.`
  const image = place.imageUrl || place.images?.[0] || `${BASE_URL}/logo.png`
  const url = `${BASE_URL}/hely/${encodeURIComponent(place.slug)}`

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'hu_HU',
      url,
      siteName: 'Programláz',
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: place.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  }
}

export default async function PlaceLayout({ params, children }: Props) {
  const { slug } = await params
  const place = await getPlaceBySlug(decodeURIComponent(slug))
  const url = `${BASE_URL}/hely/${encodeURIComponent(place?.slug || slug)}`

  const jsonLd = place
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${url}#place`,
        name: place.name,
        description: place.description || undefined,
        image: place.images?.length ? place.images : place.imageUrl ? [place.imageUrl] : undefined,
        address: place.address ? { '@type': 'PostalAddress', streetAddress: place.address } : undefined,
        geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng },
        url,
        aggregateRating:
          place.ratingCount > 0
            ? { '@type': 'AggregateRating', ratingValue: place.rating, reviewCount: place.ratingCount, bestRating: 5 }
            : undefined,
      }
    : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {children}
    </>
  )
}
