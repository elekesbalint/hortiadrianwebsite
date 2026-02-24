import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://programlaz.hu'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/auth/', '/fiok/', '/bejelentkezes', '/regisztracio', '/elfelejtett-jelszo', '/uj-jelszo'] }],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
