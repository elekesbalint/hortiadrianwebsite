'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, Facebook, Instagram, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { addNewsletterSubscriber } from '@/lib/db/newsletter'

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)
  const [newsletterError, setNewsletterError] = useState('')

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = newsletterEmail.trim().toLowerCase()
    if (!email) return
    setNewsletterError('')
    setNewsletterLoading(true)
    const res = await addNewsletterSubscriber(email)
    setNewsletterLoading(false)
    if (!res.ok) {
      setNewsletterError(res.error === 'Érvénytelen e-mail.' ? res.error : res.error || 'Sikertelen feliratkozás. Próbáld később.')
      return
    }
    setNewsletterSuccess(true)
    setNewsletterEmail('')
  }

  return (
    <footer className="bg-[#E5E5E5] border-t border-gray-300">
      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-[#2D7A4F] to-[#1B5E20] rounded-3xl p-8 md:p-12 shadow-xl shadow-[#2D7A4F]/20">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ne maradj le semmiről!
            </h3>
            <p className="text-white/80 mb-6">
              Iratkozz fel hírlevelünkre és elsőként értesülj az új helyekről és ajánlatokról.
            </p>
            {newsletterSuccess ? (
              <p className="text-white font-medium">Köszönjük, feliratkoztál! Hamarosan értesítünk.</p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="E-mail címed"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={newsletterLoading}
                  required
                  className="flex-1 px-5 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-white/50 text-gray-900 placeholder:text-gray-400 disabled:opacity-70"
                />
                <Button type="submit" variant="secondary" size="lg" className="whitespace-nowrap" disabled={newsletterLoading}>
                  {newsletterLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#1B5E20]/30 border-t-[#1B5E20] rounded-full animate-spin mr-1" />
                      Küldés...
                    </>
                  ) : (
                    <>
                      Feliratkozás
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </form>
            )}
            {newsletterError && (
              <p className="mt-3 text-sm text-white/90">{newsletterError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <Image src="/logo.png" alt="Programláz" width={56} height={56} className="h-12 sm:h-14 w-auto object-contain" />
              <span className="text-xl font-bold text-gray-900">
                Programláz
              </span>
            </Link>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Fedezd fel Magyarország legjobb helyeit! Éttermek, szállások, látnivalók és programok egy helyen.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-[#2D7A4F] hover:shadow-md transition-all duration-200"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-[#2D7A4F] hover:shadow-md transition-all duration-200"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-[#2D7A4F] hover:shadow-md transition-all duration-200"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-gray-900 mb-5">Kategóriák</h4>
            <ul className="space-y-3">
              {[
                { href: '/kategoriak/ettermek', label: 'Éttermek' },
                { href: '/kategoriak/szallasok', label: 'Szállások' },
                { href: '/kategoriak/latnivalok', label: 'Látnivalók' },
                { href: '/kategoriak/programok', label: 'Programok' },
              ].map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href} 
                    className="text-gray-500 hover:text-[#2D7A4F] transition-colors inline-flex items-center gap-1 group"
                  >
                    {item.label}
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-gray-900 mb-5">Rólunk</h4>
            <ul className="space-y-3">
              {[
                { href: '/rolunk', label: 'Bemutatkozás' },
                { href: '/partnereinknek', label: 'Partnereinknek' },
                { href: '/aszf', label: 'ÁSZF' },
                { href: '/adatvedelem', label: 'Adatvédelem' },
                { href: '/sugo', label: 'Súgó' },
              ].map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href} 
                    className="text-gray-500 hover:text-[#2D7A4F] transition-colors inline-flex items-center gap-1 group"
                  >
                    {item.label}
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-gray-900 mb-5">Kapcsolat</h4>
            <ul className="space-y-4">
              <li>
                <a 
                  href="mailto:info@programlaz.hu" 
                  className="flex items-center gap-3 text-gray-500 hover:text-[#2D7A4F] transition-colors"
                >
                  <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-[#2D7A4F]" />
                  </div>
                  <span>info@programlaz.hu</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:+36301234567" 
                  className="flex items-center gap-3 text-gray-500 hover:text-[#2D7A4F] transition-colors"
                >
                  <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-[#2D7A4F]" />
                  </div>
                  <span>+36 30 123 4567</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              <p>© 2026 Programláz. Minden jog fenntartva.</p>
              <p className="mt-1">
                Designed & coded by{' '}
                <a 
                  href="https://www.balintelekes.hu/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#2D7A4F] hover:text-[#1B5E20] font-medium transition-colors"
                >
                  Bálint Elekes
                </a>
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/adatvedelem" className="text-sm text-gray-500 hover:text-[#2D7A4F] transition-colors">
                Adatvédelem
              </Link>
              <Link href="/aszf" className="text-sm text-gray-500 hover:text-[#2D7A4F] transition-colors">
                ÁSZF
              </Link>
              <Link href="/cookie" className="text-sm text-gray-500 hover:text-[#2D7A4F] transition-colors">
                Cookie beállítások
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
