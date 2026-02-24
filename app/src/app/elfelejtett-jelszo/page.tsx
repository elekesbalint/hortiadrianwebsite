'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { getSiteUrl } from '@/lib/utils'

const inputClass =
  'w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all placeholder:text-gray-400'

export default function ElfelejtettJelszoPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    const redirectTo = `${getSiteUrl()}/uj-jelszo`
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setIsLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setSent(true)
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
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Elfelejtett jelszó</h1>
            <p className="text-[#6B7280] text-sm mb-6">
              {sent
                ? 'Ha van ilyen e-mail címmel fiók, elküldtük a jelszó-visszaállító linket.'
                : 'Add meg az e-mail címed, és küldünk egy linket a jelszó visszaállításához.'}
            </p>

            {sent ? (
              <Link href="/bejelentkezes">
                <Button className="w-full" size="lg">
                  Vissza a bejelentkezéshez
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
                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Link küldése
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
