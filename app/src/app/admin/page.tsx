'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { getPlaces } from '@/lib/db/places'
import { getCategories, type AppCategory } from '@/lib/db/categories'
import { MapPin, FolderTree, Star, Eye } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function AdminDashboardPage() {
  const [places, setPlaces] = useState<Awaited<ReturnType<typeof getPlaces>>>([])
  const [categories, setCategories] = useState<AppCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPlaces(), getCategories()])
      .then(([pls, cats]) => {
        setPlaces(pls)
        setCategories(cats)
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    if (places.length === 0)
      return { byCategory: {} as Record<string, number>, total: 0, avgRating: '0', openCount: 0 }
    const byCategory = places.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {})
    const totalRating = places.reduce((s, p) => s + p.rating, 0)
    const avgRating = (totalRating / places.length).toFixed(1)
    const openCount = places.filter((p) => p.isOpen).length
    return { byCategory, total: places.length, avgRating, openCount }
  }, [places])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Áttekintés</h1>
          <div className="mt-4">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Áttekintés</h1>
        <p className="text-gray-500 mt-1">A Programláz admin felület kezdőlapja.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#E8F5E9]">
              <MapPin className="h-6 w-6 text-[#2D7A4F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Összes hely</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#E8F5E9]">
              <FolderTree className="h-6 w-6 text-[#2D7A4F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Kategóriák</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#E8F5E9]">
              <Star className="h-6 w-6 text-[#2D7A4F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Átlag értékelés</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats.avgRating}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#E8F5E9]">
              <Eye className="h-6 w-6 text-[#2D7A4F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Nyitva most</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats.openCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Helyek kategóriánként</h2>
          <ul className="space-y-2">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <li key={cat} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{cat}</span>
                <span className="font-semibold text-[#2D7A4F]">{count}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/helyek"
            className="inline-block mt-4 text-sm font-semibold text-[#2D7A4F] hover:text-[#1B5E20]"
          >
            Helyek kezelése →
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Gyors linkek</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/admin/helyek" className="text-[#2D7A4F] hover:underline font-medium">
                Helyek listája
              </Link>
            </li>
            <li>
              <Link href="/admin/kategoriak" className="text-[#2D7A4F] hover:underline font-medium">
                Kategóriák kezelése
              </Link>
            </li>
            <li>
              <Link href="/terkep" className="text-[#2D7A4F] hover:underline font-medium">
                Térkép megtekintése
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
