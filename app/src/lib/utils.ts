import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}

// Format rating
export function formatRating(rating: number, count: number): string {
  return `${rating.toFixed(1)} (${count})`
}

// Google Maps Directions Service használata útvonal távolsághoz és időhöz
// Ez pontosabb, mint a légvonalban számítás
export async function getRouteDistanceAndTime(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distanceKm: number; durationMinutes: number } | null> {
  if (typeof window === 'undefined' || !window.google?.maps?.DirectionsService) {
    // Fallback: Ha nincs Google Maps API, légvonalban számolunk
    const distanceKm = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng)
    const durationMinutes = estimateTravelTimeMinutes(distanceKm)
    return { distanceKm, durationMinutes }
  }

  return new Promise((resolve) => {
    const directionsService = new google.maps.DirectionsService()
    directionsService.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result && result.routes?.[0]?.legs?.[0]) {
          const route = result.routes[0]
          const leg = route.legs[0]
          if (leg.distance?.value && leg.duration?.value) {
            const distanceKm = leg.distance.value / 1000 // méter -> km
            const durationMinutes = Math.round(leg.duration.value / 60) // másodperc -> perc
            resolve({ distanceKm, durationMinutes })
            return
          }
        }
        // Fallback: Ha az API hívás sikertelen vagy hiányzó adatok, légvonalban számolunk
        const distanceKm = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng)
        const durationMinutes = estimateTravelTimeMinutes(distanceKm)
        resolve({ distanceKm, durationMinutes })
      }
    )
  })
}

// Utazási idő becslés autóval (~50 km/h átlag, városban ~35 km/h rövid távon)
// Ez csak fallback, ha nincs Google Maps API
export function estimateTravelTimeMinutes(km: number): number {
  if (km <= 0) return 0
  const avgSpeedKmh = km < 3 ? 35 : 50
  const hours = km / avgSpeedKmh
  return Math.max(1, Math.round(hours * 60))
}

// Formázás: "~15 perc" vagy "~1 óra 10 perc"
export function formatTravelTime(minutes: number): string {
  if (minutes < 1) return '~1 perc'
  if (minutes < 60) return `~${minutes} perc`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return h === 1 ? '~1 óra' : `~${h} óra`
  return `~${h} óra ${m} perc`
}
