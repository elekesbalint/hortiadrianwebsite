'use client'

import {
  MapPin,
  Utensils,
  Bed,
  Calendar,
  Landmark,
  Home,
  Coffee,
  TreePine,
  Ticket,
  Camera,
  Wine,
  Mountain,
  Palmtree,
  Music,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

/** Admin ikonválasztó + header: elérhető ikonok (id = Lucide név, a DB-ben ezt tároljuk). */
export const CATEGORY_ICON_OPTIONS: { id: string; label: string }[] = [
  { id: 'MapPin', label: 'Térkép / Pin' },
  { id: 'Utensils', label: 'Éttermek' },
  { id: 'Bed', label: 'Szállás' },
  { id: 'Calendar', label: 'Program' },
  { id: 'Landmark', label: 'Látnivaló' },
  { id: 'Home', label: 'Otthon / Szállás' },
  { id: 'Coffee', label: 'Kávé / Bár' },
  { id: 'TreePine', label: 'Természet' },
  { id: 'Ticket', label: 'Jegy / Esemény' },
  { id: 'Camera', label: 'Fotó / Látnivaló' },
  { id: 'Wine', label: 'Bor / Gasztro' },
  { id: 'Mountain', label: 'Hegy / Túra' },
  { id: 'Palmtree', label: 'Nyár / Strand' },
  { id: 'Music', label: 'Zene / Koncert' },
  { id: 'Sparkles', label: 'Wellness / Szépség' },
]

const ICON_MAP: Record<string, LucideIcon> = {
  MapPin,
  Utensils,
  Bed,
  Calendar,
  Landmark,
  Home,
  Coffee,
  TreePine,
  Ticket,
  Camera,
  Wine,
  Mountain,
  Palmtree,
  Music,
  Sparkles,
}

/** Ikon komponens a megadott névből (header és admin megjelenítéshez). */
export function getCategoryIconComponent(name: string | null | undefined): LucideIcon | null {
  if (!name || typeof name !== 'string') return null
  return ICON_MAP[name.trim()] ?? null
}
