'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  User,
  Heart,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const navItems = [
  { href: '/fiok', label: 'Irányítópult', icon: LayoutDashboard },
  { href: '/fiok/profil', label: 'Profil', icon: User },
  { href: '/fiok/gyujtemenyek', label: 'Gyűjtemények', icon: Heart },
  { href: '/fiok/ertesitesek', label: 'Értesítések', icon: Bell },
  { href: '/fiok/beallitasok', label: 'Beállítások', icon: Settings },
  { href: '/fiok/kijelentkezes', label: 'Kijelentkezés', icon: LogOut },
]

export function FiokShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoggedIn, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) {
      router.replace(`/bejelentkezes?redirect=${encodeURIComponent(pathname || '/fiok')}`)
    }
  }, [isLoggedIn, authLoading, pathname, router])

  if (authLoading) {
    return <LoadingSpinner variant="centered" />
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8FAF8]">
        <p className="text-[#6B7280]">Átirányítás a bejelentkezéshez...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#F8FAF8]">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 shadow-sm flex flex-col min-h-full">
        <div className="p-4 border-b border-gray-100">
          <Link href="/fiok" className="flex items-center gap-2 text-[#1B5E20] font-bold text-lg">
            <LayoutDashboard className="h-6 w-6" />
            Fiókom
          </Link>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/fiok' && pathname?.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#E8F5E9] text-[#1B5E20]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" />
            Vissza a főoldalra
          </Link>
        </div>
      </aside>
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </div>
    </div>
  )
}
