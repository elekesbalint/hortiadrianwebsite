'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { MapPin, Utensils, Bed, Star, Heart, Wine, Camera, Bath, Baby, Sparkles, ArrowRight, Landmark, ChevronLeft, ChevronRight, Users, Eye, Calendar } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { useCategoriesContext } from '@/components/providers/CategoriesProvider'
import { getCategoryIconComponent } from '@/lib/categoryIcons'

/** Ikon a kategóriához: ha van mentett icon a DB-ben, azt; különben slug alapján (ugyanaz, mint headerben és részletes nézetben). */
function getCategoryIcon(slug: string, iconFromDb: string | null) {
  const fromDb = getCategoryIconComponent(iconFromDb)
  if (fromDb) return fromDb
  const s = slug.toLowerCase()
  return getCategoryIconComponent(
    s.includes('etterm') || s.includes('gasztro') ? 'Utensils'
    : s.includes('szallas') ? 'Bed'
    : s.includes('wellness') || s.includes('spa') ? 'Sparkles'
    : s.includes('program') ? 'Calendar'
    : s.includes('latnivalo') ? 'Landmark'
    : 'MapPin'
  ) ?? MapPin
}

const categoryImages: Record<string, string> = {
  ettermek: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  szallasok: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
  latnivalok: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop',
  programok: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop',
}
const defaultCategoryImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop'

/** Népszerű helyek carousel: ennyi ms után ugrik egyet vízszintesen */
const FEATURED_CAROUSEL_INTERVAL_MS = 4500

export default function HomePage() {
  const { categories, featuredCategories, places, featuredPlaces, upcomingEvents, siteStats } = useCategoriesContext()
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [featuredPaused, setFeaturedPaused] = useState(false)
  const [carouselIndexEvents, setCarouselIndexEvents] = useState(0)
  const [eventsPaused, setEventsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const scrollRefEvents = useRef<HTMLDivElement>(null)
  const slideRefsEvents = useRef<(HTMLAnchorElement | null)[]>([])
  const isUserInteractionRef = useRef(false)
  const isUserInteractionRefEvents = useRef(false)
  const count = featuredPlaces.length
  const countEvents = upcomingEvents.length
  // Csak azokat a kategóriákat jelenítjük meg, amelyek a headerben is megjelennek (show_in_header = true)
  const categoriesWithDisplay = categories
    .filter((c) => c.show_in_header)
    .map((c) => ({
      ...c,
      icon: getCategoryIcon(c.slug, c.icon),
      imageUrl: c.image || categoryImages[c.slug] || defaultCategoryImage,
      count: places.filter((p) => p.category_id === c.id).length,
    }))

  useEffect(() => {
    const slide = slideRefs.current[carouselIndex]
    if (!slide) {
      isUserInteractionRef.current = false
      return
    }
    
    // Csak akkor scrollolunk, ha felhasználói interakció történt (nem automatikus változás)
    if (!isUserInteractionRef.current) {
      isUserInteractionRef.current = false
      return
    }
    
    // Csak akkor scrollolunk, ha a carousel látható a viewportban
    const carouselSection = slide.closest('section')
    if (!carouselSection) {
      isUserInteractionRef.current = false
      return
    }
    
    const rect = carouselSection.getBoundingClientRect()
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0
    
    // Csak vízszintesen scrollolunk (inline), nem függőlegesen (block), hogy ne ugorjon az oldal
    if (isVisible) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
    
    isUserInteractionRef.current = false
  }, [carouselIndex])

  const goPrev = () => {
    isUserInteractionRef.current = true
    setCarouselIndex((i) => (count <= 1 ? 0 : i === 0 ? count - 1 : i - 1))
  }
  const goNext = () => {
    isUserInteractionRef.current = true
    setCarouselIndex((i) => (count <= 1 ? 0 : i === count - 1 ? 0 : i + 1))
  }

  useEffect(() => {
    if (count <= 1 || featuredPaused) return
    const t = setInterval(() => {
      setCarouselIndex((i) => (i === count - 1 ? 0 : i + 1))
    }, FEATURED_CAROUSEL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [count, featuredPaused])

  useEffect(() => {
    const slide = slideRefsEvents.current[carouselIndexEvents]
    if (!slide) {
      isUserInteractionRefEvents.current = false
      return
    }
    if (!isUserInteractionRefEvents.current) {
      isUserInteractionRefEvents.current = false
      return
    }
    const carouselSection = slide.closest('section')
    if (!carouselSection) {
      isUserInteractionRefEvents.current = false
      return
    }
    const rect = carouselSection.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
    isUserInteractionRefEvents.current = false
  }, [carouselIndexEvents])

  const goPrevEvents = () => {
    isUserInteractionRefEvents.current = true
    setCarouselIndexEvents((i) => (countEvents <= 1 ? 0 : i === 0 ? countEvents - 1 : i - 1))
  }
  const goNextEvents = () => {
    isUserInteractionRefEvents.current = true
    setCarouselIndexEvents((i) => (countEvents <= 1 ? 0 : i === countEvents - 1 ? 0 : i + 1))
  }

  useEffect(() => {
    if (countEvents <= 1 || eventsPaused) return
    const t = setInterval(() => {
      setCarouselIndexEvents((i) => (i === countEvents - 1 ? 0 : i + 1))
    }, FEATURED_CAROUSEL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [countEvents, eventsPaused])

  const formatEventDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('hu-HU', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div className="overflow-hidden">
      {/* Hero – professzionális overlay, típográfia, animáció */}
      <section className="relative min-h-[50vh] flex items-center justify-center">
        {/* Háttérkép + gradiens overlay (lapos sötét helyett) */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 text-center">
          <Image src="/logo.png" alt="Programláz" width={224} height={112} className="mx-auto mb-6 h-24 sm:h-28 w-auto object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] animate-hero-fade-in-up brightness-0 invert" priority />
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.5)] font-brand animate-hero-fade-in-up animate-hero-fade-in-up-delay-1">
            Programláz
          </h1>
          <p className="text-lg md:text-xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed animate-hero-fade-in-up animate-hero-fade-in-up-delay-2">
            Fedezd fel hazánk legjobb helyeit – éttermek, szállások, látnivalók és élmények egy platformon.
          </p>
          <Link href="/terkep" className="inline-block animate-hero-fade-in-up animate-hero-fade-in-up-delay-3">
            <Button size="lg" className="bg-[#E8F5E9] text-[#1B5E20] hover:bg-white hover:text-[#2D7A4F] border-0 shadow-xl hover:shadow-2xl hover:shadow-[#2D7A4F]/25 hover:scale-105 transition-all duration-300 text-base font-semibold rounded-2xl px-8 py-6">
              <MapPin className="h-5 w-5 mr-2" />
              Ugrás a térképre
            </Button>
          </Link>
        </div>

        {/* Wave – simább, organikus átmenet */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 60 C360 100 1080 0 1440 50 L1440 100 L0 100 Z" fill="#E5E5E5"/>
          </svg>
        </div>
      </section>

      {/* Kategóriakártyák – referencia: képek + ikonok, négyzetes kártyák */}
      <section className="pt-8 pb-8 md:pt-16 md:pb-28 bg-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 md:mb-12 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              Fedezd fel a kategóriákat
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Válassz egy kategóriát és találd meg a legjobb helyeket Magyarországon
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categoriesWithDisplay.map((category, index) => {
              const Icon = category.icon
              return (
                <Link key={category.id} href={`/kategoriak/${category.slug}`}>
                  <Card hover elevated className="h-full group overflow-hidden animate-hero-fade-in-up" style={{ animationDelay: `${0.1 * (index % 4)}s` }}>
                    <div className="relative aspect-square overflow-hidden">
                      {(category.imageUrl.startsWith('https://images.unsplash.com') || category.imageUrl.includes('supabase.co/storage/')) ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <img src={category.imageUrl} alt={category.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-white/50">
                          <Icon className="h-7 w-7 md:h-8 md:w-8 text-[#2D7A4F]" />
                        </div>
                        <span className="text-white font-semibold text-center text-sm md:text-base drop-shadow-lg">
                          {category.name}
                        </span>
                      </div>
                    </div>
                    <CardContent className="py-3 px-4">
                      <CardDescription className="font-medium text-gray-600 text-sm">
                        {category.count > 0 ? `${category.count} helyszín` : 'Hamarosan'}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Kiemelt kategóriák */}
      {featuredCategories.length > 0 && (
        <section className="py-8 md:py-28 bg-[#E5E5E5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-4 md:mb-12">
              <div>
                <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
                  <Sparkles className="h-4 w-4" />
                  Kiemelt kategóriák
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  Kiemelt kategóriák
                </h2>
                <p className="text-lg text-gray-500">
                  A legnépszerűbb kategóriák most
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredCategories.map((category) => {
                const Icon = getCategoryIcon(category.slug, category.icon)
                const imageUrl = category.image || categoryImages[category.slug] || defaultCategoryImage
                const count = places.filter((p) => p.category_id === category.id).length
                return (
                  <Link key={category.id} href={`/kategoriak/${category.slug}`}>
                    <Card hover elevated className="h-full group overflow-hidden">
                      <div className="relative aspect-square overflow-hidden">
                        {(imageUrl.startsWith('https://images.unsplash.com') || imageUrl.includes('supabase.co/storage/')) ? (
                          <Image
                            src={imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <img src={imageUrl} alt={category.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-white/50">
                            <Icon className="h-7 w-7 md:h-8 md:w-8 text-[#2D7A4F]" />
                          </div>
                          <span className="text-white font-semibold text-center text-sm md:text-base drop-shadow-lg">
                            {category.name}
                          </span>
                        </div>
                      </div>
                      <CardContent className="py-3 px-4">
                        <CardDescription className="font-medium text-gray-600 text-sm">
                          {count > 0 ? `${count} helyszín` : 'Hamarosan'}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Közelgő események – mindig a helyén; ha nincs esemény, üzenet */}
      <section className="py-8 md:py-28 bg-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-4 md:mb-12">
            <div>
              <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
                <Calendar className="h-4 w-4" />
                Közelgő események
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Közelgő események
              </h2>
              <p className="text-lg text-gray-500">
                Események naptári sorrendben
              </p>
            </div>
            <Link href="/terkep" className="group flex items-center gap-2 text-[#2D7A4F] font-semibold hover:gap-3 transition-all">
              Összes megtekintése
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div
              className="relative"
              onMouseEnter={() => setEventsPaused(true)}
              onMouseLeave={() => setEventsPaused(false)}
            >
              <div
                ref={scrollRefEvents}
                className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 scroll-smooth scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {upcomingEvents.map((place, i) => (
                  <Link
                    key={place.id}
                    ref={(el) => { slideRefsEvents.current[i] = el }}
                    href={`/hely/${place.slug || place.id}`}
                    className="flex-shrink-0 w-[min(100%,420px)] sm:w-[min(100%,480px)] lg:w-[520px] snap-center"
                  >
                    <Card hover className="h-full group overflow-hidden">
                      <div className="relative h-64 sm:h-72 overflow-hidden">
                        <Image
                          src={place.imageUrl || defaultCategoryImage}
                          alt={place.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 520px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          {place.eventDate && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-800 backdrop-blur-sm">
                              {formatEventDate(place.eventDate)}
                            </span>
                          )}
                          {place.isPremium && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/90 text-white backdrop-blur-sm">Prémium</span>}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <p className="text-sm text-white/90">{place.category} · {place.address.split(',')[0]?.trim() ?? ''}</p>
                          <CardTitle className="text-xl sm:text-2xl mt-1 text-white drop-shadow-md group-hover:text-[#E8F5E9] transition-colors">
                            {place.name}
                          </CardTitle>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={goPrevEvents}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:translate-x-0 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-xl hover:shadow-2xl flex items-center justify-center text-gray-700 hover:bg-[#E8F5E9] hover:text-[#2D7A4F] transition-all hover:scale-110"
                aria-label="Előző"
              >
                <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
              </button>
              <button
                type="button"
                onClick={goNextEvents}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-0 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-xl hover:shadow-2xl flex items-center justify-center text-gray-700 hover:bg-[#E8F5E9] hover:text-[#2D7A4F] transition-all hover:scale-110"
                aria-label="Következő"
              >
                <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
              </button>
              <div className="flex justify-center gap-2 mt-6">
                {upcomingEvents.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      isUserInteractionRefEvents.current = true
                      setCarouselIndexEvents(i)
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === carouselIndexEvents ? 'bg-[#2D7A4F] scale-125' : 'bg-gray-300 hover:bg-gray-400'}`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 rounded-2xl border border-gray-200 p-10 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Nincs közelgő esemény</p>
              <p className="text-sm text-gray-500 mt-1">Ha Programok vagy Esemény kategóriában adsz meg egy helyet jövőbeli esemény dátummal, az itt fog megjelenni.</p>
            </div>
          )}
        </div>
      </section>

      {/* Népszerű helyek */}
      <section className="py-8 md:py-28 bg-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-4 md:mb-12">
            <div>
              <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
                <Sparkles className="h-4 w-4" />
                Kiemelt helyek
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Népszerű helyek
              </h2>
              <p className="text-lg text-gray-500">
                A legnépszerűbb helyszínek most
              </p>
            </div>
            <Link href="/terkep" className="group flex items-center gap-2 text-[#2D7A4F] font-semibold hover:gap-3 transition-all">
              Összes megtekintése
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Népszerű helyek – lapozható carousel, automatikus vízszintes ugrás + kézi lapozás */}
          <div
            className="relative"
            onMouseEnter={() => setFeaturedPaused(true)}
            onMouseLeave={() => setFeaturedPaused(false)}
          >
            <div
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 scroll-smooth scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {featuredPlaces.map((place, i) => (
                <Link
                  key={place.id}
                  ref={(el) => { slideRefs.current[i] = el }}
                  href={`/hely/${place.slug || place.id}`}
                  className="flex-shrink-0 w-[min(100%,420px)] sm:w-[min(100%,480px)] lg:w-[520px] snap-center"
                >
                  <Card hover className="h-full group overflow-hidden">
                    <div className="relative h-64 sm:h-72 overflow-hidden">
                      <Image
                        src={place.imageUrl}
                        alt={place.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 520px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${place.isOpen ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                          {place.isOpen ? 'Nyitva' : 'Zárva'}
                        </span>
                        {place.isPremium && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/90 text-white backdrop-blur-sm">Prémium</span>}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-sm text-white/90">{place.category} · {place.address.split(',')[0]?.trim() ?? ''}</p>
                        <CardTitle className="text-xl sm:text-2xl mt-1 text-white drop-shadow-md group-hover:text-[#E8F5E9] transition-colors">
                          {place.name}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-2">
                          {Array.from({ length: 5 }, (_, i) => {
                            const starNum = i + 1
                            const isFilled = starNum <= Math.round(place.rating)
                            return (
                              <Star
                                key={starNum}
                                className={`h-5 w-5 ${
                                  isFilled
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            )
                          })}
                          <span className="font-bold">{place.rating}</span>
                          <span className="text-white/80">({place.ratingCount})</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:translate-x-0 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-xl hover:shadow-2xl flex items-center justify-center text-gray-700 hover:bg-[#E8F5E9] hover:text-[#2D7A4F] transition-all hover:scale-110"
              aria-label="Előző"
            >
              <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-0 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-xl hover:shadow-2xl flex items-center justify-center text-gray-700 hover:bg-[#E8F5E9] hover:text-[#2D7A4F] transition-all hover:scale-110"
              aria-label="Következő"
            >
              <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
            </button>
            <div className="flex justify-center gap-2 mt-6">
              {featuredPlaces.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    isUserInteractionRef.current = true
                    setCarouselIndex(i)
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === carouselIndex ? 'bg-[#2D7A4F] scale-125' : 'bg-gray-300 hover:bg-gray-400'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Térkép és főoldal statisztikák (adminból szerkeszthető: Főoldal statisztikák) */}
      <section className="py-8 md:py-28 bg-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-center">
            {/* Magyarország térkép gombostűkkel (átlátszó háttér) – mobilnézetben kisebb távolság a címsor előtt */}
            <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-2xl">
              <Image
                src="/images/magyarorszag-pins-clean.png"
                alt="Magyarország – fedezd fel a helyeket"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {/* Főoldal statisztika kártyák (site_statistics táblából, adminból szerkeszthető) */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Csatlakozz közösségünkhöz
                </h2>
                <p className="text-lg text-gray-600">
                  Több ezer partner és százezres megtekintések – fedezd fel Magyarország legjobb helyeit velünk!
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(siteStats.length > 0 ? siteStats : [
                  { key: 'page_views', value: 100000, display_label: 'Megtekintés' },
                  { key: 'partners', value: 2000, display_label: 'Partner' },
                ]).map((stat) => {
                  const isPartners = stat.key === 'partners'
                  const Icon = isPartners ? Users : Eye
                  return (
                    <div
                      key={stat.key}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-[#2D7A4F] transition-all hover:shadow-xl"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                          <Icon className="h-7 w-7 text-[#2D7A4F]" />
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                            <AnimatedCounter value={stat.value} />
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {stat.display_label || (isPartners ? 'Partner' : 'Megtekintés')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
