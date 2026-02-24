import type { Metadata } from 'next'
import { getCategories } from '@/lib/db/categories'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://programlaz.hu'

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const categories = await getCategories()
  const category = categories.find((c) => c.slug === decodeURIComponent(slug))
  const displayName = category?.detail_page_title ?? category?.name ?? slug
  const title = `${displayName} – fedezd fel a legjobb helyeket`
  const description = `${displayName} kategória legjobb helyei Magyarországon. Szűrj távolság, értékelés vagy szolgáltatások szerint, és találd meg a tökéletes programot.`
  const url = `${BASE_URL}/kategoriak/${encodeURIComponent(slug)}`

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
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
