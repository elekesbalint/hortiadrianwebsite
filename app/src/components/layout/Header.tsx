'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { getCategoriesForHeader } from '@/lib/db/categories'
import {
  Menu,
  X,
  User,
  Heart,
  Search,
  LayoutDashboard,
  Bell,
  Settings,
  LogOut,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import { getCategoryIconComponent } from '@/lib/categoryIcons'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type HeaderCategory = { id: string; slug: string; name: string; icon: string | null }

/** Ikon a kategóriához: ha van mentett icon, azt; különben slug alapján. */
function getHeaderCategoryIcon(cat: HeaderCategory) {
  const fromDb = getCategoryIconComponent(cat.icon)
  if (fromDb) return fromDb
  const s = cat.slug.toLowerCase()
  const fallback = getCategoryIconComponent(
    s.includes('etterm') || s.includes('gasztro') ? 'Utensils'
    : s.includes('szallas') ? 'Bed'
    : s.includes('program') ? 'Calendar'
    : s.includes('latnivalo') ? 'Landmark'
    : 'MapPin'
  )
  return fallback ?? MapPin
}

const NOTIFICATIONS_READ_AT_KEY = 'programlaz_notifications_read_at'

type SentNotification = { id: string; title: string; body: string; url: string | null; created_at: string }

const fiokNavItems = [
  { href: '/fiok', label: 'Irányítópult', icon: LayoutDashboard },
  { href: '/fiok/profil', label: 'Profil', icon: User },
  { href: '/fiok/gyujtemenyek', label: 'Gyűjtemények', icon: Heart },
  { href: '/fiok/ertesitesek', label: 'Értesítések', icon: Bell },
  { href: '/fiok/beallitasok', label: 'Beállítások', icon: Settings },
  { href: '/fiok/kijelentkezes', label: 'Kijelentkezés', icon: LogOut },
]

function formatNotifDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'most'
  if (diffMins < 60) return `${diffMins} perce`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} órája`
  return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
}

export function Header() {
  const { isLoggedIn, isAdmin } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [fiokDropdownOpen, setFiokDropdownOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState<SentNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [lastReadAt, setLastReadAt] = useState<string | null>(null)
  const [badgeNotifications, setBadgeNotifications] = useState<{ created_at: string }[]>([])
  const bellRef = useRef<HTMLDivElement>(null)
  const fiokCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([])

  useEffect(() => {
    getCategoriesForHeader().then(setHeaderCategories)
  }, [])

  // Olvasatlan szám: értesítések, amik a lastReadAt után érkeztek (lastReadAt nélkül mind „új”)
  const unreadCount = mounted
    ? badgeNotifications.filter((n) => new Date(n.created_at) > new Date(lastReadAt || '0')).length
    : 0

  // Badge-hez: light fetch (csak created_at) bejelentkezéskor
  useEffect(() => {
    if (!isLoggedIn || !mounted) return
    let cancelled = false
    supabase
      .from('sent_notifications')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!cancelled) setBadgeNotifications((data ?? []) as { created_at: string }[])
      })
    return () => { cancelled = true }
  }, [isLoggedIn, mounted])

  // lastReadAt init localStorage-ból (csak kliensen)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    setLastReadAt(localStorage.getItem(NOTIFICATIONS_READ_AT_KEY))
  }, [mounted])

  // Ha megnyitják a csengőt: „megnézték”, töröljük a badge-et
  useEffect(() => {
    if (bellOpen && typeof window !== 'undefined') {
      const now = new Date().toISOString()
      localStorage.setItem(NOTIFICATIONS_READ_AT_KEY, now)
      setLastReadAt(now)
    }
  }, [bellOpen])

  // Fiók → Értesítések oldal megnyitásakor küldött esemény (ott is beállítjuk a „megnéztem”-et)
  useEffect(() => {
    const handler = () => {
      if (typeof window === 'undefined') return
      const v = localStorage.getItem(NOTIFICATIONS_READ_AT_KEY)
      setLastReadAt(v || new Date().toISOString())
    }
    window.addEventListener('programlaz-notifications-read', handler)
    return () => window.removeEventListener('programlaz-notifications-read', handler)
  }, [])

  useEffect(() => {
    if (!bellOpen || !isLoggedIn) return
    let mounted = true
    setNotificationsLoading(true)
    ;(async () => {
      const { data } = await supabase
        .from('sent_notifications')
        .select('id, title, body, url, created_at')
        .order('created_at', { ascending: false })
        .limit(8)
      if (mounted) {
        setNotifications((data ?? []) as SentNotification[])
        setNotificationsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [bellOpen, isLoggedIn])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    if (bellOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [bellOpen])

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    handleScroll() // Check initial scroll position
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Use a stable class during SSR to avoid hydration mismatch
  const headerClass = mounted && isScrolled
    ? 'sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg shadow-black/5 transition-all duration-300'
    : 'sticky top-0 z-50 bg-white border-b border-gray-100 transition-all duration-300'

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto pl-0 pr-4 sm:pl-0 sm:pr-6 lg:pr-8">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-3 lg:gap-4">
          {/* Logo – tableten (lg) beljebb, xl-en jobbra húzva negatív margóval */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0 mr-2 lg:mr-4 xl:mr-6 -ml-2 sm:-ml-3 lg:ml-0 xl:-ml-6">
            <Image src="/logo.png" alt="Programláz" width={56} height={56} className="h-12 sm:h-14 w-auto object-contain" priority />
            <span className="hidden sm:inline text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#2D7A4F] transition-colors font-brand">
              Programláz
            </span>
          </Link>

          {/* Desktop Navigation – tableten (lg) kisebb ikon + szöveg, hogy kiférjen; xl-en normál */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 min-w-0 flex-1 justify-center">
            <Link
              href="/terkep"
              className="inline-flex items-center gap-1 xl:gap-2 px-2 lg:px-2.5 xl:px-4 py-1.5 lg:py-2 xl:py-2.5 text-sm xl:text-base text-gray-700 hover:text-[#2D7A4F] font-medium rounded-lg xl:rounded-xl bg-gray-100/80 hover:bg-[#E8F5E9]/70 transition-all duration-200 shrink-0"
            >
              <MapPin className="h-3.5 w-3.5 xl:h-4 xl:w-4 shrink-0 text-[#2D7A4F]/80" />
              <span className="whitespace-nowrap">Térkép</span>
            </Link>
            {headerCategories.map((cat) => {
              const Icon = getHeaderCategoryIcon(cat)
              return (
                <Link
                  key={cat.id}
                  href={`/kategoriak/${cat.slug}`}
                  className="inline-flex items-center gap-1 xl:gap-2 px-2 lg:px-2.5 xl:px-4 py-1.5 lg:py-2 xl:py-2.5 text-sm xl:text-base text-gray-700 hover:text-[#2D7A4F] font-medium rounded-lg xl:rounded-xl bg-gray-100/80 hover:bg-[#E8F5E9]/70 transition-all duration-200 shrink-0"
                >
                  <Icon className="h-3.5 w-3.5 xl:h-4 xl:w-4 shrink-0 text-[#2D7A4F]/80 flex-shrink-0" />
                  <span className="whitespace-nowrap">{cat.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Desktop Actions – tableten kisebb ikonok, hogy kiférjen */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0 ml-2 lg:ml-4">
            <Link
              href="/terkep"
              className="p-2 lg:p-2.5 text-gray-500 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 rounded-lg xl:rounded-xl transition-all duration-200"
              title="Keresés a térképen"
              aria-label="Keresés a térképen"
            >
              <Search className="h-4 w-4 xl:h-5 xl:w-5" />
            </Link>
            <Link
              href={isLoggedIn ? '/fiok/gyujtemenyek' : '/kedvencek'}
              className="p-2 lg:p-2.5 text-gray-500 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 rounded-lg xl:rounded-xl transition-all duration-200 relative"
              title="Kedvencek"
              aria-label="Kedvencek"
            >
              <Heart className="h-4 w-4 xl:h-5 xl:w-5" />
            </Link>
            {isLoggedIn && (
              <div className="relative" ref={bellRef}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setBellOpen((v) => !v) }}
                  className="p-2 lg:p-2.5 text-gray-500 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 rounded-lg xl:rounded-xl transition-all duration-200 relative"
                  title="Értesítések"
                  aria-label="Értesítések"
                >
                  <Bell className="h-4 w-4 xl:h-5 xl:w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-[320px] max-h-[400px] overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 z-50 flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-[#1A1A1A]">Értesítések</span>
                      <Link
                        href="/fiok/ertesitesek"
                        className="text-sm text-[#2D7A4F] hover:underline"
                        onClick={() => setBellOpen(false)}
                      >
                        Összes
                      </Link>
                    </div>
                    <div className="overflow-y-auto max-h-[320px]">
                      {notificationsLoading ? (
                        <div className="px-4 py-6 flex justify-center">
                          <LoadingSpinner />
                        </div>
                      ) : notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-gray-500 text-sm">Nincs új értesítés.</p>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.url || '#'}
                            className="block px-4 py-3 hover:bg-[#E8F5E9]/50 border-b border-gray-50 last:border-0 transition-colors"
                            onClick={() => setBellOpen(false)}
                          >
                            <p className="font-medium text-[#1A1A1A] text-sm truncate">{n.title}</p>
                            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-gray-400 text-xs mt-1">{formatNotifDate(n.created_at)}</p>
                          </Link>
                        ))
                      )}
                    </div>
                    <Link
                      href="/fiok/ertesitesek"
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#2D7A4F] hover:bg-[#E8F5E9]/50 border-t border-gray-100"
                      onClick={() => setBellOpen(false)}
                    >
                      Összes megtekintése
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
            <div className="w-px h-5 xl:h-6 bg-gray-200 mx-1 xl:mx-2" />
            {isAdmin && (
              <Link
                href="/admin"
                className="p-2 lg:p-2.5 text-gray-500 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 rounded-lg xl:rounded-xl transition-all duration-200"
                title="Admin"
                aria-label="Admin"
              >
                <LayoutDashboard className="h-4 w-4 xl:h-5 xl:w-5" />
              </Link>
            )}
            {isLoggedIn ? (
              <div
                className="relative"
                onMouseEnter={() => {
                  if (fiokCloseTimeoutRef.current) {
                    clearTimeout(fiokCloseTimeoutRef.current)
                    fiokCloseTimeoutRef.current = null
                  }
                  setFiokDropdownOpen(true)
                }}
                onMouseLeave={() => {
                  fiokCloseTimeoutRef.current = setTimeout(() => setFiokDropdownOpen(false), 250)
                }}
              >
                <Link href="/fiok">
                  <Button variant="primary" size="sm" className="!h-8 !px-3 !text-xs xl:!h-9 xl:!px-4 xl:!text-sm">
                    <User className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                    Fiók
                  </Button>
                </Link>
                {fiokDropdownOpen && (
                  <div
                    className="absolute right-0 top-full pt-1.5 py-2 z-50"
                    onMouseEnter={() => {
                      if (fiokCloseTimeoutRef.current) {
                        clearTimeout(fiokCloseTimeoutRef.current)
                        fiokCloseTimeoutRef.current = null
                      }
                      setFiokDropdownOpen(true)
                    }}
                    onMouseLeave={() => {
                      fiokCloseTimeoutRef.current = setTimeout(() => setFiokDropdownOpen(false), 200)
                    }}
                  >
                    <div className="py-2 bg-white rounded-xl shadow-lg border border-gray-100 min-w-[220px]">
                      {fiokNavItems.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#E8F5E9] hover:text-[#1B5E20] transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          <Icon className="h-4 w-4 flex-shrink-0 text-[#2D7A4F]" />
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/bejelentkezes">
                <Button variant="primary" size="sm" className="!h-8 !px-3 !text-xs xl:!h-9 xl:!px-4 xl:!text-sm">
                  <User className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                  <span className="whitespace-nowrap">Belépés/Regisztráció</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile: csengő + menü gomb */}
          <div className="lg:hidden flex items-center gap-1">
            {isLoggedIn && (
              <Link
                href="/fiok/ertesitesek"
                className="p-2.5 text-gray-600 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 rounded-xl transition-colors"
                aria-label="Értesítések"
              >
                <Bell className="h-5 w-5" />
              </Link>
            )}
            <button
              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col gap-1">
              <Link
                href="/terkep"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 rounded-xl font-medium transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <MapPin className="h-5 w-5 shrink-0 text-[#2D7A4F]/80" />
                Térkép
              </Link>
              {headerCategories.map((cat) => {
                const Icon = getHeaderCategoryIcon(cat)
                return (
                  <Link
                    key={cat.id}
                    href={`/kategoriak/${cat.slug}`}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 rounded-xl font-medium transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 shrink-0 text-[#2D7A4F]/80" />
                    {cat.name}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="px-4 py-3 text-gray-700 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 rounded-xl font-medium flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <div className="h-px bg-gray-100 my-2" />
              {isLoggedIn ? (
                <>
                  {fiokNavItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="px-4 py-3 text-gray-700 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 rounded-xl font-medium flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </>
              ) : (
                <Link 
                  href="/bejelentkezes" 
                  className="px-4 py-3 text-[#2D7A4F] font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Belépés / Regisztráció
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
