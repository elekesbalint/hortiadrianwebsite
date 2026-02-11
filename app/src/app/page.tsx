'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { MapPin, Utensils, Bed, Star, Heart, Wine, Camera, Bath, Baby, Sparkles, ArrowRight, Landmark, ChevronLeft, ChevronRight, Users, Eye } from 'lucide-react'
import { getPlaces, getFeaturedPlaces } from '@/lib/db/places'
import { getCategories, getFeaturedCategories } from '@/lib/db/categories'
import { recordStatistic } from '@/lib/db/statistics'
import { getCategoryIconComponent } from '@/lib/categoryIcons'
import { getSiteStatistics } from '@/lib/db/siteStatistics'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

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

/** Felkapott helyek carousel: ennyi ms után ugrik egyet vízszintesen */
const FEATURED_CAROUSEL_INTERVAL_MS = 4500

export default function HomePage() {
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [places, setPlaces] = useState<Awaited<ReturnType<typeof getPlaces>>>([])
  const [featuredPlaces, setFeaturedPlaces] = useState<Awaited<ReturnType<typeof getFeaturedPlaces>>>([])
  const [featuredCategories, setFeaturedCategories] = useState<Awaited<ReturnType<typeof getFeaturedCategories>>>([])
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([])
  const [siteStats, setSiteStats] = useState<Awaited<ReturnType<typeof getSiteStatistics>>>([])
  const [featuredPaused, setFeaturedPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const isUserInteractionRef = useRef(false) // Jelzi, hogy a változás felhasználói interakcióból jött-e
  const count = featuredPlaces.length
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
    Promise.all([getPlaces(), getFeaturedPlaces(), getFeaturedCategories(), getCategories(), getSiteStatistics()]).then(([pls, featured, featuredCats, cats, stats]) => {
      setPlaces(pls)
      setFeaturedPlaces(featured.length > 0 ? featured : pls.slice(0, 8))
      setFeaturedCategories(featuredCats)
      setCategories(cats)
      setSiteStats(stats)
    })
  }, [])

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
            Fedezd fel Magyarország legjobb helyeit – éttermek, szállások, látnivalók és programok egy helyen.
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
            <path d="M0 60 C360 100 1080 0 1440 50 L1440 100 L0 100 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Kategóriakártyák – referencia: képek + ikonok, négyzetes kártyák */}
      <section className="pt-12 pb-20 md:pt-16 md:pb-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
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
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-white/50">
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

      {/* Felkapott helyek */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
            <div>
              <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
                <Sparkles className="h-4 w-4" />
                Kiemelt helyek
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Felkapott helyek
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

          {/* Felkapott helyek – lapozható carousel, automatikus vízszintes ugrás + kézi lapozás */}
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
                  onClick={() => recordStatistic('place_click', place.id)}
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

      {/* Felkapott kategóriák */}
      {featuredCategories.length > 0 && (
        <section className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
              <div>
                <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
                  <Sparkles className="h-4 w-4" />
                  Kiemelt kategóriák
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  Felkapott kategóriák
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
                    <Card hover className="h-full group overflow-hidden">
                      <div className="relative aspect-square overflow-hidden">
                        {(imageUrl.startsWith('https://images.unsplash.com') || imageUrl.includes('supabase.co/storage/')) ? (
                          <Image
                            src={imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <img src={imageUrl} alt={category.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-white/50">
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

      {/* Térkép és statisztikák */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Térkép */}
            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d109740.5!2d19.0402!3d47.4979!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741c334d1d4cfc9%3A0x400c4290c1e1160!2sBudapest!5e0!3m2!1shu!2shu!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
                title="Magyarország térképe"
              />
            </div>

            {/* Statisztikák */}
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
                {siteStats.map((stat) => {
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
