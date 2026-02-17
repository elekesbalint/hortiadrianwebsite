'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  MapPin,
  FolderTree,
  Sliders,
  Bell,
  LogOut,
  ChevronLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  TrendingUp,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const navItems = [
  { href: '/admin', label: 'Áttekintés', icon: LayoutDashboard },
  { href: '/admin/helyek', label: 'Helyek', icon: MapPin },
  { href: '/admin/kategoriak', label: 'Kategóriák', icon: FolderTree },
  { href: '/admin/szurok', label: 'Szűrők', icon: Sliders },
  { href: '/admin/site-statistics', label: 'Főoldal statisztikák', icon: TrendingUp },
  { href: '/admin/ertesitesek', label: 'Értesítések', icon: Bell },
  { href: '/admin/hirlevel', label: 'Hírlevél', icon: Mail },
  { href: '/admin/biztonsag', label: 'Biztonság (2FA)', icon: Shield },
]

const inputClass =
  'w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all placeholder:text-gray-400'

type MfaState = null | 'checking' | 'enroll' | 'verify' | 'granted'
type EnrollData = { factorId: string; qrCode: string; secret: string }

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoggedIn, isAdmin, signOut, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [mfaState, setMfaState] = useState<MfaState>(null)
  const [mfaError, setMfaError] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null)
  const [mfaFactors, setMfaFactors] = useState<{ id: string; friendly_name?: string }[]>([])
  const [mfaVerifying, setMfaVerifying] = useState(false)
  const [mfaEnrolling, setMfaEnrolling] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)
    if (error) {
      setLoginError(error.message === 'Invalid login credentials' ? 'Hibás e-mail vagy jelszó.' : error.message)
      return
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      setMfaState(null)
      return
    }
    let cancelled = false
    setMfaState('checking')
    
    // Először próbáljuk meg lekérni az AAL-t
    supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      .then((aalRes) => {
        if (cancelled) return
        const aal = aalRes.data
        if (aal?.currentLevel === 'aal2') {
          setMfaState('granted')
          return
        }
        
        // Ha nincs AAL2, próbáljuk meg lekérni a faktorokat
        supabase.auth.mfa.listFactors()
          .then((factorsRes) => {
            if (cancelled) return
            if (factorsRes.error) {
              // Ha hiba van a faktorok lekérdezésénél, folytassuk az enroll folyamatot
              console.warn('MFA factors list error:', factorsRes.error)
              startEnroll()
              return
            }
            const factors = factorsRes.data?.totp ?? []
            if (factors.length > 0) {
              setMfaFactors(factors)
              setMfaState('verify')
              return
            }
            // Ha nincs faktor, kezdjük az enroll folyamatot
            startEnroll()
          })
          .catch((err) => {
            if (cancelled) return
            console.warn('MFA factors list exception:', err)
            // Hiba esetén is próbáljuk meg az enroll-t
            startEnroll()
          })
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('MFA AAL check exception:', err)
        // Ha az AAL check is hibázik, próbáljuk meg az enroll-t
        startEnroll()
      })
    
    const startEnroll = () => {
      if (cancelled) return
      supabase.auth.mfa
        .enroll({ 
          factorType: 'totp', 
          friendlyName: 'Admin',
        })
        .then(({ data, error }) => {
          if (cancelled) return
          if (error) {
            console.error('MFA enroll error:', error)
            setMfaError(error.message || 'Hiba történt a 2FA beállítás során.')
            setMfaState('enroll')
            return
          }
          if (data?.id && data?.totp?.qr_code && data?.totp?.secret) {
            setEnrollData({
              factorId: data.id,
              qrCode: data.totp.qr_code,
              secret: data.totp.secret,
            })
          }
          setMfaState('enroll')
        })
        .catch((err) => {
          if (cancelled) return
          console.error('MFA enroll exception:', err)
          setMfaError(err.message || 'Hiba történt a 2FA beállítás során.')
          setMfaState('enroll')
        })
    }
    
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, isAdmin])

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setMfaError('')
    if (!mfaFactors[0]) return
    setMfaVerifying(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactors[0].id,
      code: mfaCode.trim(),
    })
    setMfaVerifying(false)
    if (error) {
      setMfaError(error.message || 'Hibás kód.')
      return
    }
    setMfaCode('')
    setMfaState('granted')
  }

  const handleMfaEnrollVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setMfaError('')
    if (!enrollData) return
    setMfaEnrolling(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollData.factorId,
      code: mfaCode.trim(),
    })
    setMfaEnrolling(false)
    if (error) {
      setMfaError(error.message || 'Hibás kód.')
      return
    }
    setMfaCode('')
    setEnrollData(null)
    setMfaState('granted')
  }

  if (authLoading) {
    return <LoadingSpinner variant="centered" />
  }

  if (isLoggedIn && !isAdmin) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#F8FAF8] px-4 py-12 gap-6">
        <p className="text-gray-700 font-medium text-center">
          Nincs jogosultságod az admin felülethez. Csak a kijelölt adminisztrátorok érhetik el.
        </p>
        <Link href="/" className="text-[#2D7A4F] font-semibold hover:underline">
          Vissza a főoldalra
        </Link>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8FAF8] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <Image src="/logo.png" alt="Programláz" width={56} height={56} className="h-12 sm:h-14 w-auto object-contain" />
            <span className="text-2xl font-bold text-[#1A1A1A]">
              Admin
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
            <div className="p-8 sm:p-10">
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Admin bejelentkezés</h1>
              <p className="text-[#6B7280] text-sm mb-6">
                Jelentkezz be az admin felület eléréséhez.
              </p>

              <form onSubmit={handleAdminLogin} className="space-y-5">
                {loginError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                    {loginError}
                  </div>
                )}
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@programlaz.hu"
                      className={inputClass}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                    Jelszó
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D7A4F] transition-colors"
                      aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#2D7A4F] hover:bg-[#1B5E20] text-white font-semibold rounded-xl shadow-lg shadow-[#2D7A4F]/25 hover:shadow-[#2D7A4F]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Bejelentkezés...
                    </>
                  ) : (
                    'Belépés'
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-[#2D7A4F] flex items-center justify-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Vissza a főoldalra
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (isLoggedIn && isAdmin && mfaState !== 'granted') {
    if (mfaState === null || mfaState === 'checking') {
      return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8FAF8]">
          <p className="text-[#6B7280]">2FA ellenőrzés...</p>
        </div>
      )
    }
    if (mfaState === 'verify') {
      return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8FAF8] px-4 py-12">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-center gap-2.5 mb-8">
              <Shield className="h-8 w-8 text-[#2D7A4F]" />
              <span className="text-xl font-bold text-[#1A1A1A]">Kétlépcsős hitelesítés</span>
            </div>
            <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 p-8">
              <p className="text-[#6B7280] text-sm mb-6">
                Add meg az autentikátor alkalmazásodban megjelenő 6 számjegyű kódot.
              </p>
              <form onSubmit={handleMfaVerify} className="space-y-4">
                {mfaError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                    {mfaError}
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className={inputClass}
                  autoComplete="one-time-code"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={mfaVerifying || mfaCode.length !== 6}
                  className="w-full py-3.5 bg-[#2D7A4F] hover:bg-[#1B5E20] text-white font-semibold rounded-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {mfaVerifying ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ellenőrzés...
                    </>
                  ) : (
                    'Belépés'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )
    }
    if (mfaState === 'enroll') {
      return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8FAF8] px-4 py-12">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-center gap-2.5 mb-8">
              <Shield className="h-8 w-8 text-[#2D7A4F]" />
              <span className="text-xl font-bold text-[#1A1A1A]">2FA beállítása</span>
            </div>
            <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 p-8 space-y-6">
              <p className="text-[#6B7280] text-sm">
                Olvasd be a QR kódot egy autentikátor alkalmazással (pl. Google Authenticator, Authy), majd add meg az első 6 számjegyű kódot.
              </p>
              {enrollData && (
                <>
                  <div className="flex justify-center">
                    <img src={enrollData.qrCode} alt="TOTP QR kód" className="w-48 h-48 rounded-lg border border-gray-200" />
                  </div>
                  <p className="text-xs text-[#6B7280] break-all font-mono bg-gray-50 p-2 rounded">
                    Ha nem tudod beolvasni: {enrollData.secret}
                  </p>
                </>
              )}
              <form onSubmit={handleMfaEnrollVerify} className="space-y-4">
                {mfaError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                    {mfaError}
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className={inputClass}
                  autoComplete="one-time-code"
                />
                <button
                  type="submit"
                  disabled={mfaEnrolling || mfaCode.length !== 6}
                  className="w-full py-3.5 bg-[#2D7A4F] hover:bg-[#1B5E20] text-white font-semibold rounded-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {mfaEnrolling ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ellenőrzés...
                    </>
                  ) : (
                    'Megerősítés és belépés'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#F8FAF8]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 shadow-sm flex flex-col min-h-full">
        <div className="p-4 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2 text-[#1B5E20] font-bold text-lg">
            <LayoutDashboard className="h-6 w-6" />
            Admin
          </Link>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E8F5E9] text-[#1B5E20]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Vissza a főoldalra
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Kijelentkezés
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </div>
    </div>
  )
}
