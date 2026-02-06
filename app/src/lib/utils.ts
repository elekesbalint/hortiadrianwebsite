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

// Utazási idő becslés autóval (~50 km/h átlag, városban ~35 km/h rövid távon)
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
