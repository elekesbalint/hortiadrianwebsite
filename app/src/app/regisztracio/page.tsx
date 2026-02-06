'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { addNewsletterSubscriber } from '@/lib/db/newsletter'

const inputClass =
  'w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all placeholder:text-gray-400'

function RegisztracioForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    setError('')
    const redirectTo = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=${encodeURIComponent(redirect)}`
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    if (err) {
      setError(err.message || 'A regisztráció indítása sikertelen.')
      return
    }
    if (data?.url) window.location.href = data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('A két jelszó nem egyezik.')
      return
    }
    if (password.length < 8) {
      setError('A jelszónak legalább 8 karakter hosszúnak kell lennie.')
      return
    }
    if (!acceptTerms) {
      setError('Az adatvédelmi tájékoztató és a feltételek elfogadása szükséges.')
      return
    }
    setIsLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name || undefined } },
    })
    if (err) {
      setIsLoading(false)
      setError(err.message === 'User already registered' ? 'Ez az e-mail már regisztrálva van.' : err.message)
      return
    }
    
    // Ha be van pipálva a hírlevél checkbox, feliratkoztatjuk (server action = service role, nem függ RLS-től)
    if (subscribeNewsletter && email) {
      const res = await addNewsletterSubscriber(email)
      if (!res.ok && res.error) {
        console.warn('Hírlevél feliratkozás sikertelen:', res.error)
      }
    }
    
    setIsLoading(false)
    setSuccess(true)
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8FAF8] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/logo.png" alt="Programláz" width={56} height={56} className="h-12 sm:h-14 w-auto object-contain" />
          <span className="text-2xl font-bold text-[#1A1A1A]">
            Programláz
          </span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Regisztráció</h1>
            <p className="text-[#6B7280] text-sm mb-6">
              {success
                ? 'Ellenőrizd az e-mailjeidet – a megerősítő linkkel aktiválhatod a fiókod.'
                : 'Hozz létre egy fiókot a kedvencek és egyéni beállítások mentéséhez.'}
            </p>

            {success ? (
              <Link href="/bejelentkezes">
                <Button className="w-full" size="lg">Bejelentkezés</Button>
              </Link>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                  Név
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Teljes neved"
                    className={inputClass}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pelda@email.hu"
                    className={inputClass}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                  Jelszó
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Legalább 8 karakter"
                    className={inputClass}
                    required
                    minLength={8}
                    autoComplete="new-password"
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
                <p className="mt-1.5 text-xs text-[#6B7280]">Minimum 8 karakter</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                  Jelszó megerősítése
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2D7A4F] focus:ring-[#2D7A4F]"
                  required
                />
                <label htmlFor="acceptTerms" className="text-sm text-[#6B7280] leading-tight">
                  Elfogadom az{' '}
                  <Link href="/adatvedelem" className="text-[#2D7A4F] hover:underline font-medium">Adatvédelmi tájékoztató</Link>
                  {' '}és a{' '}
                  <Link href="/felhasznalasi-feltetelek" className="text-[#2D7A4F] hover:underline font-medium">Felhasználási feltételek</Link>
                  {' '}tartalmát.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="subscribeNewsletter"
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2D7A4F] focus:ring-[#2D7A4F]"
                />
                <label htmlFor="subscribeNewsletter" className="text-sm text-[#6B7280] leading-tight">
                  Szeretnék feliratkozni a hírlevélre, hogy elsőként értesüljek az új helyekről és ajánlatokról.
                </label>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Regisztráció
              </Button>
            </form>
            )}

            {!success && (
            <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-[#6B7280]">vagy folytasd ezzel</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('facebook')}
                className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm"
              >
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <svg className="h-[1.35rem] w-[1.35rem]" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
                    <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956-.925-1.956-1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
                  </svg>
                </span>
                Facebook
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000000" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Apple
              </button>
            </div>
            </>
            )}
          </div>

          <div className="px-8 sm:px-10 py-4 bg-[#F8FAF8] border-t border-gray-100 text-center">
            <p className="text-sm text-[#6B7280]">
              Már van fiókod?{' '}
              <Link href="/bejelentkezes" className="font-semibold text-[#2D7A4F] hover:text-[#1B5E20] transition-colors">
                Jelentkezz be
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisztracioPage() {
  return (
    <Suspense fallback={<LoadingSpinner variant="centered" />}>
      <RegisztracioForm />
    </Suspense>
  )
}
