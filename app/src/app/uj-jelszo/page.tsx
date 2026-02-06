'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'

const inputClass =
  'w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all placeholder:text-gray-400'

export default function UjJelszoPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasRecoverySession(!!session?.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session?.user) {
        setHasRecoverySession(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('A jelszónak legalább 8 karakter hosszúnak kell lennie.')
      return
    }
    if (password !== confirmPassword) {
      setError('A két jelszó nem egyezik.')
      return
    }
    setIsLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setIsLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/bejelentkezes'), 2000)
  }

  if (hasRecoverySession === null) {
    return <LoadingSpinner variant="centered" />
  }

  if (!hasRecoverySession) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#F8FAF8] px-4 py-12 gap-6">
        <p className="text-gray-700 font-medium text-center">
          A link lejárt vagy érvénytelen. Kérj új jelszó-visszaállító linket.
        </p>
        <Link href="/elfelejtett-jelszo" className="text-[#2D7A4F] font-semibold hover:underline">
          Elfelejtett jelszó
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8FAF8] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/logo.png" alt="Programláz" width={56} height={56} className="h-12 sm:h-14 w-auto object-contain" />
          <span className="text-2xl font-bold text-[#1A1A1A]">
            Programláz
          </span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Új jelszó megadása</h1>
            <p className="text-[#6B7280] text-sm mb-6">
              {success
                ? 'A jelszavad frissítve. Átirányítás a bejelentkezéshez...'
                : 'Add meg az új jelszavadat (legalább 8 karakter).'}
            </p>

            {success ? (
              <Link href="/bejelentkezes">
                <Button className="w-full" size="lg">
                  Bejelentkezés
                </Button>
              </Link>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                    Új jelszó
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D7A4F]"
                      aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
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
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" isLoading={isLoading} disabled={!password || !confirmPassword}>
                  Jelszó mentése
                </Button>
              </form>
            )}
          </div>
          <div className="px-8 sm:px-10 py-4 bg-[#F8FAF8] border-t border-gray-100 text-center">
            <Link href="/bejelentkezes" className="text-sm font-medium text-[#2D7A4F] hover:text-[#1B5E20]">
              ← Vissza a bejelentkezéshez
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
