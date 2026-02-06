'use client'

import Link from 'next/link'
import { Heart, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function KedvencekPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-r from-red-400 to-pink-500 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">Kedvencek</h1>
              <p className="text-white/90 mt-1 text-lg">
                A kedvenc helyeid egy helyen
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <Heart className="h-14 w-14 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Még nincs kedvenced</h2>
          <p className="text-gray-500 mb-6">
            A kategória oldalakon (Éttermek, Szállások, stb.) a helyeknél a szív ikonra kattintva
            hozzáadhatod őket a kedvenceidhez. Bejelentkezés után a kedvenceid minden eszközön
            megjelennek.
          </p>
          <Link href="/terkep">
            <Button variant="primary">
              <MapPin className="h-4 w-4" />
              Böngéssz a térképen
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
