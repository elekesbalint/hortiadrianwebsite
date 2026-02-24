import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Adatvédelmi tájékoztató',
  description: 'Programláz adatvédelmi tájékoztatója: hogyan kezeljük a személyes adatokat és a cookie-kat.',
  robots: { index: true, follow: true },
}

export default function AdatvedelemPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Adatvédelmi tájékoztató
        </h1>
        <p className="text-xl md:text-2xl text-gray-600">
          Hamarosan elérhető
        </p>
      </div>
    </div>
  )
}
