import type { MetadataRoute } from 'next'
import { getPlaces } from '@/lib/db/places'
import { getCategories } from '@/lib/db/categories'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://programlaz.hu'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [places, categories] = await Promise.all([getPlaces(), getCategories()])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/terkep`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${BASE_URL}/cookie`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/adatvedelem`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/aszf`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/partnereinknek`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const placeUrls: MetadataRoute.Sitemap = places.map((p) => ({
    url: `${BASE_URL}/hely/${encodeURIComponent(p.slug)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const categoryUrls: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${BASE_URL}/kategoriak/${encodeURIComponent(c.slug)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))

  return [...staticPages, ...categoryUrls, ...placeUrls]
}
