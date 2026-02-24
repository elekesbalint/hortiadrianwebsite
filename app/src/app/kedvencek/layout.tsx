import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kedvencek',
  description: 'A kedvenc helyeid egy helyen. Jelentkezz be a listád megtekintéséhez.',
  robots: { index: false, follow: true },
}

export default function KedvencekLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
