'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { User, Heart, Bell, Settings, LogOut, MapPin, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'

export default function FiokIranyitopultPage() {
  const { user } = useAuth()

  const tiles = [
    {
      href: '/fiok/profil',
      icon: User,
      title: 'Profil',
      description: 'Név, felhasználónév és egyéb adataid',
    },
    {
      href: '/fiok/gyujtemenyek',
      icon: Heart,
      title: 'Gyűjtemények',
      description: 'Kedvenc helyeid egy helyen',
    },
    {
      href: '/fiok/ertesitesek',
      icon: Bell,
      title: 'Értesítések',
      description: 'Elküldött értesítések listája',
    },
    {
      href: '/fiok/beallitasok',
      icon: Settings,
      title: 'Beállítások',
      description: 'E-mail és jelszó frissítése',
    },
    {
      href: '/fiok/kijelentkezes',
      icon: LogOut,
      title: 'Kijelentkezés',
      description: 'Kilépés a fiókodból',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Irányítópult</h1>
        <p className="text-gray-500 mt-1">Üdv újra{user?.name ? `, ${user.name}` : ''}! Itt áttekintheted a fiókodat.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href}>
            <Card hover className="h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-[#E8F5E9]">
                    <Icon className="h-6 w-6 text-[#2D7A4F]" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
                <CardTitle className="mt-3 text-lg">{title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Gyors linkek</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/terkep"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8F5E9] text-[#1B5E20] rounded-xl font-medium hover:bg-[#C8E6C9] transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Térkép
            </Link>
            <Link
              href="/kategoriak/ettermek"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Éttermek
            </Link>
            <Link
              href="/kategoriak/szallasok"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Szállások
            </Link>
            <Link
              href="/kategoriak/latnivalok"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Látnivalók
            </Link>
            <Link
              href="/kategoriak/programok"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Programok
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
