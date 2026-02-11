'use client'

import { useState, useMemo, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { MapView, type SearchCircle } from '@/components/map/MapView'
import { MapPin, List, Filter, Navigation, Star, ChevronDown, Sliders, RotateCcw, X, CircleDot, Calendar, Clock, Users, Route, Tag, Gauge, Award, CheckCircle } from 'lucide-react'
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/SearchableSelect'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getPlaces } from '@/lib/db/places'
import { getCategories } from '@/lib/db/categories'
import { getFilters, type AppFilter } from '@/lib/db/filters'
import { recordStatistic } from '@/lib/db/statistics'
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
  const [filterEvszak, setFilterEvszak] = useState('')
  const [filterIdoszak, setFilterIdoszak] = useState('')
  const [filterTer, setFilterTer] = useState('')
  const [filterKivelMesz, setFilterKivelMesz] = useState('')
  const [filterMegkozelites, setFilterMegkozelites] = useState('')

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
    
    // Kategória szűrés
    if (kategoriaSlug && categoryBySlug) {
      filtered = filtered.filter((p) => p.category_id === categoryBySlug.id)
    }
    
    // "Hol?" szűrés (cím alapú)
    if (filterHol === 'budapest') {
      filtered = filtered.filter((p) => 
        p.address.toLowerCase().includes('budapest')
      )
    } else if (filterHol === 'varos') {
      // Város szűrés - ha van város a címben (nem csak "Budapest")
      filtered = filtered.filter((p) => {
        const addr = p.address.toLowerCase()
        return addr.includes('budapest') || addr.match(/\d{4}\s+\w+/)
      })
    }
    // "megye" esetén jelenleg nincs specifikus logika
    
    // Szűrők alkalmazása (Évszak, Időszak, Tér, Kivel mész?, Megközelítés)
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
        filtered = filtered.filter((p) => {
          const placeFilterIds = p.filterIds ?? []
          return filterIds.some((fid) => placeFilterIds.includes(fid))
        })
      }
    }
    
    return filtered
  }, [placesAll, kategoriaSlug, categoryBySlug, filters, filterHol, filterEvszak, filterIdoszak, filterTer, filterKivelMesz, filterMegkozelites])

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
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
      .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter)
  }, [placesInCircle, centerForDistance])

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
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Keresés a térképen..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
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
            <Link href="/terkep" className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#1B5E20] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#C8E6C9] transition-colors">
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
          >
            <CircleDot className="h-4 w-4" />
            Keresés zóna
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCirclePanelOpen ? 'rotate-180' : ''}`} />
          </Button>

          {/* Filter Button */}
          <Button 
            variant={isFilterOpen ? 'primary' : 'outline'} 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Sliders className="h-4 w-4" />
            Szűrők
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
          </Button>
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
                        setFilterHol('')
                        setFilterEvszak('')
                        setFilterIdoszak('')
                        setFilterTer('')
                        setFilterKivelMesz('')
                        setFilterMegkozelites('')
                      }}
                      className="text-gray-600 hover:text-[#2D7A4F] hover:bg-[#E8F5E9]/50 text-sm"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Hol? - különleges, cím alapú szűrés */}
                <div className="group">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                    <MapPin className="h-3.5 w-3.5 text-[#2D7A4F]" />
                    Hol?
                  </label>
                  <SearchableSelect
                    options={[
                      { value: '', label: 'Teljes ország' },
                      { value: 'megye', label: 'Megye' },
                      { value: 'varos', label: 'Város' },
                      { value: 'budapest', label: 'Budapest' },
                    ]}
                    value={filterHol}
                    onChange={setFilterHol}
                    placeholder="Teljes ország"
                    searchPlaceholder="Keresés város vagy régió..."
                    hasValue={!!filterHol}
                  />
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
                    
                    // Ikonok a szűrő típusokhoz
                    const getIcon = () => {
                      if (groupSlug === 'evszak') return Calendar
                      if (groupSlug === 'idoszak') return Clock
                      if (groupSlug === 'ter') return MapPin
                      if (groupSlug === 'kivel-mesz') return Users
                      if (groupSlug === 'megkozelites') return Route
                      return Filter
                    }
                    const Icon = getIcon()
                    const hasValue = getValue() !== ''
                    
                    return (
                      <div key={groupSlug} className="group">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                          <Icon className={`h-3.5 w-3.5 ${hasValue ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
                          {groupName}
                          {hasValue && (
                            <span className="ml-auto px-2 py-0.5 bg-[#2D7A4F] text-white text-[10px] font-bold rounded-full">
                              Aktív
                            </span>
                          )}
                        </label>
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
                          value={getValue()}
                          onChange={setValue}
                          placeholder="Mind"
                          searchPlaceholder={`Keresés ${groupName.toLowerCase()}...`}
                          hasValue={hasValue}
                        />
                      </div>
                    )
                  })}
                
                {/* Kategória */}
                <div className="group">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                    <Tag className="h-3.5 w-3.5 text-gray-400" />
                    Kategória
                  </label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-4 focus:ring-[#2D7A4F]/10 transition-all text-sm font-medium text-gray-900 appearance-none cursor-pointer hover:border-gray-300 group-hover:shadow-md">
                      <option value="">Mind</option>
                      <option value="ettermek">Éttermek</option>
                      <option value="szallasok">Szállások</option>
                      <option value="latnivalok">Látnivalók</option>
                      <option value="programok">Programok</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                {/* Távolság */}
                <div className="group">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                    <Gauge className="h-3.5 w-3.5 text-gray-400" />
                    Távolság
                  </label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-4 focus:ring-[#2D7A4F]/10 transition-all text-sm font-medium text-gray-900 appearance-none cursor-pointer hover:border-gray-300 group-hover:shadow-md">
                      <option value="">Mind</option>
                      <option value="1">1 km-en belül</option>
                      <option value="5">5 km-en belül</option>
                      <option value="10">10 km-en belül</option>
                      <option value="25">25 km-en belül</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                {/* Értékelés */}
                <div className="group">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                    <Award className="h-3.5 w-3.5 text-gray-400" />
                    Értékelés
                  </label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-4 focus:ring-[#2D7A4F]/10 transition-all text-sm font-medium text-gray-900 appearance-none cursor-pointer hover:border-gray-300 group-hover:shadow-md">
                      <option value="">Mind</option>
                      <option value="4">4+ csillag</option>
                      <option value="4.5">4.5+ csillag</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                {/* Státusz */}
                <div className="group">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                    <CheckCircle className="h-3.5 w-3.5 text-gray-400" />
                    Státusz
                  </label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-4 focus:ring-[#2D7A4F]/10 transition-all text-sm font-medium text-gray-900 appearance-none cursor-pointer hover:border-gray-300 group-hover:shadow-md">
                      <option value="">Mind</option>
                      <option value="open">Nyitva most</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                {/* Rendezés */}
                <div className="group">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                    <Sliders className="h-3.5 w-3.5 text-gray-400" />
                    Rendezés
                  </label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-4 focus:ring-[#2D7A4F]/10 transition-all text-sm font-medium text-gray-900 appearance-none cursor-pointer hover:border-gray-300 group-hover:shadow-md">
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
      <div className="flex-1 flex relative overflow-hidden">
        {viewMode === 'map' ? (
          <>
            {/* Map Container */}
            <div className="flex-1 min-h-[400px] relative">
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
          <div className="flex-1 overflow-auto p-6">
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
                <Link key={place.id} href={`/hely/${place.slug || place.id}`} onClick={() => recordStatistic('place_click', place.id)}>
                  <Card hover className="mb-4">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-5">
                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-200">
                          <Image src={place.imageUrl} alt={place.name} fill className="object-cover" sizes="112px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-500 font-medium">{place.category}</span>
                            <span className={`badge ${place.isOpen ? 'badge-success' : 'badge-danger'}`}>
                              {place.isOpen ? 'Nyitva' : 'Zárva'}
                            </span>
                            {place.isPremium && (
                              <span className="badge badge-premium">Prémium</span>
                            )}
                          </div>
                          <CardTitle className="text-xl mb-1">{place.name}</CardTitle>
                          <p className="text-gray-500 mb-3">{place.address}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
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
                              <span className="font-bold text-lg">{place.rating}</span>
                              <span className="text-gray-400">({place.ratingCount})</span>
                            </div>
                            <span className="text-gray-500 font-semibold">
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
