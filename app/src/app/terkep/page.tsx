'use client'

import { useState, useMemo, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { MapView, type SearchCircle } from '@/components/map/MapView'
import { MapPin, List, Filter, Navigation, Star, ChevronDown, Sliders, RotateCcw, X, CircleDot } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getPlaces } from '@/lib/db/places'
import { getCategories } from '@/lib/db/categories'
import { getFilters, type AppFilter } from '@/lib/db/filters'
import { recordStatistic } from '@/lib/db/statistics'
import { calculateDistance, estimateTravelTimeMinutes, formatTravelTime } from '@/lib/utils'

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
  const activeSearchCircle: SearchCircle | null = circleCenter
    ? { center: circleCenter, radiusKm: circleRadiusKm }
    : null

  const placesInCircle = useMemo(() => {
    if (!activeSearchCircle) return places
    return places.filter(
      (p) =>
        calculateDistance(activeSearchCircle.center.lat, activeSearchCircle.center.lng, p.lat, p.lng) <=
        activeSearchCircle.radiusKm
    )
  }, [places, activeSearchCircle])

  const placesWithDistance = useMemo(() => {
    return [...placesInCircle]
      .map((p) => ({
        ...p,
        distanceFromCenter: calculateDistance(centerForDistance.lat, centerForDistance.lng, p.lat, p.lng),
      }))
      .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter)
  }, [placesInCircle, centerForDistance])

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

        {/* Szűrőpanel – dinamikusan generált szűrők az adatbázisból */}
        {isFilterOpen && (
          <div className="max-w-7xl mx-auto mt-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Hol? - különleges, cím alapú szűrés (jelenleg statikus, később implementálható) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hol?</label>
                <select 
                  value={filterHol}
                  onChange={(e) => setFilterHol(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                >
                  <option value="">Teljes ország</option>
                  <option value="megye">Megye</option>
                  <option value="varos">Város</option>
                  <option value="budapest">Budapest</option>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategória</label>
                <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all">
                  <option value="">Mind</option>
                  <option value="ettermek">Éttermek</option>
                  <option value="szallasok">Szállások</option>
                  <option value="latnivalok">Látnivalók</option>
                  <option value="programok">Programok</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Távolság</label>
                <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all">
                  <option value="">Mind</option>
                  <option value="1">1 km-en belül</option>
                  <option value="5">5 km-en belül</option>
                  <option value="10">10 km-en belül</option>
                  <option value="25">25 km-en belül</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Értékelés</label>
                <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all">
                  <option value="">Mind</option>
                  <option value="4">4+ csillag</option>
                  <option value="4.5">4.5+ csillag</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Státusz</label>
                <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all">
                  <option value="">Mind</option>
                  <option value="open">Nyitva most</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rendezés</label>
                <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all">
                  <option value="distance">Távolság</option>
                  <option value="rating">Értékelés</option>
                  <option value="name">Név</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    setFilterHol('')
                    setFilterEvszak('')
                    setFilterIdoszak('')
                    setFilterTer('')
                    setFilterKivelMesz('')
                    setFilterMegkozelites('')
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Törlés
                </Button>
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
                              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                              <span className="font-bold text-lg">{place.rating}</span>
                              <span className="text-gray-400">({place.ratingCount})</span>
                            </div>
                            <span className="text-gray-500 font-semibold">
                              {place.distanceFromCenter < 1 ? `${Math.round(place.distanceFromCenter * 1000)} m` : `${place.distanceFromCenter.toFixed(1)} km`}
                              <span className="text-gray-400 font-normal ml-1">· {formatTravelTime(estimateTravelTimeMinutes(place.distanceFromCenter))}</span>
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
