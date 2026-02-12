'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/context/AuthContext'
import { getPlaceBySlug } from '@/lib/db/places'
import type { AppPlace } from '@/lib/db/places'
import { getFavoritePlaceIds, addFavorite, removeFavorite } from '@/lib/db/favorites'
import { getReviewsByPlaceId, addReview, uploadReviewImage, type AppReview } from '@/lib/db/reviews'
import { recordStatistic } from '@/lib/db/statistics'
import {
  MapPin, Star, Heart, Share2, Navigation, ChevronLeft, ChevronRight, Image as ImageIcon, FileText, MessageSquare, X, Globe, Mail, Clock, CheckCircle2
} from 'lucide-react'

const tabs = [
  { id: 'info', label: 'Információk', icon: MapPin },
  { id: 'menu', label: 'Étlap', icon: FileText },
  { id: 'reviews', label: 'Értékelések', icon: MessageSquare },
  { id: 'photos', label: 'Fotók', icon: ImageIcon },
]

/** Csak akkor számít „beállított” linknek, ha van nem üres érték (üres string / szóköz ne jelenjen meg). */
function hasSocialLink(url: string | null | undefined): boolean {
  return url != null && String(url).trim() !== ''
}

/** Hero képhez nagyobb felbontású forrás – Unsplash ?w=400 → ?w=1200, így nem homályos. */
function getHeroImageUrl(url: string): string {
  if (!url) return url
  try {
    const u = new URL(url)
    if (u.hostname === 'images.unsplash.com') {
      u.searchParams.set('w', '1200')
      u.searchParams.set('q', '80')
      if (u.searchParams.has('h')) u.searchParams.set('h', '800')
      return u.toString()
    }
  } catch {
    // invalid URL
  }
  return url
}

export default function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { isLoggedIn } = useAuth()
  const [place, setPlace] = useState<AppPlace | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSent, setReviewSent] = useState(false)
  const [reviews, setReviews] = useState<AppReview[]>([])
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    // URL-decode a slug-ot, ha szükséges (Next.js automatikusan decode-ol, de biztosra megyünk)
    const decodedSlug = decodeURIComponent(slug)
    getPlaceBySlug(decodedSlug).then((p) => {
      setPlace(p)
      setNotFound(!p)
      setLoading(false)
    })
  }, [slug])

  useEffect(() => {
    if (!isLoggedIn || !place?.id) return
    getFavoritePlaceIds().then((ids) => setIsFavorite(ids.includes(place.id)))
  }, [isLoggedIn, place?.id])

  useEffect(() => {
    if (!place?.id) return
    getReviewsByPlaceId(place.id).then(setReviews)
  }, [place?.id])

  // Hash alapú navigáció: #menu → Étlap fül
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.slice(1) // Eltávolítjuk a #-et
    if (hash === 'menu' || hash === 'info' || hash === 'reviews' || hash === 'photos') {
      setActiveTab(hash)
    }
  }, [])

  useEffect(() => {
    if (!lightboxOpen || !place?.images?.length) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev === 0 ? place.images.length - 1 : prev - 1))
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev === place.images.length - 1 ? 0 : prev + 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, place?.images?.length])

  const handleShare = async () => {
    if (!place) return
    if (typeof window === 'undefined') return
    if (navigator.share) {
      await navigator.share({
        title: place.name,
        text: place.description,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewRating || !reviewComment.trim() || !place) return
    setReviewSubmitting(true)
    let imageUrls: string[] = []
    if (reviewImageFile) {
      const url = await uploadReviewImage(reviewImageFile)
      if (url) imageUrls = [url]
    }
    const ok = await addReview(place.id, reviewRating, reviewComment.trim(), imageUrls)
    setReviewSubmitting(false)
    if (ok) {
      const list = await getReviewsByPlaceId(place.id)
      setReviews(list)
      setReviewSent(true)
      setReviewComment('')
      setReviewRating(0)
      setReviewImageFile(null)
    }
  }

  const formatReviewDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return iso
    }
  }

  const handleDirections = () => {
    if (!place) return
    recordStatistic('direction_click', place.id)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner variant="centered" className="bg-gray-50 min-h-screen" />
      </div>
    )
  }
  if (notFound || !place) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-700 font-medium">A hely nem található.</p>
        <Link href="/terkep" className="text-[#2D7A4F] font-semibold hover:underline">Vissza a térképre</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image – nagy felbontás a herohoz (ne legyen homályos) */}
      <div className="relative h-72 md:h-96 bg-gradient-to-br from-orange-400 to-red-500 overflow-hidden">
        {place.imageUrl ? (
          <Image
            src={getHeroImageUrl(place.imageUrl)}
            alt={place.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
            quality={90}
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="h-32 w-32 text-white/20" />
        </div>

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link 
              href={place.categorySlug ? `/kategoriak/${place.categorySlug}` : '/terkep'}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:bg-white transition-all group"
            >
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Vissza</span>
            </Link>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!isLoggedIn) {
                    window.location.href = `/bejelentkezes?redirect=${encodeURIComponent(`/hely/${place.slug}`)}`
                    return
                  }
                  if (isFavorite) {
                    const ok = await removeFavorite(place.id)
                    if (ok) setIsFavorite(false)
                  } else {
                    const ok = await addFavorite(place.id)
                    if (ok) setIsFavorite(true)
                  }
                }}
                className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm hover:bg-white hover:scale-105 transition-all"
                title={isFavorite ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={handleShare}
                className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm hover:bg-white hover:scale-105 transition-all"
              >
                <Share2 className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute bottom-6 left-6 flex gap-2">
          <span className={`badge text-sm ${place.isOpen ? 'badge-success' : 'badge-danger'}`}>
            {place.isOpen ? 'Nyitva' : 'Zárva'}
          </span>
          {place.isPremium && (
            <span className="badge badge-premium text-sm">Prémium</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-12">
        {/* Main Info Card */}
        <Card elevated className="mb-6">
          <CardContent className={place.category === 'Étterem' ? 'p-4 md:p-6' : 'p-6 md:p-8'}>
            <div className={`flex flex-col md:flex-row md:items-start md:justify-between ${place.category === 'Étterem' ? 'gap-4' : 'gap-6'}`}>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium mb-1">{place.category}</p>
                <h1 className={place.category === 'Étterem' ? 'text-2xl md:text-3xl font-bold text-gray-900 mb-2' : 'text-3xl md:text-4xl font-bold text-gray-900 mb-3'}>{place.name}</h1>
                <div className={`flex flex-wrap items-center gap-4 ${place.category === 'Étterem' ? 'mb-4' : 'mb-6'}`}>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }, (_, i) => {
                      const starNum = i + 1
                      const isFilled = starNum <= Math.round(place.rating ?? 0)
                      return (
                        <Star
                          key={starNum}
                          className={`${place.category === 'Étterem' ? 'h-5 w-5' : 'h-6 w-6'} ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      )
                    })}
                    <span className={place.category === 'Étterem' ? 'text-lg font-bold' : 'text-xl font-bold'}>{place.rating}</span>
                    <span className="text-gray-400">({place.ratingCount} értékelés)</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500 font-medium">{'$'.repeat(place.priceLevel)}</span>
                </div>
              </div>

              {/* Action Buttons + Megosztás */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex gap-3">
                  <Button onClick={handleDirections} size={place.category === 'Étterem' ? 'md' : 'lg'}>
                    <Navigation className="h-5 w-5" />
                    Útvonal
                  </Button>
                </div>
                {(hasSocialLink(place.website) || hasSocialLink(place.instagram) || hasSocialLink(place.facebook) || hasSocialLink(place.youtube) || hasSocialLink(place.tiktok) || hasSocialLink(place.email)) && (
                <div className="flex flex-wrap items-center gap-2 border-l border-gray-200 pl-4">
                  <span className="text-sm font-medium text-gray-500">Linkek:</span>
                      {hasSocialLink(place.website) && (
                        <a href={place.website!.startsWith('http') ? place.website! : `https://${place.website}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 hover:bg-[#E8F5E9] text-gray-600 hover:text-[#2D7A4F] transition-all" title="Weboldal">
                          <Globe className="h-5 w-5" />
                        </a>
                      )}
                      {hasSocialLink(place.instagram) && (
                        <a href={place.instagram!.startsWith('http') ? place.instagram! : `https://instagram.com/${place.instagram!.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 hover:bg-[#E8F5E9] text-gray-600 hover:text-[#2D7A4F] transition-all" title="Instagram">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                      )}
                      {hasSocialLink(place.facebook) && (
                        <a href={place.facebook!.startsWith('http') ? place.facebook! : `https://facebook.com/${place.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 hover:bg-[#1877F2]/10 text-gray-600 hover:text-[#1877F2] transition-all" title="Facebook">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956-.925-1.956-1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/></svg>
                        </a>
                      )}
                      {hasSocialLink(place.youtube) && (
                        <a href={place.youtube!.startsWith('http') ? place.youtube! : `https://youtube.com/${place.youtube}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 hover:bg-[#E8F5E9] text-gray-600 hover:text-[#2D7A4F] transition-all" title="YouTube">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        </a>
                      )}
                      {hasSocialLink(place.tiktok) && (
                        <a href={place.tiktok!.startsWith('http') ? place.tiktok! : `https://tiktok.com/@${place.tiktok!.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 hover:bg-[#E8F5E9] text-gray-600 hover:text-[#2D7A4F] transition-all" title="TikTok">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                        </a>
                      )}
                      {hasSocialLink(place.email) && (
                        <a href={`mailto:${place.email!.trim()}`} className="p-2 rounded-xl bg-gray-100 hover:bg-[#E8F5E9] text-gray-600 hover:text-[#2D7A4F] transition-all" title="E-mail">
                          <Mail className="h-5 w-5" />
                        </a>
                      )}
                </div>
              )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="overflow-hidden">
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'text-[#2D7A4F] bg-white border-b-2 border-[#2D7A4F]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <CardContent className="p-6 md:p-8">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-8">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Leírás</h3>
                  <p className="text-gray-600 leading-relaxed">{place.description}</p>
                </div>

                {/* Contact – cím az adatbázisból */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Cím</h3>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <MapPin className="h-5 w-5 text-[#2D7A4F]" />
                    </div>
                    <span className="text-gray-600">{place.address}</span>
                  </div>
                </div>

                {/* Nyitvatartás */}
                {place.openingHours && Object.keys(place.openingHours).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#2D7A4F]" />
                      Nyitvatartás
                    </h3>
                    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="divide-y divide-gray-100">
                        {[
                          { key: 'monday', label: 'Hétfő' },
                          { key: 'tuesday', label: 'Kedd' },
                          { key: 'wednesday', label: 'Szerda' },
                          { key: 'thursday', label: 'Csütörtök' },
                          { key: 'friday', label: 'Péntek' },
                          { key: 'saturday', label: 'Szombat' },
                          { key: 'sunday', label: 'Vasárnap' },
                        ].map(({ key, label }) => {
                          const hours = place.openingHours?.[key]
                          const isToday = (() => {
                            const today = new Date().getDay()
                            const dayMap: Record<number, string> = {
                              1: 'monday',
                              2: 'tuesday',
                              3: 'wednesday',
                              4: 'thursday',
                              5: 'friday',
                              6: 'saturday',
                              0: 'sunday',
                            }
                            return dayMap[today] === key.toLowerCase()
                          })()
                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between px-4 py-3 transition-colors ${
                                isToday ? 'bg-[#E8F5E9]/50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${isToday ? 'text-[#2D7A4F]' : 'text-gray-700'}`}>
                                  {label}
                                </span>
                                {isToday && (
                                  <span className="px-2 py-0.5 bg-[#2D7A4F] text-white text-xs font-semibold rounded-full">
                                    Ma
                                  </span>
                                )}
                              </div>
                              <span className={`text-sm ${hours ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                {hours || 'Zárva'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                </div>
            )}

            {/* Menu Tab */}
            {activeTab === 'menu' && (
              <div className="py-6">
                {place.menuUrl ? (
                  <div className="space-y-4">
                    {place.menuUrl.toLowerCase().endsWith('.pdf') || place.menuUrl.includes('pdf') ? (
                      <>
                        <a
                          href={place.menuUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2D7A4F] text-white rounded-xl font-medium hover:bg-[#246b43] transition-colors"
                        >
                          <FileText className="h-5 w-5" />
                          Étlap megnyitása (PDF)
                        </a>
                        <iframe
                          src={place.menuUrl}
                          title="Étlap"
                          className="w-full h-[70vh] min-h-[400px] rounded-xl border border-gray-200 bg-white"
                        />
                      </>
                    ) : (
                      <>
                        <a
                          href={place.menuUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2D7A4F] text-white rounded-xl font-medium hover:bg-[#246b43] transition-colors"
                        >
                          <FileText className="h-5 w-5" />
                          Étlap megnyitása
                        </a>
                        <img
                          src={place.menuUrl}
                          alt="Étlap"
                          className="w-full max-w-2xl mx-auto rounded-xl border border-gray-200 shadow-sm"
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Nincs feltöltött étlap</p>
                    <p className="text-gray-400 text-sm mt-1">Hamarosan elérhető lesz</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab – komment szekció, csillag, bejelentkezéshez kötve */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }, (_, i) => {
                        const starNum = i + 1
                        const isFilled = starNum <= Math.round(place.rating ?? 0)
                        return (
                          <Star
                            key={starNum}
                            className={`h-8 w-8 ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        )
                      })}
                      <span className="text-4xl font-bold">{place.rating}</span>
                    </div>
                    <div>
                      <p className="text-gray-500">{place.ratingCount} értékelés</p>
                    </div>
                  </div>
                </div>

                {/* Értékelés írása – csak bejelentkezés után */}
                <div className="pb-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Értékelés írása</h3>
                  {!isLoggedIn ? (
                    <p className="text-gray-500 mb-4">
                      A vélemény írásához <Link href={`/bejelentkezes?redirect=${encodeURIComponent(`/hely/${place.slug}`)}`} className="text-[#2D7A4F] font-medium hover:underline">jelentkezz be</Link>.
                    </p>
                  ) : reviewSent ? (
                    <p className="text-[#2D7A4F] font-medium">Köszönjük az értékelést!</p>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Értékelés (csillag)</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="p-1 focus:outline-none"
                            >
                              <Star className={`h-8 w-8 transition-colors ${reviewRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">Vélemény</label>
                        <textarea
                          id="review-comment"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Írd le a tapasztalatodat..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 outline-none resize-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kép (opcionális)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setReviewImageFile(e.target.files?.[0] ?? null)}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#E8F5E9] file:text-[#2D7A4F] file:font-medium hover:file:bg-[#C8E6C9]"
                        />
                        {reviewImageFile && (
                          <p className="text-xs text-gray-500 mt-1">{reviewImageFile.name}</p>
                        )}
                      </div>
                      <Button type="submit" disabled={reviewRating === 0 || !reviewComment.trim() || reviewSubmitting} isLoading={reviewSubmitting}>
                        Értékelés küldése
                      </Button>
                    </form>
                  )}
                </div>

                <div className="space-y-6">
                  {reviews.length === 0 && (
                    <p className="text-gray-500 py-4">Még nincs értékelés. Legyél te az első!</p>
                  )}
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2D7A4F] to-[#1B5E20] rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {(review.user_name || 'F').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{review.user_name || 'Felhasználó'}</p>
                              <div className="flex items-center gap-0.5 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-gray-400">{formatReviewDate(review.created_at)}</span>
                          </div>
                          <p className="text-gray-600 leading-relaxed">{review.comment || ''}</p>
                          {review.images && review.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {review.images.map((imgUrl, i) => (
                                <a
                                  key={i}
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={imgUrl} alt="" className="object-cover w-full h-full" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <>
                {place.images && place.images.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {place.images.map((imgUrl, i) => (
                        <button
                          key={imgUrl + i}
                          type="button"
                          onClick={() => {
                            setLightboxIndex(i)
                            setLightboxOpen(true)
                          }}
                          className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 hover:ring-2 hover:ring-[#2D7A4F] transition-all cursor-pointer text-left"
                        >
                          {(imgUrl.startsWith('https://images.unsplash.com') || imgUrl.includes('supabase.co/storage/')) ? (
                            <Image
                              src={imgUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            />
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={imgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Lightbox – nagy kép, balra/jobbra lapozás */}
                    {lightboxOpen && (
                      <div
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Fotó nagyítás"
                        onClick={() => setLightboxOpen(false)}
                      >
                        <button
                          type="button"
                          onClick={() => setLightboxOpen(false)}
                          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                          aria-label="Bezárás"
                        >
                          <X className="h-6 w-6" />
                        </button>
                        {place.images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev === 0 ? place.images.length - 1 : prev - 1)) }}
                              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                              aria-label="Előző"
                            >
                              <ChevronLeft className="h-8 w-8" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev === place.images.length - 1 ? 0 : prev + 1)) }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                              aria-label="Következő"
                            >
                              <ChevronRight className="h-8 w-8" />
                            </button>
                          </>
                        )}
                        <div
                          className="relative max-w-[90vw] max-h-[90vh] w-full flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(place.images[lightboxIndex]?.startsWith('https://images.unsplash.com') || place.images[lightboxIndex]?.includes('supabase.co/storage/')) ? (
                            <Image
                              src={place.images[lightboxIndex]}
                              alt=""
                              width={1200}
                              height={800}
                              className="object-contain max-h-[90vh] w-auto"
                              unoptimized={place.images[lightboxIndex]?.includes('supabase.co')}
                            />
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={place.images[lightboxIndex]} alt="" className="max-h-[90vh] w-auto object-contain" />
                          )}
                        </div>
                        {place.images.length > 1 && (
                          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                            {lightboxIndex + 1} / {place.images.length}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Nincsenek feltöltött fotók</p>
                    <p className="text-gray-400 text-sm mt-1">Hamarosan elérhető lesz</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
