'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useJsApiLoader, GoogleMap } from '@react-google-maps/api'
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer'

const defaultCenter = { lat: 47.16, lng: 19.5 } // Magyarország középe (alapnézet)

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

// Enyhébb, kevésbé zöld térkép (hovamenjunk.hu-hoz hasonló, light green–beige)
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    // Tájak: desaturált, világosabb zöld–beige
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ saturation: 0.15 }, { lightness: 72 }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ saturation: 0.2 }, { lightness: 68 }] },
    { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ saturation: 0.1 }, { lightness: 75 }] },
    // Víz: enyhe kék
    { featureType: 'water', elementType: 'geometry', stylers: [{ saturation: 0.4 }, { lightness: 85 }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  ],
}

// Kategória színek – referencia: piros marker éttermeknél, rózsaszín szállás, stb.
const CATEGORY_STYLE: Record<string, { pinColor: string; color: string; borderColor: string }> = {
  'Étterem': { pinColor: '#C62828', color: '#E8F5E9', borderColor: '#2D7A4F' },
  'Szállás': { pinColor: '#AD1457', color: '#FCE4EC', borderColor: '#E91E63' },
  'Látnivaló': { pinColor: '#1565C0', color: '#E3F2FD', borderColor: '#2196F3' },
  'Program': { pinColor: '#E65100', color: '#FFF3E0', borderColor: '#FF9800' },
}

// Egyszerű SVG path ikonok (fehér, 24x24 viewBox, pin közepén)
const PIN_ICONS: Record<string, string> = {
  Étterem: 'M9 3v12h2V3H9zm9 0v15h2V3h-2zM6 18h12v3H6v-3z',
  Szállás: 'M2 6h20v12H2V6zm2 2v8h6V8H4zm10 0v8h6V8h-6z',
  Látnivaló: 'M4 4h16v16H4V4zm2 2v12h12V6H6z',
  Program: 'M12 2l1.5 4.5H18l-3.5 2.5 1.5 4.5L12 11l-4 2.5 1.5-4.5L6 6.5h4.5L12 2z',
}

export type MapPlace = {
  id: number | string
  name: string
  slug?: string
  lat: number
  lng: number
  category?: string
  rating?: number
  ratingCount?: number
  distance?: number
  address?: string
  imageUrl?: string
  isOpen?: boolean
  isPremium?: boolean
}

export type SearchCircle = {
  center: { lat: number; lng: number }
  radiusKm: number
}

type MapViewProps = {
  places: MapPlace[]
  onPlaceSelect?: (place: MapPlace) => void
  selectedPlaceId?: number | null
  /** Saját helyzet: ha megadva, a térkép ide középre igazít és zoomol */
  userLocation?: { lat: number; lng: number } | null
  /** Keresési kör: ha megadva, megjelenik a térképen és csak a körön belüli helyek szűrhetők a szülőben */
  searchCircle?: SearchCircle | null
  /** Ha megadva, térképkattintáskor meghívódik (pl. kör középpont kijelöléséhez) */
  onMapClick?: (lat: number, lng: number) => void
}

// Kép URL betöltése base64-ként (így az SVG-ben megjelenik a buborékban)
async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    const blob = await res.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// Buborék marker: kör képvel (base64) vagy ikonnal, keret zöld (nyitva) vagy piros (zárva)
function createBubbleMarkerIcon(place: MapPlace, imageDataUrl: string | null): string {
  const size = 52
  const r = size / 2 - 2
  const cx = size / 2
  const cy = size / 2
  const borderColor = place.isOpen ? '#2D7A4F' : '#EF4444'
  const style = CATEGORY_STYLE[place.category || 'Étterem'] || CATEGORY_STYLE['Étterem']
  const iconPath = PIN_ICONS[place.category || 'Étterem'] || PIN_ICONS['Étterem']
  const bg = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${style.color}"/>`
  const inner = imageDataUrl
    ? `<defs><pattern id="bubble-${place.id}" x="0" y="0" width="1" height="1"><image href="${imageDataUrl}" x="0" y="0" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/></pattern></defs><circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="url(#bubble-${place.id})"/>`
    : `<g transform="translate(${cx},${cy}) scale(0.5) translate(-12,-12)"><path d="${iconPath}" fill="${style.borderColor}"/></g>`
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    ${bg}
    ${inner}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${borderColor}" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="1"/>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// Folyamatos pan + zoom animáció a megadott pozícióra (cluster kattintás)
// targetZoomLevel: egy kattintással ide zoomolunk, így a cluster szétesik és megjelennek a helyek
function animateMapTo(
  map: google.maps.Map,
  position: google.maps.LatLng | google.maps.LatLngLiteral,
  options: { targetZoomLevel?: number; durationMs?: number } = {}
) {
  const { targetZoomLevel = 14, durationMs = 600 } = options
  const startZoom = map.getZoom() ?? 7
  const targetZoom = Math.min(Math.max(0, targetZoomLevel), 18)
  map.panTo(position)
  const startTime = performance.now()
  function step(now: number) {
    const elapsed = now - startTime
    const t = Math.min(elapsed / durationMs, 1)
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    const currentZoom = startZoom + (targetZoom - startZoom) * eased
    map.setZoom(currentZoom)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// Egyedi cluster buborék: zöld kör, szám arányosan benne
function createClusterIcon(count: number): string {
  const color = count >= 10 ? '#1B5E20' : count >= 5 ? '#2D7A4F' : '#4CAF50'
  const size = 30
  const fontSize = 11
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="1.5"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="${fontSize}" font-weight="bold" font-family="system-ui,sans-serif">${count}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// Kattintásra megjelenő kártya tartalom – keret: zöld ha nyitva, piros ha zárva
function getInfoWindowContent(place: MapPlace, placeUrl: string): string {
  const style = CATEGORY_STYLE[place.category || 'Étterem'] || CATEGORY_STYLE['Étterem']
  const borderColor = place.isOpen ? '#2D7A4F' : '#EF4444' // zöld = nyitva, piros = zárva
  const img = place.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=280&h=140&fit=crop'
  const rating = place.rating ?? 4.5
  const ratingCount = place.ratingCount ?? 0
  const distance = place.distance != null
    ? (place.distance < 1 ? `${Math.round(place.distance * 1000)} m` : `${place.distance.toFixed(1)} km`)
    : ''
  const isRestaurant = (place.category || '').toLowerCase().includes('étterem') || (place.category || '').toLowerCase().includes('gastro')

  return `
    <div style="font-family:system-ui,sans-serif;width:100%;min-width:300px;max-width:380px;box-sizing:border-box;overflow:hidden;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.12);border:2px solid ${borderColor};background:#fff;">
      <div style="height:140px;background:linear-gradient(135deg,${style.color},#fff);background-image:url('${img}');background-size:cover;background-position:center;flex-shrink:0;"></div>
      <div style="padding:16px;box-sizing:border-box;">
        <div style="font-weight:700;font-size:16px;color:#1a1a1a;margin-bottom:4px;word-wrap:break-word;overflow-wrap:break-word;">${place.name}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:13px;flex-wrap:wrap;">
          ${Array.from({ length: 5 }, (_, i) => {
            const starNum = i + 1
            const isFilled = starNum <= Math.round(rating)
            return `<span style="color:${isFilled ? '#f59e0b' : '#d1d5db'};font-size:14px;">${isFilled ? '★' : '☆'}</span>`
          }).join('')}
          <span style="font-weight:600;">${rating}</span>
          <span style="color:#6b7280;">(${ratingCount})</span>
          ${distance ? `<span style="color:#6b7280;">• ${distance}</span>` : ''}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <a href="${placeUrl}" style="flex:1;display:block;text-align:center;padding:10px 12px;background:#2D7A4F;color:#fff!important;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;box-sizing:border-box;white-space:nowrap;">Részletek</a>
          ${isRestaurant ? '<a href="' + placeUrl + '#menu" style="flex:1;display:block;text-align:center;padding:10px 12px;background:#E8F5E9;color:#1B5E20!important;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;box-sizing:border-box;white-space:nowrap;">Étlap</a>' : '<a href="https://www.google.com/maps/dir/?api=1&destination=' + place.lat + ',' + place.lng + '" target="_blank" style="flex:1;display:block;text-align:center;padding:10px 12px;background:#E8F5E9;color:#1B5E20!important;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;box-sizing:border-box;white-space:nowrap;">Útvonal</a>'}
        </div>
      </div>
    </div>
  `
}

export function MapView({ places, onPlaceSelect, selectedPlaceId, userLocation, searchCircle, onMapClick }: MapViewProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    setMapReady(true)
    // Alapnézet: Magyarország (nem zoomolunk a markerekre, hogy az ország látszódjon)
  }, [])

  const onUnmount = useCallback(() => {
    setMapReady(false)
    circleRef.current?.setMap(null)
    circleRef.current = null
    infoWindowRef.current?.close()
    infoWindowRef.current = null
    clustererRef.current?.clearMarkers()
    clustererRef.current = null
    markersRef.current = []
    mapRef.current = null
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapReady || !mapRef.current || places.length === 0) return

    const map = mapRef.current
    let cancelled = false

    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
      clustererRef.current = null
    }
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow({ maxWidth: 500 })
    }
    const infoWindow = infoWindowRef.current
    let ignoreNextMapClick = false

    const defaultImageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop'
    const imageUrls = places.map((p) => p.imageUrl || defaultImageUrl)

    Promise.all(imageUrls.map((url) => loadImageAsDataUrl(url))).then((imageDataUrls) => {
      if (cancelled) return
      const markers = places.map((place, i) => {
        const marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map,
          title: place.name,
          icon: {
            url: createBubbleMarkerIcon(place, imageDataUrls[i] ?? null),
            scaledSize: new google.maps.Size(52, 52),
            anchor: new google.maps.Point(26, 52),
          },
          zIndex: selectedPlaceId === place.id ? 10 : 1,
        })

      const placeUrl = `/hely/${place.slug || place.id}`
      const content = getInfoWindowContent(place, placeUrl)

      marker.addListener('click', () => {
        ignoreNextMapClick = true
        setTimeout(() => { ignoreNextMapClick = false }, 100)
        infoWindow.close()
        infoWindow.setContent(content)
        infoWindow.open(map, marker)
        onPlaceSelect?.(place)
        // Részletek / Étlap / Útvonal linkek: a DOM-ból vesszük a href-et, így mindig a megfelelő helyre visz
        setTimeout(() => {
          const container = infoWindow.getContent()
          if (container && typeof container === 'object') {
            const el = container as HTMLElement
            el.querySelectorAll('a[href]').forEach((a) => {
              const anchor = a as HTMLAnchorElement
              anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href')
                if (href && href !== '#') {
                  e.preventDefault()
                  window.location.href = href
                }
              })
            })
          }
        }, 100)
      })

      return marker
    })

      markersRef.current = markers

      const clusterer = new MarkerClusterer({
        map,
        markers,
        algorithm: new SuperClusterAlgorithm({ radius: 45 }),
        onClusterClick: (_, cluster, map) => {
          const position = cluster.position
          if (!position) return
          const currentZoom = map.getZoom() ?? 7
          // Minden kattintás tovább zoomol: elsőre 14, aztán +2, így a 2. kattintás is kinyitja a clustert
          const targetZoomLevel = currentZoom >= 14 ? Math.min(currentZoom + 2, 18) : 14
          animateMapTo(map, position, { targetZoomLevel, durationMs: 600 })
        },
        renderer: {
          render: ({ count, position }, stats, map) => {
            const iconUrl = createClusterIcon(count)
            return new google.maps.Marker({
              position,
              icon: {
                url: iconUrl,
                scaledSize: new google.maps.Size(30, 30),
                anchor: new google.maps.Point(15, 15),
              },
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            })
          },
        },
      })

      clustererRef.current = clusterer

      if (mapClickListenerRef.current) {
        google.maps.event.removeListener(mapClickListenerRef.current)
      }
      mapClickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) onMapClick?.(e.latLng.lat(), e.latLng.lng())
        if (!ignoreNextMapClick) infoWindow.close()
      })
    })

    return () => {
      cancelled = true
      if (mapClickListenerRef.current) {
        google.maps.event.removeListener(mapClickListenerRef.current)
        mapClickListenerRef.current = null
      }
      infoWindowRef.current?.close()
      clustererRef.current?.clearMarkers()
      clustererRef.current = null
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
    }
  }, [isLoaded, mapReady, places, onPlaceSelect, selectedPlaceId, onMapClick])

  // Keresési kör: rajzolás / frissítés / törlés
  useEffect(() => {
    if (!isLoaded || !mapReady || !mapRef.current) return

    const map = mapRef.current

    // Ha nincs aktív keresési kör: töröljük az esetleges meglévő kört
    if (!searchCircle) {
      if (circleRef.current) {
        circleRef.current.setMap(null)
        circleRef.current = null
      }
      return
    }

    // Ha már létezik kör, csak frissítjük a középpontot és sugarat
    if (circleRef.current) {
      circleRef.current.setCenter(searchCircle.center)
      circleRef.current.setRadius(searchCircle.radiusKm * 1000)
      return
    }

    // Új kör létrehozása
    const circle = new google.maps.Circle({
      map,
      center: searchCircle.center,
      radius: searchCircle.radiusKm * 1000,
      fillColor: '#2D7A4F',
      fillOpacity: 0.12,
      strokeColor: '#2D7A4F',
      strokeWeight: 2,
      strokeOpacity: 0.8,
      clickable: false,
      zIndex: 0,
    })
    circleRef.current = circle

    return () => {
      circleRef.current?.setMap(null)
      circleRef.current = null
    }
  }, [isLoaded, mapReady, searchCircle])

  // Saját helyzet: térkép középre igazít és zoomol
  useEffect(() => {
    if (!userLocation || !mapRef.current) return
    const position = new google.maps.LatLng(userLocation.lat, userLocation.lng)
    mapRef.current.panTo(position)
    mapRef.current.setZoom(14)
  }, [userLocation])

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-red-600 font-medium">A térkép betöltése sikertelen. Ellenőrizd az API kulcsot.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E8F5E9] to-[#D4EDDA]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1B5E20] font-medium">Térkép betöltése...</p>
        </div>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={7}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    />
  )
}
