'use client'

import { useState, useMemo, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { MapPin, Star, Heart, ChevronDown, Map, Sliders, RotateCcw, Search, Utensils, Home, Landmark, Calendar, Clock, Users, Route, Tag, Gauge, CheckCircle, X, CloudRain, Baby, Sparkles, Camera, Music } from 'lucide-react'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { DistanceSlider } from '@/components/ui/DistanceSlider'
import { FilterChip } from '@/components/ui/FilterChip'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getCategoryIconComponent } from '@/lib/categoryIcons'
import { getPlaces } from '@/lib/db/places'
import { getCategories } from '@/lib/db/categories'
import { getFilters, type AppFilter } from '@/lib/db/filters'
import { getCategoryFilterGroupsMap } from '@/lib/db/categoryFilterGroups'
import { getFavoritePlaceIds, addFavorite, removeFavorite } from '@/lib/db/favorites'
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
  const [categoryFilterGroupsMap, setCategoryFilterGroupsMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  // Szűrők
  const [filterCity, setFilterCity] = useState('')
  const [filterPriceLevel, setFilterPriceLevel] = useState('')
  const [filterMaxDistance, setFilterMaxDistance] = useState<number | null>(null)
  const [filterOpenOnly, setFilterOpenOnly] = useState(false)
  const [filterSortBy, setFilterSortBy] = useState<'distance' | 'rating' | 'name'>('distance')
  // Dinamikus szűrők (kategória-specifikus) - több opció kijelöléséhez
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [filterEventDateFrom, setFilterEventDateFrom] = useState<string>('')
  const [filterEventDateTo, setFilterEventDateTo] = useState<string>('')
  const [filterQuickDate, setFilterQuickDate] = useState<string>('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    Promise.all([getPlaces(), getCategories(), getFilters(), getCategoryFilterGroupsMap()]).then(([pls, cats, filts, map]) => {
      setPlaces(pls)
      setCategories(cats)
      setFilters(filts)
      setCategoryFilterGroupsMap(map)
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
    // Hol? – város/település a címben (rugalmas keresés)
    if (filterCity && filterCity.trim()) {
      const cityQuery = filterCity.trim().toLowerCase()
      list = list.filter((p) => {
        const address = p.address.toLowerCase()
        // Keresés a címben (részleges egyezés)
        return address.includes(cityQuery)
      })
    }
    // Árkategória
    if (filterPriceLevel) {
      const level = parseInt(filterPriceLevel, 10)
      list = list.filter((p) => p.priceLevel === level)
    }
    // Távolság max
    if (filterMaxDistance !== null && filterMaxDistance > 0) {
      list = list.filter((p) => p.distanceFromCenter <= filterMaxDistance)
    }
    // Nyitva most
    if (filterOpenOnly) list = list.filter((p) => p.isOpen)
    
    // Dátum szerinti szűrés (csak programokhoz) - tól-ig tartomány
    if ((filterEventDateFrom || filterEventDateTo) && slug === 'programok') {
      const fromDate = filterEventDateFrom ? new Date(filterEventDateFrom) : null
      const toDate = filterEventDateTo ? new Date(filterEventDateTo) : null
      
      if (fromDate) fromDate.setHours(0, 0, 0, 0)
      if (toDate) {
        toDate.setHours(23, 59, 59, 999) // A nap végéig
      }
      
      list = list.filter((p) => {
        if (!p.eventDate) return false
        const eventDate = new Date(p.eventDate)
        
        if (fromDate && eventDate < fromDate) return false
        if (toDate && eventDate > toDate) return false
        return true
      })
    }
    
    // Dinamikus szűrők (kategória-specifikus) - több opció kijelöléséhez
    const activeFilterSlugs = Object.values(activeFilters).flat().filter(Boolean)
    
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
  }, [placesInCategory, searchQuery, filterCity, filterPriceLevel, filterMaxDistance, filterOpenOnly, filterSortBy, filters, activeFilters, filterEventDateFrom, filterEventDateTo, slug, centerForDistance])

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
    setFilterPriceLevel('')
    setFilterMaxDistance(null)
    setFilterOpenOnly(false)
    setFilterSortBy('distance')
    setActiveFilters({})
    setFilterEventDateFrom('')
    setFilterEventDateTo('')
    setFilterQuickDate('')
  }

  const hasActiveFilters = filterCity || filterPriceLevel || filterMaxDistance !== null || filterOpenOnly || filterSortBy !== 'distance' || Object.values(activeFilters).some((arr) => arr.length > 0) || filterEventDateFrom || filterEventDateTo

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
        </div>
      </div>

      {/* Szűrő Modal – overlay ablak */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setIsFilterOpen(false)}
        >
          <div 
            className="w-full md:w-full md:max-w-4xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom-2 md:slide-in-from-top-2 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Szűrők</h3>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                    className="text-gray-600 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Törlés
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    aria-label="Bezárás"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Szűrő mezők – scrollozható tartalom */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-4">
                {/* Hol? – Google Places Autocomplete */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className={`h-4 w-4 ${filterCity ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${filterCity ? 'text-[#2D7A4F]' : 'text-gray-700'}`}>
                      Hol?
                    </span>
                    {filterCity && (
                      <span className="px-2 py-0.5 bg-[#2D7A4F] text-white text-[10px] font-bold rounded-full">
                        Aktív
                      </span>
                    )}
                  </div>
                  <CityAutocomplete
                    value={filterCity}
                    onChange={setFilterCity}
                    placeholder="Írj be településnevet (pl. Budapest)…"
                  />
                </div>

                {/* Távolság – Slider */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Gauge className={`h-4 w-4 ${filterMaxDistance !== null ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${filterMaxDistance !== null ? 'text-[#2D7A4F]' : 'text-gray-700'}`}>
                      Távolság
                    </span>
                    {filterMaxDistance !== null && (
                      <span className="px-2 py-0.5 bg-[#2D7A4F] text-white text-[10px] font-bold rounded-full">
                        Aktív
                      </span>
                    )}
                  </div>
                  <DistanceSlider
                    value={filterMaxDistance}
                    onChange={setFilterMaxDistance}
                    max={250}
                    step={1}
                  />
                </div>

                {/* Kategória-specifikus szűrők (DB: category_filter_groups) */}
                {(() => {
                  const allowedGroups = categoryBySlug ? (categoryFilterGroupsMap[categoryBySlug.id] ?? []) : []
                  
                  // Szűrők csoportosítása
                  const groupedFilters = filters.reduce<Record<string, AppFilter[]>>((acc, f) => {
                    const key = f.group_slug || 'egyeb'
                    if (!acc[key]) acc[key] = []
                    acc[key].push(f)
                    return acc
                  }, {})

                  return Object.entries(groupedFilters)
                    .filter(([groupSlug]) => allowedGroups.includes(groupSlug))
                    .map(([groupSlug, items]) => {
                      const groupName = items[0]?.group_name || groupSlug
                      const currentValues = activeFilters[groupSlug] || []
                      const hasValue = currentValues.length > 0

                      // Ikonok a szűrő típusokhoz
                      const getIcon = () => {
                        if (groupSlug === 'tipus') return Home
                        if (groupSlug === 'kenyelmi-funkciok') return Star
                        if (groupSlug === 'szolgaltatasok') return CheckCircle
                        if (groupSlug === 'kinek' || groupSlug === 'kinek-ajanlott') return Users
                        if (groupSlug === 'konyha-tipusa') return Utensils
                        if (groupSlug === 'etkezesi-igenyek') return CheckCircle
                        if (groupSlug === 'ellatas') return Utensils
                        if (groupSlug === 'hangulat') return Calendar
                        if (groupSlug === 'program-tipusa') return Landmark
                        if (groupSlug === 'megkozelithetoseg') return Route
                        if (groupSlug === 'evszak') return Calendar
                        if (groupSlug === 'idoszak') return Clock
                        if (groupSlug === 'kivel-mesz') return Users
                        if (groupSlug === 'ter') return MapPin
                        if (groupSlug === 'paroknak') return Heart
                        if (groupSlug === 'esos-napra') return CloudRain
                        if (groupSlug === 'hetvegere') return Calendar
                        // Gyerekeknek kategória szűrők
                        if (groupSlug === 'korosztaly') return Baby
                        return Sliders
                      }
                      const Icon = getIcon()

                      return (
                        <div key={groupSlug} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${hasValue ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
                            <span className={`text-sm font-bold ${hasValue ? 'text-[#2D7A4F]' : 'text-gray-700'}`}>
                              {groupName}
                            </span>
                            {hasValue && (
                              <span className="px-2 py-0.5 bg-[#2D7A4F] text-white text-[10px] font-bold rounded-full">
                                Aktív
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {items
                              .sort((a, b) => a.order - b.order)
                              .map((filter) => {
                                const isSelected = currentValues.includes(filter.slug)
                                // Ikonok az egyes szűrő opciókhoz (ha szükséges)
                                const getOptionIcon = () => {
                                  // Itt lehetne specifikus ikonokat adni az opciókhoz
                                  return null
                                }
                                const OptionIcon = getOptionIcon()
                                
                                return (
                                  <FilterChip
                                    key={filter.id}
                                    label={filter.name}
                                    icon={OptionIcon || undefined}
                                    isSelected={isSelected}
                                    onClick={() => {
                                      setActiveFilters((prev) => {
                                        const current = prev[groupSlug] || []
                                        const newValues = isSelected
                                          ? current.filter((v) => v !== filter.slug)
                                          : [...current, filter.slug]
                                        return {
                                          ...prev,
                                          [groupSlug]: newValues,
                                        }
                                      })
                                    }}
                                  />
                                )
                              })}
                          </div>
                        </div>
                      )
                    })
                })()}

                {/* Esemény dátuma (csak programokhoz) */}
                {slug === 'programok' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-4 w-4 ${(filterEventDateFrom || filterEventDateTo || filterQuickDate) ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
                      <span className={`text-sm font-bold ${(filterEventDateFrom || filterEventDateTo || filterQuickDate) ? 'text-[#2D7A4F]' : 'text-gray-700'}`}>
                        Mikor?
                      </span>
                      {(filterEventDateFrom || filterEventDateTo || filterQuickDate) && (
                        <span className="px-2 py-0.5 bg-[#2D7A4F] text-white text-[10px] font-bold rounded-full">
                          Aktív
                        </span>
                      )}
                    </div>
                    <div className="space-y-4">
                      {/* Előre definiált dátum opciók */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'today', label: 'Ma', icon: Calendar },
                          { value: 'tomorrow', label: 'Holnap', icon: Calendar },
                          { value: 'weekend', label: 'Hétvégén', icon: Calendar },
                          { value: 'thisweek', label: 'Ezen a héten', icon: Calendar },
                        ].map((option) => {
                          const OptionIcon = option.icon
                          return (
                            <FilterChip
                              key={option.value}
                              label={option.label}
                              icon={OptionIcon}
                              isSelected={filterQuickDate === option.value}
                              onClick={() => {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                
                                if (filterQuickDate === option.value) {
                                  setFilterQuickDate('')
                                  setFilterEventDateFrom('')
                                  setFilterEventDateTo('')
                                } else {
                                  setFilterQuickDate(option.value)
                                  
                                  if (option.value === 'today') {
                                    const dateStr = today.toISOString().split('T')[0]
                                    setFilterEventDateFrom(dateStr)
                                    setFilterEventDateTo(dateStr)
                                  } else if (option.value === 'tomorrow') {
                                    const tomorrow = new Date(today)
                                    tomorrow.setDate(tomorrow.getDate() + 1)
                                    const dateStr = tomorrow.toISOString().split('T')[0]
                                    setFilterEventDateFrom(dateStr)
                                    setFilterEventDateTo(dateStr)
                                  } else if (option.value === 'weekend') {
                                    const saturday = new Date(today)
                                    const dayOfWeek = saturday.getDay()
                                    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7
                                    saturday.setDate(saturday.getDate() + daysUntilSaturday)
                                    const sunday = new Date(saturday)
                                    sunday.setDate(sunday.getDate() + 1)
                                    setFilterEventDateFrom(saturday.toISOString().split('T')[0])
                                    setFilterEventDateTo(sunday.toISOString().split('T')[0])
                                  } else if (option.value === 'thisweek') {
                                    const monday = new Date(today)
                                    const dayOfWeek = monday.getDay()
                                    const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
                                    monday.setDate(diff)
                                    const sunday = new Date(monday)
                                    sunday.setDate(sunday.getDate() + 6)
                                    setFilterEventDateFrom(monday.toISOString().split('T')[0])
                                    setFilterEventDateTo(sunday.toISOString().split('T')[0])
                                  }
                                }
                              }}
                            />
                          )
                        })}
                      </div>
                      
                      {/* Dátum választó - Tól-Ig */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5">Tól</label>
                          <input
                            type="date"
                            value={filterEventDateFrom}
                            onChange={(e) => {
                              setFilterEventDateFrom(e.target.value)
                              setFilterQuickDate('')
                            }}
                            max={filterEventDateTo || undefined}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none transition-all text-sm font-medium appearance-none cursor-pointer hover:shadow-md focus:border-[#2D7A4F] focus:ring-[#2D7A4F]/10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5">Ig</label>
                          <input
                            type="date"
                            value={filterEventDateTo}
                            onChange={(e) => {
                              setFilterEventDateTo(e.target.value)
                              setFilterQuickDate('')
                            }}
                            min={filterEventDateFrom || undefined}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none transition-all text-sm font-medium appearance-none cursor-pointer hover:shadow-md focus:border-[#2D7A4F] focus:ring-[#2D7A4F]/10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Árkategória */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className={`h-4 w-4 ${filterPriceLevel ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${filterPriceLevel ? 'text-[#2D7A4F]' : 'text-gray-700'}`}>
                      Árkategória
                    </span>
                    {filterPriceLevel && (
                      <span className="px-2 py-0.5 bg-[#2D7A4F] text-white text-[10px] font-bold rounded-full">
                        Aktív
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: '1', label: '$' },
                      { value: '2', label: '$$' },
                      { value: '3', label: '$$$' },
                      { value: '4', label: '$$$$' },
                    ].map((option) => (
                      <FilterChip
                        key={option.value}
                        label={option.label}
                        isSelected={filterPriceLevel === option.value}
                        onClick={() => setFilterPriceLevel(filterPriceLevel === option.value ? '' : option.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Rendezés */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sliders className={`h-4 w-4 ${filterSortBy !== 'distance' ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${filterSortBy !== 'distance' ? 'text-[#2D7A4F]' : 'text-gray-700'}`}>
                      Rendezés
                    </span>
                    {filterSortBy !== 'distance' && (
                      <span className="px-2 py-0.5 bg-[#2D7A4F] text-white text-[10px] font-bold rounded-full">
                        Aktív
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={filterSortBy}
                      onChange={(e) => setFilterSortBy(e.target.value as 'distance' | 'rating' | 'name')}
                      className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-4 focus:ring-[#2D7A4F]/10 transition-all text-sm font-medium text-gray-900 appearance-none cursor-pointer hover:border-gray-300 hover:shadow-md"
                    >
                      <option value="distance">Távolság</option>
                      <option value="rating">Értékelés</option>
                      <option value="name">Név</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

              {/* Footer – Mentés gomb */}
              <div className="px-6 py-5 border-t border-gray-200 flex-shrink-0 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-900">{filteredPlaces.length}</span> találat
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setIsFilterOpen(false)}
                    className="px-8"
                  >
                    Szűrők alkalmazása
                  </Button>
                </div>
              </div>
            </div>
          </div>
      )}

      {/* Places Grid – mobilnézetben kisebb kártyák */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredPlaces.map((place) => (
            <Link key={place.id} href={`/hely/${place.slug || place.id}`} >
              <Card hover className="h-full group relative">
                {/* Favorite Button – csak bejelentkezés után adható kedvencnek */}
                <button
                  onClick={(e) => toggleFavorite(e, place.id)}
                  className="absolute top-2 right-2 md:top-4 md:right-4 z-10 p-2 md:p-2.5 bg-white/90 backdrop-blur-sm rounded-lg md:rounded-xl shadow-sm hover:bg-white hover:scale-110 transition-all duration-200"
                  title={isLoggedIn ? (favorites.includes(place.id) ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez') : 'Bejelentkezés szükséges a kedvencekhez adáshoz'}
                >
                  <Heart 
                    className={`h-4 w-4 md:h-5 md:w-5 transition-colors ${
                      favorites.includes(place.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`} 
                  />
                </button>

                {/* Image – mobilnézetben alacsonyabb */}
                <div className="relative h-40 md:h-52 overflow-hidden bg-gray-200">
                  <Image
                    src={place.imageUrl}
                    alt={place.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Badges */}
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 flex gap-1.5 md:gap-2">
                    <span className={`badge text-xs md:text-sm ${place.isOpen ? 'badge-success' : 'badge-danger'}`}>
                      {place.isOpen ? 'Nyitva' : 'Zárva'}
                    </span>
                    {place.isPremium && (
                      <span className="badge badge-premium text-xs md:text-sm">Prémium</span>
                    )}
                  </div>
                </div>

                <CardContent className="p-3 md:p-5">
                  <div className="flex items-center justify-between gap-2 mb-1.5 md:mb-2">
                    <div className="flex items-center gap-1 md:gap-1.5 min-w-0">
                      {Array.from({ length: 5 }, (_, i) => {
                        const starNum = i + 1
                        const isFilled = starNum <= Math.round(place.rating)
                        return (
                          <Star
                            key={starNum}
                            className={`h-4 w-4 md:h-5 md:w-5 flex-shrink-0 ${
                              isFilled
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        )
                      })}
                      <span className="font-bold text-sm md:text-base">{place.rating}</span>
                      <span className="text-gray-400 text-xs md:text-sm">({place.ratingCount})</span>
                    </div>
                    <span className="text-xs md:text-sm text-gray-500 font-medium shrink-0">{place.distanceFromCenter.toFixed(1)} km · {formatTravelTime((place as any).travelTimeMinutes ?? estimateTravelTimeMinutes(place.distanceFromCenter))}</span>
                  </div>

                  <CardTitle className="text-lg md:text-xl mb-1.5 md:mb-2 group-hover:text-[#2D7A4F] transition-colors line-clamp-1">
                    {place.name}
                  </CardTitle>
                  <p className="text-gray-500 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2">{place.description}</p>
                  
                  <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
                    <span className="text-xs md:text-sm text-gray-500 truncate mr-2">{place.address}</span>
                    <span className="text-xs md:text-sm text-gray-400 font-medium shrink-0">
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
