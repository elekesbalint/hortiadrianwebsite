'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, MapPin, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { getFavoritePlaces, removeFavorite } from '@/lib/db/favorites'
import type { AppPlace } from '@/lib/db/places'

export default function FiokGyujtemenyekPage() {
  const [places, setPlaces] = useState<AppPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const list = await getFavoritePlaces()
    setPlaces(list)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleRemove = async (e: React.MouseEvent, placeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setRemovingId(placeId)
    const ok = await removeFavorite(placeId)
    setRemovingId(null)
    if (ok) setPlaces((prev) => prev.filter((p) => p.id !== placeId))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Gyűjtemények</h1>
        <p className="text-gray-500 mt-1">A kedvenc helyeid egy helyen.</p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : places.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-[#2D7A4F]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Még nincs kedvenced</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              A kategória oldalakon (Éttermek, Szállások, stb.) a helyeknél a szív ikonra kattintva
              hozzáadhatod őket a kedvenceidhez. A kedvenceid itt fognak megjelenni.
            </p>
            <Link href="/terkep">
              <Button variant="primary">
                <MapPin className="h-4 w-4" />
                Böngéssz a térképen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <Link key={place.id} href={`/hely/${place.slug || place.id}`}>
              <Card hover className="h-full group relative">
                <button
                  onClick={(e) => handleRemove(e, place.id)}
                  disabled={removingId === place.id}
                  className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-70"
                  title="Eltávolítás a kedvencekből"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <div className="relative h-52 overflow-hidden bg-gray-200">
                  <Image
                    src={place.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop'}
                    alt={place.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`badge ${place.isOpen ? 'badge-success' : 'badge-danger'}`}>
                      {place.isOpen ? 'Nyitva' : 'Zárva'}
                    </span>
                    {place.isPremium && <span className="badge badge-premium">Prémium</span>}
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    {Array.from({ length: 5 }, (_, i) => {
                      const starNum = i + 1
                      const isFilled = starNum <= Math.round(place.rating ?? 0)
                      return (
                        <Star
                          key={starNum}
                          className={`h-5 w-5 ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      )
                    })}
                    <span className="font-bold">{place.rating}</span>
                    <span className="text-gray-400">({place.ratingCount})</span>
                  </div>
                  <CardTitle className="text-lg mb-1 group-hover:text-[#2D7A4F] transition-colors">
                    {place.name}
                  </CardTitle>
                  <p className="text-gray-500 text-sm line-clamp-2">{place.address}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
