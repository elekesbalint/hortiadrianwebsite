'use client'

import { useState, useMemo, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { MapPin, Star, Heart, ChevronDown, Map, Sliders, RotateCcw, Search, Utensils, Home, Landmark, Calendar } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getCategoryIconComponent } from '@/lib/categoryIcons'
import { getPlaces } from '@/lib/db/places'
import { getCategories } from '@/lib/db/categories'
import { getFilters, type AppFilter } from '@/lib/db/filters'
import { getFavoritePlaceIds, addFavorite, removeFavorite } from '@/lib/db/favorites'
import { recordStatistic } from '@/lib/db/statistics'
import { formatTravelTime, estimateTravelTimeMinutes, calculateDistance, getRouteDistanceAndTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

const BUDAPEST = { lat: 47.4979, lng: 19.0402 }

// Category config – hero kép minden kategóriához (Unsplash)
const categoryConfig: Record<string, { name: string; icon: any; color: string; gradient: string; heroImage: string }> = {
  'ettermek': {
    name: 'Éttermek',
    icon: Utensils,
    color: '#f97316',
    gradient: 'from-orange-400 to-red-500',
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop',
  },
  'szallasok': {
    name: 'Szállások',
    icon: Home,
    color: '#3b82f6',
    gradient: 'from-blue-400 to-indigo-500',
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=400&fit=crop',
  },
  'latnivalok': {
    name: 'Látnivalók',
    icon: Landmark,
    color: '#10b981',
    gradient: 'from-emerald-400 to-teal-500',
    heroImage: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&h=400&fit=crop',
  },
  'programok': {
    name: 'Programok',
    icon: Calendar,
    color: '#a855f7',
    gradient: 'from-purple-400 to-pink-500',
    heroImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&h=400&fit=crop',
  },
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const pathname = usePathname()
  const { isLoggedIn } = useAuth()
  const [places, setPlaces] = useState<Awaited<ReturnType<typeof getPlaces>>>([])
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([])
  const [filters, setFilters] = useState<AppFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  // Szűrők
  const [filterCity, setFilterCity] = useState('')
  const [filterRatingMin, setFilterRatingMin] = useState('')
  const [filterPriceLevel, setFilterPriceLevel] = useState('')
  const [filterMaxDistance, setFilterMaxDistance] = useState('')
  const [filterOpenOnly, setFilterOpenOnly] = useState(false)
  const [filterSortBy, setFilterSortBy] = useState<'distance' | 'rating' | 'name'>('distance')
  // Új szűrők (Évszak, Időszak, Tér, Kivel mész?, Megközelítés)
  const [filterEvszak, setFilterEvszak] = useState('')
  const [filterIdoszak, setFilterIdoszak] = useState('')
  const [filterTer, setFilterTer] = useState('')
  const [filterKivelMesz, setFilterKivelMesz] = useState('')
  const [filterMegkozelites, setFilterMegkozelites] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    Promise.all([getPlaces(), getCategories(), getFilters()]).then(([pls, cats, filts]) => {
      setPlaces(pls)
      setCategories(cats)
      setFilters(filts)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    getFavoritePlaceIds().then(setFavorites)
  }, [isLoggedIn])

  // Felhasználó helyének lekérése
  useEffect(() => {
    if (typeof window === 'undefined' || !window.navigator?.geolocation) return
    window.navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        // Hiba esetén nem csinálunk semmit, marad Budapest
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  const config = categoryConfig[slug] || { name: slug, icon: MapPin, color: '#2D7A4F', gradient: 'from-emerald-400 to-teal-500', heroImage: '' }
  const categoryBySlug = useMemo(() => categories.find((c) => c.slug === slug), [categories, slug])
  /** Részletes oldal: DB-ből a megjelenített név (és opcionális detail_page_title), ikon pedig a headerrel egyezzen. */
  const displayName = categoryBySlug?.detail_page_title ?? categoryBySlug?.name ?? config.name
  const Icon = getCategoryIconComponent(categoryBySlug?.icon ?? null) ?? config.icon
  const heroImageUrl = categoryBySlug?.image || config.heroImage
  const placesInCategory = useMemo(() => {
    if (!categoryBySlug) return places
    return places.filter((p) => p.category_id === categoryBySlug.id)
  }, [places, categoryBySlug])

  const centerForDistance = userLocation ?? BUDAPEST
  
  // Először légvonalban számolunk (gyors)
  const filteredPlacesInitial = useMemo(() => {
    let list = placesInCategory.map((p) => ({
      ...p,
      distanceFromCenter: calculateDistance(centerForDistance.lat, centerForDistance.lng, p.lat, p.lng),
      travelTimeMinutes: estimateTravelTimeMinutes(calculateDistance(centerForDistance.lat, centerForDistance.lng, p.lat, p.lng)),
    }))
    // Kereső
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      )
    }
    // Hol? – város a címben
    if (filterCity) {
      const city = filterCity.toLowerCase()
      list = list.filter((p) => p.address.toLowerCase().includes(city))
    }
    // Értékelés
    if (filterRatingMin) {
      const min = parseFloat(filterRatingMin)
      list = list.filter((p) => p.rating >= min)
    }
    // Árkategória
    if (filterPriceLevel) {
      const level = parseInt(filterPriceLevel, 10)
      list = list.filter((p) => p.priceLevel === level)
    }
    // Távolság max
    if (filterMaxDistance) {
      const max = parseFloat(filterMaxDistance)
      list = list.filter((p) => p.distanceFromCenter <= max)
    }
    // Nyitva most
    if (filterOpenOnly) list = list.filter((p) => p.isOpen)
    
    // Új szűrők (Évszak, Időszak, Tér, Kivel mész?, Megközelítés)
    const activeFilterSlugs: string[] = []
    if (filterEvszak) activeFilterSlugs.push(filterEvszak)
    if (filterIdoszak) activeFilterSlugs.push(filterIdoszak)
    if (filterTer) activeFilterSlugs.push(filterTer)
    if (filterKivelMesz) activeFilterSlugs.push(filterKivelMesz)
    if (filterMegkozelites) activeFilterSlugs.push(filterMegkozelites)
    
    if (activeFilterSlugs.length > 0) {
      // Szűrő slug-okból filter ID-kat keresünk
      const filterIds = filters
        .filter((f) => activeFilterSlugs.includes(f.slug))
        .map((f) => f.id)
      
      if (filterIds.length > 0) {
        // Csak azokat a helyeket tartjuk meg, amelyek rendelkeznek legalább egy kiválasztott szűrővel
        list = list.filter((p) => {
          const placeFilterIds = p.filterIds ?? []
          return filterIds.some((fid) => placeFilterIds.includes(fid))
        })
      }
    }
    
    // Rendezés
    list = [...list].sort((a, b) => {
      if (filterSortBy === 'distance') return a.distanceFromCenter - b.distanceFromCenter
      if (filterSortBy === 'rating') return b.rating - a.rating
      return a.name.localeCompare(b.name)
    })
    return list
  }, [placesInCategory, searchQuery, filterCity, filterRatingMin, filterPriceLevel, filterMaxDistance, filterOpenOnly, filterSortBy, filters, filterEvszak, filterIdoszak, filterTer, filterKivelMesz, filterMegkozelites, centerForDistance])

  // Google Maps API-val pontosítjuk az első 10 hely távolságát és idejét (ha elérhető)
  const [filteredPlaces, setFilteredPlaces] = useState(filteredPlacesInitial)
  
  useEffect(() => {
    setFilteredPlaces(filteredPlacesInitial)
    
    // Csak akkor használjuk az API-t, ha a Google Maps elérhető és van userLocation
    if (typeof window === 'undefined' || !window.google?.maps?.DirectionsService || !userLocation) return
    
    // Csak az első 10 helyre használjuk az API-t (hogy ne legyen túl sok hívás)
    const topPlaces = filteredPlacesInitial.slice(0, 10)
    
    // Aszinkron módon frissítjük a távolságokat és időket
    Promise.all(
      topPlaces.map(async (place) => {
        const route = await getRouteDistanceAndTime(
          centerForDistance,
          { lat: place.lat, lng: place.lng }
        )
        if (route) {
          return { ...place, distanceFromCenter: route.distanceKm, travelTimeMinutes: route.durationMinutes }
        }
        return place
      })
    ).then((updatedPlaces) => {
      // Frissítjük csak az első 10 helyet, a többit meghagyjuk
      const restPlaces = filteredPlacesInitial.slice(10)
      setFilteredPlaces([...updatedPlaces, ...restPlaces])
    })
  }, [filteredPlacesInitial, userLocation, centerForDistance])

  const resetFilters = () => {
    setFilterCity('')
    setFilterRatingMin('')
    setFilterEvszak('')
    setFilterIdoszak('')
    setFilterTer('')
    setFilterKivelMesz('')
    setFilterMegkozelites('')
    setFilterPriceLevel('')
    setFilterMaxDistance('')
    setFilterOpenOnly(false)
    setFilterSortBy('distance')
  }

  const hasActiveFilters = filterCity || filterRatingMin || filterPriceLevel || filterMaxDistance || filterOpenOnly || filterSortBy !== 'distance' || filterEvszak || filterIdoszak || filterTer || filterKivelMesz || filterMegkozelites

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) {
      window.location.href = `/bejelentkezes?redirect=${encodeURIComponent(pathname)}`
      return
    }
    const isCurrentlyFavorite = favorites.includes(id)
    if (isCurrentlyFavorite) {
      const ok = await removeFavorite(id)
      if (ok) setFavorites((prev) => prev.filter((f) => f !== id))
    } else {
      const ok = await addFavorite(id)
      if (ok) setFavorites((prev) => [...prev, id])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner variant="centered" className="bg-gray-50 min-h-screen" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header – professzionális overlay, típográfia, animáció */}
      <div className={`relative py-16 overflow-hidden min-h-[200px] flex items-center ${heroImageUrl ? '' : `bg-gradient-to-r ${config.gradient}`}`}>
        {heroImageUrl && (
          <>
            <div className="absolute inset-0">
              {(heroImageUrl.startsWith('https://images.unsplash.com') || heroImageUrl.includes('supabase.co/storage/')) ? (
                <Image
                  src={heroImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              ) : (
                <img src={heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
            </div>
            {/* Finom overlay - csak fekete, színes gradiens eltávolítva */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
          </>
        )}
        {!heroImageUrl && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-20 w-48 h-48 bg-white rounded-full blur-3xl" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center gap-6 animate-hero-fade-in-up">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/20 animate-hero-fade-in-up-delay-1">
              <Icon className="h-10 w-10 md:h-12 md:w-12 text-white" />
            </div>
            <div className="animate-hero-fade-in-up-delay-2">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)] font-brand tracking-tight">
                {displayName}
              </h1>
              <p className="text-white/95 mt-2 md:mt-3 text-xl md:text-2xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                {filteredPlaces.length} helyszín található
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kereső + Szűrő sáv */}
      <div className="bg-white border-b border-gray-100 sticky top-16 lg:top-20 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Kereső */}
          <div className="mb-4">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder={`Keresés a ${displayName.toLowerCase()} között (név, leírás, cím)...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-medium"
                >
                  Törlés
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
              <Button 
                variant={isFilterOpen ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Sliders className="h-4 w-4" />
                Szűrők
                <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {/* Quick Filters */}
              <Button
                variant={filterOpenOnly ? 'primary' : 'ghost'}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setFilterOpenOnly((v) => !v)}
              >
                Nyitva most
              </Button>
              <Button
                variant={filterRatingMin === '4' ? 'primary' : 'ghost'}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setFilterRatingMin(filterRatingMin === '4' ? '' : '4')}
              >
                4+ csillag
              </Button>
              <Button
                variant={filterSortBy === 'distance' ? 'primary' : 'ghost'}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setFilterSortBy('distance')}
              >
                Közelben
              </Button>
            </div>

            <Link href={`/terkep?kategoria=${slug}`}>
              <Button variant="secondary" size="sm">
                <Map className="h-4 w-4" />
                Térkép
              </Button>
            </Link>
          </div>

          {/* Szűrők – diagram szerint: Hol?, Évszak, Időszak, Tér, Kivel mész?, Megközelítés + meglévők */}
          {isFilterOpen && (
            <div className="mt-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hol?</label>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                  >
                    <option value="">Teljes ország</option>
                    <option value="Budapest">Budapest</option>
                    <option value="Debrecen">Debrecen</option>
                    <option value="Pécs">Pécs</option>
                    <option value="Szeged">Szeged</option>
                    <option value="Győr">Győr</option>
                    <option value="Eger">Eger</option>
                    <option value="Sopron">Sopron</option>
                    <option value="Veszprém">Veszprém</option>
                    <option value="Siófok">Siófok</option>
                    <option value="Hollókő">Hollókő</option>
                    <option value="Tokaj">Tokaj</option>
                  </select>
                </div>
                {/* Dinamikusan generált szűrők az adatbázisból */}
                {Object.entries(
                  filters.reduce<Record<string, AppFilter[]>>((acc, f) => {
                    const key = f.group_slug || 'egyeb'
                    if (!acc[key]) acc[key] = []
                    acc[key].push(f)
                    return acc
                  }, {})
                )
                  .filter(([groupSlug]) => 
                    ['evszak', 'idoszak', 'ter', 'kivel-mesz', 'megkozelites'].includes(groupSlug)
                  )
                  .map(([groupSlug, items]) => {
                    const groupName = items[0]?.group_name || groupSlug
                    const getValue = () => {
                      if (groupSlug === 'evszak') return filterEvszak
                      if (groupSlug === 'idoszak') return filterIdoszak
                      if (groupSlug === 'ter') return filterTer
                      if (groupSlug === 'kivel-mesz') return filterKivelMesz
                      if (groupSlug === 'megkozelites') return filterMegkozelites
                      return ''
                    }
                    const setValue = (val: string) => {
                      if (groupSlug === 'evszak') setFilterEvszak(val)
                      else if (groupSlug === 'idoszak') setFilterIdoszak(val)
                      else if (groupSlug === 'ter') setFilterTer(val)
                      else if (groupSlug === 'kivel-mesz') setFilterKivelMesz(val)
                      else if (groupSlug === 'megkozelites') setFilterMegkozelites(val)
                    }
                    
                    return (
                      <div key={groupSlug}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{groupName}</label>
                        <select
                          value={getValue()}
                          onChange={(e) => setValue(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                        >
                          <option value="">Mind</option>
                          {items
                            .sort((a, b) => a.order - b.order)
                            .map((filter) => (
                              <option key={filter.id} value={filter.slug}>
                                {filter.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )
                  })}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Távolság</label>
                  <select
                    value={filterMaxDistance}
                    onChange={(e) => setFilterMaxDistance(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                  >
                    <option value="">Mind</option>
                    <option value="1">1 km</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Értékelés</label>
                  <select
                    value={filterRatingMin}
                    onChange={(e) => setFilterRatingMin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                  >
                    <option value="">Mind</option>
                    <option value="4">4+ csillag</option>
                    <option value="4.5">4.5+ csillag</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Árkategória</label>
                  <select
                    value={filterPriceLevel}
                    onChange={(e) => setFilterPriceLevel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                  >
                    <option value="">Mind</option>
                    <option value="1">$</option>
                    <option value="2">$$</option>
                    <option value="3">$$$</option>
                    <option value="4">$$$$</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rendezés</label>
                  <select
                    value={filterSortBy}
                    onChange={(e) => setFilterSortBy(e.target.value as 'distance' | 'rating' | 'name')}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                  >
                    <option value="distance">Távolság</option>
                    <option value="rating">Értékelés</option>
                    <option value="name">Név</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" className="w-full" onClick={resetFilters} disabled={!hasActiveFilters}>
                    <RotateCcw className="h-4 w-4" />
                    Törlés
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Places Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => (
            <Link key={place.id} href={`/hely/${place.slug || place.id}`} onClick={() => recordStatistic('place_click', place.id)}>
              <Card hover className="h-full group relative">
                {/* Favorite Button – csak bejelentkezés után adható kedvencnek */}
                <button
                  onClick={(e) => toggleFavorite(e, place.id)}
                  className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-white hover:scale-110 transition-all duration-200"
                  title={isLoggedIn ? (favorites.includes(place.id) ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez') : 'Bejelentkezés szükséges a kedvencekhez adáshoz'}
                >
                  <Heart 
                    className={`h-5 w-5 transition-colors ${
                      favorites.includes(place.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`} 
                  />
                </button>

                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-gray-200">
                  <Image
                    src={place.imageUrl}
                    alt={place.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`badge ${place.isOpen ? 'badge-success' : 'badge-danger'}`}>
                      {place.isOpen ? 'Nyitva' : 'Zárva'}
                    </span>
                    {place.isPremium && (
                      <span className="badge badge-premium">Prémium</span>
                    )}
                  </div>
                </div>

                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold">{place.rating}</span>
                      <span className="text-gray-400">({place.ratingCount})</span>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{place.distanceFromCenter.toFixed(1)} km · {formatTravelTime((place as any).travelTimeMinutes ?? estimateTravelTimeMinutes(place.distanceFromCenter))}</span>
                  </div>

                  <CardTitle className="text-xl mb-2 group-hover:text-[#2D7A4F] transition-colors">
                    {place.name}
                  </CardTitle>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{place.description}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">{place.address}</span>
                    <span className="text-sm text-gray-400 font-medium">
                      {'$'.repeat(place.priceLevel)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
