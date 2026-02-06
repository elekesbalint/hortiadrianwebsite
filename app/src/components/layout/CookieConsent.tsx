'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { X, Cookie } from 'lucide-react'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'programlaz_cookie_consent'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Ellenőrizzük, hogy már elfogadta-e a felhasználó
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Kis késleltetés után jelenik meg, hogy ne zavarja azonnal
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setIsVisible(false)
    // Statisztikák rögzítése mostantól engedélyezve
  }

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-hero-fade-in-up">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
              <Cookie className="h-6 w-6 text-[#2D7A4F]" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Cookie-k használata
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              Weboldalunk cookie-kat használ a legjobb felhasználói élmény biztosítása és a weboldal fejlesztése érdekében. 
              Az elfogadással hozzájárulsz a statisztikák rögzítéséhez, amelyek segítenek megérteni, hogyan használják a látogatók az oldalt. 
              További információkat a{' '}
              <Link href="/cookie" className="text-[#2D7A4F] hover:text-[#1B5E20] underline font-medium">
                Cookie beállítások
              </Link>{' '}
              oldalon találsz.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="whitespace-nowrap"
            >
              Elutasítás
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAccept}
              className="whitespace-nowrap"
            >
              Elfogadás
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
