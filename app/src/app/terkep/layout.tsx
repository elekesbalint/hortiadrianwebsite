import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://programlaz.hu'

export const metadata: Metadata = {
  title: 'Térkép – éttermek, szállások, látnivalók',
  description:
    'Interaktív térkép: fedezd fel Magyarország éttermeit, szállásait, látnivalóit és programjait. Szűrj kategória, távolság és szolgáltatások szerint.',
  openGraph: {
    title: 'Térkép | Programláz – Fedezd fel Magyarország legjobb helyeit',
    description: 'Interaktív térkép: éttermek, szállások, látnivalók és programok egy helyen.',
    url: `${BASE_URL}/terkep`,
  },
  alternates: { canonical: `${BASE_URL}/terkep` },
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
