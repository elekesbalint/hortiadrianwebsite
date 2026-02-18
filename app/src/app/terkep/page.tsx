'use client'

import { useState, useMemo, Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { MapView, type SearchCircle } from '@/components/map/MapView'
import { MapPin, List, Filter, Navigation, Star, ChevronDown, Sliders, RotateCcw, X, CircleDot, Calendar, Clock, Users, Route, Tag, Gauge, CheckCircle, Home, Utensils, Landmark, Search, Heart, CloudRain } from 'lucide-react'
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/SearchableSelect'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { DistanceSlider } from '@/components/ui/DistanceSlider'
import { Accordion } from '@/components/ui/Accordion'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getPlaces } from '@/lib/db/places'
import { getCategories } from '@/lib/db/categories'
import { getFilters, type AppFilter } from '@/lib/db/filters'
import { calculateDistance, estimateTravelTimeMinutes, formatTravelTime, getRouteDistanceAndTime } from '@/lib/utils'

const BUDAPEST = { lat: 47.4979, lng: 19.0402 }

function MapPageContent() {
  const searchParams = useSearchParams()
  const kategoriaSlug = searchParams.get('kategoria')
  const [placesAll, setPlacesAll] = useState<Awaited<ReturnType<typeof getPlaces>>>([])
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([])
  const [filters, setFilters] = useState<AppFilter[]>([])
  const [loading, setLoading] = useState(true)
  
  // Szűrő értékek
  const [filterHol, setFilterHol] = useState('')
  const [filterMaxDistance, setFilterMaxDistance] = useState<number | null>(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterOpenOnly, setFilterOpenOnly] = useState(false)
  const [filterSortBy, setFilterSortBy] = useState<'distance' | 'rating' | 'name'>('distance')
  // Dinamikus szűrők (kategória-specifikus)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const horizontalScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([getPlaces(), getCategories(), getFilters()]).then(([pls, cats, filts]) => {
      setPlacesAll(pls)
      setCategories(cats)
      setFilters(filts)
      setLoading(false)
    })
  }, [])

  const categoryBySlug = useMemo(() => categories.find((c) => c.slug === (kategoriaSlug || '')), [categories, kategoriaSlug])
  const categoryLabel = categoryBySlug?.name ?? (kategoriaSlug ?? '')

  // Szűrők alapján szűrt helyek
  const places = useMemo(() => {
    let filtered = placesAll
    
    // Keresés: helynév, kategória vagy cím alapján
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((p) => {
        // Helynév keresés
        if (p.name.toLowerCase().includes(query)) return true
        
        // Kategória keresés (pl. "étterem", "szállás")
        const category = categories.find((c) => c.id === p.category_id)
        if (category && (category.name.toLowerCase().includes(query) || category.slug.toLowerCase().includes(query))) {
          return true
        }
        
        // Cím keresés
        if (p.address.toLowerCase().includes(query)) return true
        
        // Leírás keresés
        if (p.description && p.description.toLowerCase().includes(query)) return true
        
        return false
      })
    }
    
    // Kategória szűrés (URL param vagy szűrő)
    const selectedCategorySlug = kategoriaSlug || filterCategory
    if (selectedCategorySlug) {
      const cat = categories.find((c) => c.slug === selectedCategorySlug)
      if (cat) {
        filtered = filtered.filter((p) => p.category_id === cat.id)
      }
    }
    
    // "Hol?" szűrés: cím tartalmazza a kiválasztott településnevet (Google Places alapján)
    if (filterHol && filterHol.trim()) {
      const cityQuery = filterHol.trim().toLowerCase()
      filtered = filtered.filter((p) => p.address.toLowerCase().includes(cityQuery))
    }
    
    // Távolság szűrés
    if (filterMaxDistance !== null && filterMaxDistance > 0 && userLocation) {
      filtered = filtered.filter((p) => {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
        return distance <= filterMaxDistance
      })
    }
    
    // Nyitva most szűrés
    if (filterOpenOnly) {
      filtered = filtered.filter((p) => p.isOpen)
    }
    
    // Dinamikus szűrők (kategória-specifikus)
    const activeFilterSlugs = Object.values(activeFilters).filter(Boolean)
    
    if (activeFilterSlugs.length > 0) {
      // Szűrő slug-okból filter ID-kat keresünk
      const filterIds = filters
        .filter((f) => activeFilterSlugs.includes(f.slug))
        .map((f) => f.id)
      
      if (filterIds.length > 0) {
        // Csak azokat a helyeket tartjuk meg, amelyek rendelkeznek legalább egy kiválasztott szűrővel
        filtered = filtered.filter((p) => {
          const placeFilterIds = p.filterIds ?? []
          return filterIds.some((fid) => placeFilterIds.includes(fid))
        })
      }
    }
    
    return filtered
  }, [placesAll, searchQuery, kategoriaSlug, filterCategory, categories, filters, filterHol, filterMaxDistance, filterOpenOnly, activeFilters, userLocation])
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [circleCenterMode, setCircleCenterMode] = useState(false)
  const [circleRadiusKm, setCircleRadiusKm] = useState(10)
  const [circleCenter, setCircleCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [isCirclePanelOpen, setIsCirclePanelOpen] = useState(false)

  const centerForDistance = userLocation ?? BUDAPEST
  const activeSearchCircle: SearchCircle | null = useMemo(
    () =>
      circleCenter
        ? { center: circleCenter, radiusKm: circleRadiusKm }
        : null,
    [circleCenter, circleRadiusKm]
  )

  const placesInCircle = useMemo(() => {
    if (!activeSearchCircle) return places
    return places.filter(
      (p) =>
        calculateDistance(activeSearchCircle.center.lat, activeSearchCircle.center.lng, p.lat, p.lng) <=
        activeSearchCircle.radiusKm
    )
  }, [places, activeSearchCircle])

  // Először légvonalban számolunk (gyors)
  const placesWithDistanceInitial = useMemo(() => {
    return [...placesInCircle]
      .map((p) => ({
        ...p,
        distanceFromCenter: calculateDistance(centerForDistance.lat, centerForDistance.lng, p.lat, p.lng),
        travelTimeMinutes: estimateTravelTimeMinutes(calculateDistance(centerForDistance.lat, centerForDistance.lng, p.lat, p.lng)),
      }))
      .sort((a, b) => {
        if (filterSortBy === 'distance') return a.distanceFromCenter - b.distanceFromCenter
        if (filterSortBy === 'rating') return b.rating - a.rating
        return a.name.localeCompare(b.name)
      })
  }, [placesInCircle, centerForDistance, filterSortBy])

  // Google Maps API-val pontosítjuk az első 10 hely távolságát és idejét (ha elérhető)
  const [placesWithDistance, setPlacesWithDistance] = useState(placesWithDistanceInitial)
  
  useEffect(() => {
    setPlacesWithDistance(placesWithDistanceInitial)
    
    // Csak akkor használjuk az API-t, ha a Google Maps elérhető és van userLocation
    if (typeof window === 'undefined' || !window.google?.maps?.DirectionsService || !userLocation) return
    
    // Csak az első 10 helyre használjuk az API-t (hogy ne legyen túl sok hívás)
    const topPlaces = placesWithDistanceInitial.slice(0, 10)
    
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
      const restPlaces = placesWithDistanceInitial.slice(10)
      setPlacesWithDistance([...updatedPlaces, ...restPlaces])
    })
  }, [placesWithDistanceInitial, userLocation, centerForDistance])

  const handleMapClick = (lat: number, lng: number) => {
    if (circleCenterMode) {
      setCircleCenter({ lat, lng })
      setCircleCenterMode(false)
    }
  }

  const handleMyLocation = () => {
    setLocationMessage(null)
    if (typeof window === 'undefined' || !window.navigator?.geolocation) {
      setLocationMessage('A böngésződ nem támogatja a helymeghatározást.')
      setTimeout(() => setLocationMessage(null), 4000)
      return
    }
    setLocationLoading(true)
    window.navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationLoading(false)
      },
      (err) => {
        setLocationLoading(false)
        const msg =
          err.code === 1
            ? 'Helymeghatározás elutasítva. Engedélyezd a helyadatokhoz való hozzáférést a böngészőben.'
            : err.code === 2
              ? 'Helymeghatározás nem elérhető.'
              : 'Helymeghatározás időtúllépés.'
        setLocationMessage(msg)
        setTimeout(() => setLocationMessage(null), 5000)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50">
        <LoadingSpinner variant="centered" className="bg-gray-50 min-h-[calc(100vh-80px)]" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 w-full min-w-0 overflow-x-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 shadow-sm flex-shrink-0 w-full min-w-0">
        <div className="w-full max-w-7xl mx-auto">
          {/* Mobile: Kereső mező fent, gombok alatta görgethető sorban */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 max-w-xl min-w-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Keresés a térképen... (pl. Mirage étterem, étterem)"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Keresés törlése"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Gombok görgethető sorban mobil nézetben */}
            <div 
              ref={horizontalScrollRef}
              className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 flex-shrink-0"
              style={{ touchAction: 'pan-x pinch-zoom' }}
              onTouchStart={(e) => {
                const touch = e.touches[0]
                if (!touch) return
                const startX = touch.clientX
                const startY = touch.clientY
                let isScrolling = false
                
                const handleTouchMove = (moveEvent: TouchEvent) => {
                  if (!moveEvent.touches[0]) return
                  const moveTouch = moveEvent.touches[0]
                  const deltaX = Math.abs(moveTouch.clientX - startX)
                  const deltaY = Math.abs(moveTouch.clientY - startY)
                  
                  // Ha horizontális scroll történik, akadályozzuk meg a vertikális scroll propagációt
                  if (!isScrolling && deltaX > 10 && deltaX > deltaY) {
                    isScrolling = true
                  }
                  
                  if (isScrolling && deltaX > deltaY) {
                    moveEvent.stopPropagation()
                  }
                }
                
                const handleTouchEnd = () => {
                  document.removeEventListener('touchmove', handleTouchMove)
                  document.removeEventListener('touchend', handleTouchEnd)
                }
                
                document.addEventListener('touchmove', handleTouchMove, { passive: false })
                document.addEventListener('touchend', handleTouchEnd)
              }}
              onWheel={(e) => {
                // Desktop: csak vízszintesen görgetünk
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                  e.stopPropagation()
                }
              }}
            >
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1 flex-shrink-0">
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    viewMode === 'map'
                      ? 'bg-white text-[#2D7A4F] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Térkép
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-[#2D7A4F] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                  Lista
                </button>
              </div>

              {/* Aktív kategória (pl. Éttermekből jött) – X-re mind látszik */}
              {categoryLabel && (
                <Link href="/terkep" className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#1B5E20] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#C8E6C9] transition-colors flex-shrink-0 whitespace-nowrap">
                  <span>{categoryLabel}</span>
                  <X className="h-4 w-4" />
                </Link>
              )}

              {/* Keresés zóna (kör) */}
              <Button
                variant={isCirclePanelOpen || activeSearchCircle ? 'primary' : 'outline'}
                onClick={() => {
                  setIsCirclePanelOpen((o) => !o)
                  if (!isCirclePanelOpen) setCircleCenterMode(false)
                }}
                className="flex-shrink-0 whitespace-nowrap"
              >
                <CircleDot className="h-4 w-4" />
                Keresés zóna
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCirclePanelOpen ? 'rotate-180' : ''}`} />
              </Button>

              {/* Filter Button */}
              <Button 
                variant={isFilterOpen ? 'primary' : 'outline'} 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex-shrink-0 whitespace-nowrap"
              >
                <Sliders className="h-4 w-4" />
                Szűrők
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </Button>
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
                      onClick={() => {
                        setSearchQuery('')
                        setFilterHol('')
                        setFilterMaxDistance(null)
                        setFilterCategory('')
                        setFilterOpenOnly(false)
                        setFilterSortBy('distance')
                        setActiveFilters({})
                      }}
                      disabled={!searchQuery && !filterHol && filterMaxDistance === null && !filterCategory && !filterOpenOnly && filterSortBy === 'distance' && Object.keys(activeFilters).length === 0}
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
                <div className="space-y-3">
                  {/* Hol? – Google Places Autocomplete */}
                  <Accordion
                    title="Hol?"
                    icon={MapPin}
                    hasActiveFilter={!!filterHol}
                    defaultOpen={!!filterHol}
                  >
                    <CityAutocomplete
                      value={filterHol}
                      onChange={setFilterHol}
                      placeholder="Írj be településnevet (pl. Budapest)…"
                    />
                  </Accordion>

                  {/* Távolság – Slider */}
                  <Accordion
                    title="Távolság"
                    icon={Gauge}
                    hasActiveFilter={filterMaxDistance !== null}
                    defaultOpen={filterMaxDistance !== null}
                  >
                    <DistanceSlider
                      value={filterMaxDistance}
                      onChange={setFilterMaxDistance}
                      max={50}
                      step={1}
                    />
                  </Accordion>

                  {/* Kategória */}
                  <Accordion
                    title="Kategória"
                    icon={Tag}
                    hasActiveFilter={!!filterCategory}
                    defaultOpen={!!filterCategory}
                  >
                    <div className="relative">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className={`w-full px-4 py-3 pr-10 bg-white border-2 rounded-xl outline-none focus:ring-4 transition-all text-sm font-medium appearance-none cursor-pointer hover:shadow-md ${
                          filterCategory 
                            ? 'border-[#2D7A4F] text-[#1B5E20] focus:border-[#2D7A4F] focus:ring-[#2D7A4F]/10' 
                            : 'border-gray-200 text-gray-900 focus:border-[#2D7A4F] focus:ring-[#2D7A4F]/10'
                        }`}
                      >
                        <option value="">Mind</option>
                        <option value="ettermek">Éttermek</option>
                        <option value="szallasok">Szállások</option>
                        <option value="latnivalok">Látnivalók</option>
                        <option value="programok">Programok</option>
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors ${filterCategory ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
                    </div>
                  </Accordion>

                  {/* Kategória-specifikus szűrők (csak ha van kiválasztott kategória) */}
                  {(() => {
                    const selectedCategorySlug = filterCategory || kategoriaSlug || ''
                    const categoryFilterGroups: Record<string, string[]> = {
                      szallasok: ['tipus', 'kenyelmi-funkciok', 'kinek'],
                      ettermek: ['konyha-tipusa', 'etkezesi-igenyek'],
                      programok: ['hangulat'],
                      latnivalok: ['program-tipusa', 'kinek-ajanlott', 'megkozelithetoseg'],
                      paroknak: ['paroknak'],
                      'esos-napra': ['esos-napra'],
                      esos_napra: ['esos-napra'],
                      esosnapra: ['esos-napra'],
                      'esos napra': ['esos-napra'],
                      hetvegere: ['hetvegere'],
                    }

                    const allowedGroups = categoryFilterGroups[selectedCategorySlug] || []
                    
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
                        const currentValue = activeFilters[groupSlug] || ''
                        const hasValue = !!currentValue

                        // Ikonok a szűrő típusokhoz
                        const getIcon = () => {
                          if (groupSlug === 'tipus') return Home
                          if (groupSlug === 'kenyelmi-funkciok') return Star
                          if (groupSlug === 'kinek' || groupSlug === 'kinek-ajanlott') return Users
                          if (groupSlug === 'konyha-tipusa') return Utensils
                          if (groupSlug === 'etkezesi-igenyek') return CheckCircle
                          if (groupSlug === 'hangulat') return Calendar
                          if (groupSlug === 'program-tipusa') return Landmark
                          if (groupSlug === 'megkozelithetoseg') return Route
                          if (groupSlug === 'paroknak') return Heart
                          if (groupSlug === 'esos-napra') return CloudRain
                          if (groupSlug === 'hetvegere') return Calendar
                          return Filter
                        }
                        const Icon = getIcon()

                        return (
                          <Accordion
                            key={groupSlug}
                            title={groupName}
                            icon={Icon}
                            hasActiveFilter={hasValue}
                            defaultOpen={hasValue}
                          >
                            <SearchableSelect
                              options={[
                                { value: '', label: 'Mind' },
                                ...items
                                  .sort((a, b) => a.order - b.order)
                                  .map((filter) => ({
                                    value: filter.slug,
                                    label: filter.name,
                                  })),
                              ]}
                              value={currentValue}
                              onChange={(val) => {
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  [groupSlug]: val,
                                }))
                              }}
                              placeholder="Mind"
                              searchPlaceholder={`Keresés ${groupName.toLowerCase()}...`}
                              hasValue={hasValue}
                            />
                          </Accordion>
                        )
                      })
                  })()}

                  {/* Státusz */}
                  <Accordion
                    title="Státusz"
                    icon={CheckCircle}
                    hasActiveFilter={filterOpenOnly}
                    defaultOpen={filterOpenOnly}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterOpenOnly}
                        onChange={(e) => setFilterOpenOnly(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-[#2D7A4F] focus:ring-[#2D7A4F] cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">Nyitva most</span>
                    </label>
                  </Accordion>

                  {/* Rendezés */}
                  <Accordion
                    title="Rendezés"
                    icon={Sliders}
                    hasActiveFilter={filterSortBy !== 'distance'}
                    defaultOpen={false}
                  >
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
                  </Accordion>
                </div>
              </div>

              {/* Footer – Mentés gomb */}
              <div className="px-6 py-5 border-t border-gray-200 flex-shrink-0 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-900">{placesInCircle.length}</span> találat
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

        {/* Keresés zóna panel – kör kijelölése */}
        {isCirclePanelOpen && (
          <div className="max-w-7xl mx-auto mt-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-[#2D7A4F]" />
              Keresés zóna (körön belül)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Középpont</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCircleCenterMode(true)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      circleCenterMode ? 'bg-[#2D7A4F] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#2D7A4F]'
                    }`}
                  >
                    Kattints a térképre
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCircleCenterMode(false)
                      setCircleCenter(BUDAPEST)
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:border-[#2D7A4F] transition-all"
                  >
                    Budapest
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!userLocation) {
                        handleMyLocation()
                        return
                      }
                      setCircleCenterMode(false)
                      setCircleCenter(userLocation)
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:border-[#2D7A4F] transition-all"
                  >
                    Saját helyzet
                  </button>
                </div>
                {circleCenterMode && (
                  <p className="text-xs text-[#2D7A4F] mt-2 font-medium">Kattints a térképre a kör középpontjának kijelöléséhez.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sugár: {circleRadiusKm} km</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={circleRadiusKm}
                  onChange={(e) => setCircleRadiusKm(Number(e.target.value))}
                  className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2D7A4F]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCircleCenter(null)
                    setCircleCenterMode(false)
                    setIsCirclePanelOpen(false)
                  }}
                >
                  <X className="h-4 w-4" />
                  Zóna törlése
                </Button>
              </div>
            </div>
            {activeSearchCircle && (
              <p className="text-sm text-gray-600 mt-3">
                <span className="font-semibold text-[#1B5E20]">{placesInCircle.length}</span> hely a körön belül
                {categoryLabel && ` (${categoryLabel})`}.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden min-h-0 min-w-0 w-full">
        {viewMode === 'map' ? (
          <>
            {/* Map Container */}
            <div className="flex-1 min-h-[400px] min-w-0 w-full relative">
              <MapView
                places={placesWithDistance.map((p) => ({
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  lat: p.lat,
                  lng: p.lng,
                  category: p.category,
                  rating: p.rating,
                  ratingCount: p.ratingCount,
                  distance: p.distanceFromCenter,
                  address: p.address,
                  imageUrl: p.imageUrl,
                  isOpen: p.isOpen,
                  isPremium: p.isPremium,
                  menuUrl: p.menuUrl || null,
                  mapSecondaryButton: p.mapSecondaryButton ?? null,
                  bookingUrl: p.bookingUrl ?? null,
                }))}
                userLocation={userLocation}
                searchCircle={activeSearchCircle}
                onMapClick={circleCenterMode ? handleMapClick : undefined}
              />
            </div>

            {/* Saját helyzet – engedély kérés, majd térkép középre */}
            <button
              type="button"
              onClick={handleMyLocation}
              disabled={locationLoading}
              className="absolute bottom-4 right-4 bg-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group disabled:opacity-70"
              title="Saját helyzet – engedélyezd a helyadatokhoz való hozzáférést"
              aria-label="Saját helyzet"
            >
              {locationLoading ? (
                <span className="block h-6 w-6 animate-spin rounded-full border-2 border-[#2D7A4F] border-t-transparent" />
              ) : (
                <Navigation className="h-6 w-6 text-[#2D7A4F] group-hover:scale-110 transition-transform" />
              )}
            </button>
            {locationMessage && (
              <div className="absolute bottom-20 right-4 left-4 sm:left-auto sm:max-w-sm bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
                {locationMessage}
              </div>
            )}
          </>
        ) : (
          /* List View */
          <div className="flex-1 overflow-auto p-2 sm:p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-500 font-medium">
                  <span className="text-gray-900 font-bold">{placesWithDistance.length}</span>
                  {activeSearchCircle ? ' találat a körön belül' : ' találat'}
                  {categoryLabel && <span className="text-gray-500 font-normal"> ({categoryLabel})</span>}
                  {userLocation ? <span className="text-gray-500 text-sm ml-2">· távolság a helyzetedtől</span> : <span className="text-gray-500 text-sm ml-2">· távolság Budapesttől</span>}
                </p>
              </div>
              {placesWithDistance.map((place) => (
                <Link key={place.id} href={`/hely/${place.slug || place.id}`}>
                  <Card hover className="mb-4">
                    <CardContent className="px-1.5 py-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-5">
                        <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 bg-gray-200">
                          <Image src={place.imageUrl} alt={place.name} fill className="object-cover" sizes="112px" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-500 font-medium">{place.category}</span>
                            <span className={`badge ${place.isOpen ? 'badge-success' : 'badge-danger'}`}>
                              {place.isOpen ? 'Nyitva' : 'Zárva'}
                            </span>
                            {place.isPremium && (
                              <span className="badge badge-premium">Prémium</span>
                            )}
                          </div>
                          <CardTitle className="text-lg sm:text-xl mb-1 truncate">{place.name}</CardTitle>
                          <p className="text-gray-500 text-sm sm:text-base mb-2 sm:mb-3 truncate">{place.address}</p>
                          <div className="flex items-center justify-between gap-2 min-w-0 -mx-0.5">
                            <div className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0">
                              {Array.from({ length: 5 }, (_, i) => {
                                const starNum = i + 1
                                const isFilled = starNum <= Math.round(place.rating)
                                return (
                                  <Star
                                    key={starNum}
                                    className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                                      isFilled
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                )
                              })}
                              <span className="font-bold text-sm sm:text-lg">{place.rating}</span>
                              <span className="text-gray-400 text-xs sm:text-base">({place.ratingCount})</span>
                            </div>
                            <span className="text-gray-500 font-semibold text-xs sm:text-base flex-shrink-0 whitespace-nowrap">
                              {place.distanceFromCenter < 1 ? `${Math.round(place.distanceFromCenter * 1000)} m` : `${place.distanceFromCenter.toFixed(1)} km`}
                              <span className="text-gray-400 font-normal ml-1">· {formatTravelTime((place as any).travelTimeMinutes ?? estimateTravelTimeMinutes(place.distanceFromCenter))}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50"><div className="animate-pulse text-gray-500">Térkép betöltése...</div></div>}>
      <MapPageContent />
    </Suspense>
  )
}
