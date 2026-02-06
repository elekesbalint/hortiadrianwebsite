import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Home, MapPin, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8 animate-hero-fade-in-up">
          <Image
            src="/logo.png"
            alt="Programláz"
            width={120}
            height={120}
            className="mx-auto h-24 w-auto object-contain opacity-20"
          />
        </div>
        
        <h1 className="text-8xl md:text-9xl font-bold text-gray-200 mb-4 font-brand animate-hero-fade-in-up-delay-1">
          404
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-hero-fade-in-up-delay-2">
          Az oldal nem található
        </h2>
        
        <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto leading-relaxed animate-hero-fade-in-up-delay-3">
          Sajnáljuk, de a keresett oldal nem létezik vagy eltávolították. 
          Lehet, hogy rossz linket követtél, vagy az oldal át lett helyezve.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-hero-fade-in-up-delay-4">
          <Link href="/">
            <Button size="lg" variant="primary" className="w-full sm:w-auto">
              <Home className="h-5 w-5 mr-2" />
              Vissza a főoldalra
            </Button>
          </Link>
          <Link href="/terkep">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <MapPin className="h-5 w-5 mr-2" />
              Térkép megnyitása
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 animate-hero-fade-in-up-delay-5">
          <p className="text-sm text-gray-400 mb-4">
            Vagy próbáld meg ezeket:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/kategoriak/ettermek" className="text-[#2D7A4F] hover:text-[#1B5E20] font-medium transition-colors">
              Éttermek
            </Link>
            <Link href="/kategoriak/szallasok" className="text-[#2D7A4F] hover:text-[#1B5E20] font-medium transition-colors">
              Szállások
            </Link>
            <Link href="/kategoriak/latnivalok" className="text-[#2D7A4F] hover:text-[#1B5E20] font-medium transition-colors">
              Látnivalók
            </Link>
            <Link href="/kategoriak/programok" className="text-[#2D7A4F] hover:text-[#1B5E20] font-medium transition-colors">
              Programok
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
