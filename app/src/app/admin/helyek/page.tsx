'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useJsApiLoader } from '@react-google-maps/api'
import { Button } from '@/components/ui/Button'
import {
  getPlaces,
  insertPlace,
  updatePlace,
  deletePlace,
  type AppPlace,
  type PlaceFormInput,
} from '@/lib/db/places'
import { uploadMenuFile } from '@/lib/db/menuUpload'
import { uploadPlacePhoto } from '@/lib/db/placePhotoUpload'
import { getCategories, type AppCategory } from '@/lib/db/categories'
import { getFilters, getPlaceFilters, setPlaceFilters, type AppFilter } from '@/lib/db/filters'
import { Pencil, Trash2, Plus, Search, X, Image as ImageIcon, FileText, Upload, Clock } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const GOOGLE_MAPS_LIBS: ('places')[] = ['places']

const defaultForm: PlaceFormInput = {
  name: '',
  category_id: '',
  description: '',
  address: '',
  rating: 4,
  ratingCount: 0,
  isOpen: true,
  isPremium: false,
  priceLevel: 2,
  lat: 47.4979,
  lng: 19.0402,
  imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop',
  menuUrl: null,
  featured_order: null,
  website: null,
  instagram: null,
  facebook: null,
  youtube: null,
  tiktok: null,
  email: null,
  eventDate: null,
  openingHours: null,
}

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<AppPlace[]>([])
  const [categories, setCategories] = useState<AppCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [modalOpen, setModalOpen] = useState<'add' | 'edit' | null>(null)
  const [editingPlace, setEditingPlace] = useState<AppPlace | null>(null)
  const [form, setForm] = useState<PlaceFormInput>(defaultForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [menuFile, setMenuFile] = useState<File | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const menuInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [filters, setFilters] = useState<AppFilter[]>([])
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([])

  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBS,
  })

  const load = async () => {
    setLoading(true)
    const [pls, cats, filts] = await Promise.all([getPlaces(), getCategories(), getFilters()])
    setPlaces(pls)
    setCategories(cats)
    setFilters(filts)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = places.filter((p) => {
    const matchSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoryFilter || p.category === categoryFilter
    return matchSearch && matchCat
  })

  const openAdd = () => {
    setForm({
      ...defaultForm,
      category_id: categories.length > 0 ? categories[0].id : '',
    })
    setEditingPlace(null)
    setMenuFile(null)
    setGalleryImages([])
    setSelectedFilterIds([])
    setModalOpen('add')
  }

  const openEdit = async (place: AppPlace) => {
    setEditingPlace(place)
    setMenuFile(null)
    setGalleryImages(place.images?.length ? place.images.slice(1) : [])
    setForm({
      name: place.name,
      category_id: place.category_id,
      description: place.description,
      address: place.address,
      rating: place.rating,
      ratingCount: place.ratingCount,
      isOpen: place.isOpen,
      isPremium: place.isPremium,
      priceLevel: place.priceLevel,
      lat: place.lat,
      lng: place.lng,
      imageUrl: place.imageUrl,
      menuUrl: place.menuUrl ?? null,
      featured_order: place.featured_order ?? null,
      website: place.website ?? null,
      instagram: place.instagram ?? null,
      facebook: place.facebook ?? null,
      youtube: place.youtube ?? null,
      tiktok: place.tiktok ?? null,
      email: place.email ?? null,
      eventDate: place.eventDate ?? null,
      openingHours: place.openingHours ?? null,
    })
    // Betöltjük a helyhez rendelt szűrőket
    const placeFilterIds = await getPlaceFilters(place.id)
    setSelectedFilterIds(placeFilterIds)
    setModalOpen('edit')
  }

  const closeModal = () => {
    setModalOpen(null)
    setEditingPlace(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category_id) {
      alert('Válassz kategóriát.')
      return
    }
    setSaving(true)
    let finalMenuUrl = form.menuUrl ?? null
    let placeId: string | null = null
    
    // Tisztítjuk az openingHours objektumot az üres értékektől
    let cleanedOpeningHours: Record<string, string> | null = null
    if (form.openingHours) {
      const cleaned = Object.fromEntries(
        Object.entries(form.openingHours).filter(([_, v]) => v && v.trim() !== '')
      )
      cleanedOpeningHours = Object.keys(cleaned).length > 0 ? cleaned : null
    }
    
    if (modalOpen === 'add') {
      const res = await insertPlace({ ...form, menuUrl: finalMenuUrl, openingHours: cleanedOpeningHours })
      if ('error' in res) {
        alert('Hiba a mentés során: ' + res.error)
        setSaving(false)
        return
      }
      placeId = res.id
      if (menuFile) {
        const url = await uploadMenuFile(res.id, menuFile)
        if (url) await updatePlace(res.id, { ...form, menuUrl: url, openingHours: cleanedOpeningHours })
      }
    } else if (editingPlace) {
      placeId = editingPlace.id
      if (menuFile) {
        const url = await uploadMenuFile(editingPlace.id, menuFile)
        if (url) finalMenuUrl = url
      }
      const images = [form.imageUrl, ...galleryImages].filter(Boolean)
      const result = await updatePlace(editingPlace.id, { ...form, menuUrl: finalMenuUrl, images, openingHours: cleanedOpeningHours })
      if (!result.ok) {
        alert('Hiba a mentés során: ' + result.error)
        setSaving(false)
        return
      }
    }
    
    // Szűrők mentése
    if (placeId) {
      await setPlaceFilters(placeId, selectedFilterIds)
    }
    
    await load()
    setSaving(false)
    closeModal()
  }

  // Google Places Autocomplete: helyeket és címeket is talál (pl. "budapest parkinn" → Park Inn Budapest)
  useEffect(() => {
    if (!modalOpen || !isGoogleLoaded || typeof google === 'undefined') return
    const input = addressInputRef.current
    if (!input) return
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['establishment', 'geocode'], // Helyek (hotel, étterem) ÉS címek
      fields: ['formatted_address', 'geometry', 'name'],
      componentRestrictions: { country: 'hu' }, // Csak Magyarország
    })
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const loc = place.geometry?.location
      const addr = place.formatted_address
      if (loc && addr) {
        setForm((f) => ({
          ...f,
          address: addr,
          lat: loc.lat(),
          lng: loc.lng(),
        }))
      }
    })
    return () => {
      google.maps.event.clearListeners(autocomplete, 'place_changed')
    }
  }, [modalOpen, isGoogleLoaded])

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setForm((f) => ({ ...f, imageUrl: dataUrl }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleMenuFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ok = file.type === 'application/pdf' || file.type.startsWith('image/')
    if (!ok) {
      alert('Csak JPG, PNG vagy PDF feltölthető.')
      return
    }
    setMenuFile(file)
    e.target.value = ''
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      return
    }
    setSaving(true)
    const ok = await deletePlace(id)
    setSaving(false)
    if (ok) {
      setDeleteConfirm(null)
      await load()
    } else {
      alert('Hiba történt a törlés során.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Helyek</h1>
          <p className="text-gray-500 mt-1">{filtered.length} hely a listában.</p>
        </div>
        <Button variant="primary" className="inline-flex items-center gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Új hely
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Keresés név vagy cím alapján..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] min-w-[180px]"
        >
          <option value="">Minden kategória</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F8FAF8]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Kép</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Név</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Kategória</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cím</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Értékelés</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Státusz</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((place) => (
                <tr key={place.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={place.imageUrl}
                        alt={place.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/hely/${place.slug || place.id}`} className="font-medium text-[#2D7A4F] hover:underline">
                      {place.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{place.category}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 max-w-[200px] truncate">{place.address}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="font-medium">{place.rating}</span>
                    <span className="text-gray-400"> ({place.ratingCount})</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                        place.isOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {place.isOpen ? 'Nyitva' : 'Zárva'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(place)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-[#E8F5E9] hover:text-[#2D7A4F] transition-colors"
                        title="Szerkesztés"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(place.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          deleteConfirm === place.id
                            ? 'bg-red-100 text-red-600'
                            : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                        }`}
                        title={deleteConfirm === place.id ? 'Kattints újra a törléshez' : 'Törlés'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            Nincs találat a szűréshez.
          </div>
        )}
      </div>

      {/* Modal: Új hely / Szerkesztés */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {modalOpen === 'add' ? 'Új hely' : 'Hely szerkesztése'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Bezárás"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Név *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategória *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                    required
                  >
                    <option value="">Válassz kategóriát</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(() => {
                const selectedCategory = categories.find(c => c.id === form.category_id)
                const isProgram = selectedCategory?.slug === 'programok'
                return isProgram ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Esemény dátuma/időpontja</label>
                    <input
                      type="datetime-local"
                      value={form.eventDate ? new Date(form.eventDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setForm((f) => ({ ...f, eventDate: value ? new Date(value).toISOString() : null }))
                      }}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Csak programokhoz: az esemény dátumát/időpontját itt lehet megadni.
                    </p>
                  </div>
                ) : null
              })()}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cím *</label>
                <input
                  ref={addressInputRef}
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Pl. 'budapest parkinn' vagy konkrét cím"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Google javaslatok: helyeket és címeket is talál (pl. hotel neve). A pozíció (lat/lng) automatikusan kitöltődik.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Közösségi média / Web</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Weboldal (URL)</label>
                    <input
                      type="url"
                      value={form.website ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, website: e.target.value.trim() || null }))}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Instagram (profil vagy URL)</label>
                    <input
                      type="text"
                      value={form.instagram ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value.trim() || null }))}
                      placeholder="@profil vagy https://..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Facebook (oldal URL)</label>
                    <input
                      type="url"
                      value={form.facebook ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value.trim() || null }))}
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">YouTube (csatorna vagy videó URL)</label>
                    <input
                      type="text"
                      value={form.youtube ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, youtube: e.target.value.trim() || null }))}
                      placeholder="https://youtube.com/..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">TikTok (profil vagy videó URL)</label>
                    <input
                      type="text"
                      value={form.tiktok ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value.trim() || null }))}
                      placeholder="https://tiktok.com/@..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">E-mail (kapcsolat)</label>
                    <input
                      type="email"
                      value={form.email ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value.trim() || null }))}
                      placeholder="info@pelda.hu"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">A hely részletes oldalán a Linkek sorban megjelennek (ha kitöltve).</p>
              </div>
              
              {/* Nyitvatartás */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#2D7A4F]" />
                  Nyitvatartás
                </label>
                <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {[
                      { key: 'monday', label: 'Hétfő' },
                      { key: 'tuesday', label: 'Kedd' },
                      { key: 'wednesday', label: 'Szerda' },
                      { key: 'thursday', label: 'Csütörtök' },
                      { key: 'friday', label: 'Péntek' },
                      { key: 'saturday', label: 'Szombat' },
                      { key: 'sunday', label: 'Vasárnap' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <label className="w-28 text-sm font-semibold text-gray-700 flex-shrink-0">{label}</label>
                        <input
                          type="text"
                          value={form.openingHours?.[key] || ''}
                          onChange={(e) => {
                            const value = e.target.value.trim()
                            setForm((f) => ({
                              ...f,
                              openingHours: {
                                ...(f.openingHours || {}),
                                [key]: value,
                              },
                            }))
                          }}
                          placeholder="pl. 09:00-17:00 vagy Zárva"
                          className="flex-1 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/10 text-sm transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Formátum: HH:MM-HH:MM (pl. 09:00-17:00). Ha üresen hagyod, akkor "Zárva" jelenik meg.
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Értékelés</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Értékelések száma</label>
                  <input
                    type="number"
                    min="0"
                    value={form.ratingCount}
                    onChange={(e) => setForm((f) => ({ ...f, ratingCount: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Árkategória (1–4)</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={form.priceLevel}
                    onChange={(e) => setForm((f) => ({ ...f, priceLevel: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Pozíció a térképen (haladó)</p>
                <p className="text-xs text-gray-500 mb-2">A cím kiválasztásakor automatikusan kitöltődik. Ha szükséges, itt kézzel is módosíthatod.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Szélesség (lat)</label>
                    <input
                      type="number"
                      step="any"
                      value={form.lat}
                      onChange={(e) => setForm((f) => ({ ...f, lat: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                      placeholder="pl. 47.4979"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hosszúság (lng)</label>
                    <input
                      type="number"
                      step="any"
                      value={form.lng}
                      onChange={(e) => setForm((f) => ({ ...f, lng: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F]"
                      placeholder="pl. 19.0402"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kép</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {form.imageUrl ? (
                      <Image
                        src={form.imageUrl}
                        alt="Előnézet"
                        fill
                        className="object-cover"
                        sizes="128px"
                        unoptimized={form.imageUrl.startsWith('data:')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E8F5E9] text-[#1B5E20] rounded-xl font-medium text-sm cursor-pointer hover:bg-[#C8E6C9] transition-colors">
                      <ImageIcon className="h-5 w-5" />
                      Kép tallózása
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFile}
                        className="sr-only"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG vagy más képformátum. Max. ~2 MB ajánlott.</p>
                  </div>
                </div>
              </div>
              {modalOpen === 'edit' && editingPlace && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fotók (galéria) – a hely részletes oldalán a „Fotók” fülön</label>
                  <div className="flex flex-wrap gap-3">
                    {galleryImages.map((url, i) => (
                      <div
                        key={url + i}
                        draggable
                        onDragStart={(e) => {
                          setDraggedIndex(i)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (draggedIndex === null || draggedIndex === i) return
                          const newImages = [...galleryImages]
                          const [removed] = newImages.splice(draggedIndex, 1)
                          newImages.splice(i, 0, removed)
                          setGalleryImages(newImages)
                          setDraggedIndex(null)
                        }}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={`relative group cursor-move ${draggedIndex === i ? 'opacity-50' : ''}`}
                      >
                        <div className={`relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border-2 ${draggedIndex === i ? 'border-[#2D7A4F] border-dashed' : 'border-gray-200'} transition-all`}>
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized={url.startsWith('data:') || url.includes('supabase.co')}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGalleryImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-90 hover:opacity-100 text-xs z-10"
                          aria-label="Eltávolít"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#2D7A4F] hover:bg-[#F8FAF8] transition-colors text-gray-500">
                      <Upload className="h-6 w-6 mb-0.5" />
                      <span className="text-xs">Tallózás</span>
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingPhoto}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !editingPlace) return
                          setUploadingPhoto(true)
                          const url = await uploadPlacePhoto(editingPlace.id, file)
                          setUploadingPhoto(false)
                          e.target.value = ''
                          if (url) setGalleryImages((prev) => [...prev, url])
                          else alert('A feltöltés sikertelen.')
                        }}
                      />
                    </label>
                  </div>
                  {uploadingPhoto && <p className="text-sm text-gray-500 mt-1">Feltöltés...</p>}
                  <p className="text-xs text-gray-500 mt-1">Az első kép (fent) a fő borítókép. Itt feltöltött képek a részletes oldal „Fotók” fülén jelennek meg.</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Étlap (JPG/PDF)</label>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E8F5E9] text-[#1B5E20] rounded-xl font-medium text-sm cursor-pointer hover:bg-[#C8E6C9] transition-colors w-fit">
                    <FileText className="h-5 w-5" />
                    Étlap tallózása
                    <input
                      ref={menuInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={handleMenuFile}
                      className="sr-only"
                    />
                  </label>
                  {menuFile && <p className="text-sm text-gray-600">{menuFile.name}</p>}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isOpen}
                    onChange={(e) => setForm((f) => ({ ...f, isOpen: e.target.checked }))}
                    className="rounded border-gray-300 text-[#2D7A4F] focus:ring-[#2D7A4F]"
                  />
                  <span className="text-sm font-medium text-gray-700">Nyitva</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPremium}
                    onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))}
                    className="rounded border-gray-300 text-[#2D7A4F] focus:ring-[#2D7A4F]"
                  />
                  <span className="text-sm font-medium text-gray-700">Prémium</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Felkapott sorrend (kezdőlap)</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={form.featured_order ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, featured_order: e.target.value === '' ? null : Number(e.target.value) }))}
                  placeholder="0 = nem jelenik meg"
                  className="w-full max-w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2D7A4F]"
                />
                <p className="text-xs text-gray-500 mt-1">1 = első, 2 = második… a „Felkapott helyek” szekcióban. 0 vagy üres = nem felkapott.</p>
              </div>
            </div>
            
            {/* Szűrők */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Szűrők</label>
              <p className="text-xs text-gray-500 mb-4">Válassz ki, hogy mely szűrők vonatkoznak erre a helyre (pl. Évszak, Időszak, Tér, stb.)</p>
              {filters.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Még nincs szűrő. Hozz létre szűrőket a <Link href="/admin/szurok" className="text-[#2D7A4F] hover:underline">Szűrők</Link> oldalon.</p>
              ) : (
                <div className="space-y-6 max-h-[500px] overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50">
                  {Object.entries(
                    filters.reduce<Record<string, AppFilter[]>>((acc, f) => {
                      const key = f.group_slug || 'egyeb'
                      if (!acc[key]) acc[key] = []
                      acc[key].push(f)
                      return acc
                    }, {})
                  )
                    .sort(([a], [b]) => {
                      // Rendezés: először a fontosabb csoportok
                      const order = ['evszak', 'idoszak', 'ter', 'kivel-mesz', 'megkozelites', 'hol']
                      const aIdx = order.indexOf(a)
                      const bIdx = order.indexOf(b)
                      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b)
                      if (aIdx === -1) return 1
                      if (bIdx === -1) return -1
                      return aIdx - bIdx
                    })
                    .map(([groupSlug, items]) => (
                      <div key={groupSlug} className="space-y-3">
                        <h4 className="text-base font-semibold text-gray-900 border-b border-gray-300 pb-2">
                          {items[0]?.group_name || groupSlug}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {items
                            .sort((a, b) => a.order - b.order)
                            .map((filter) => (
                              <label
                                key={filter.id}
                                className={`flex items-start gap-3 p-3 rounded-lg bg-white border-2 transition-all cursor-pointer ${
                                  selectedFilterIds.includes(filter.id)
                                    ? 'border-[#2D7A4F] bg-[#E8F5E9] shadow-sm'
                                    : 'border-gray-200 hover:border-[#2D7A4F]/50 hover:bg-[#F8FAF8]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedFilterIds.includes(filter.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFilterIds((prev) => [...prev, filter.id])
                                    } else {
                                      setSelectedFilterIds((prev) => prev.filter((id) => id !== filter.id))
                                    }
                                  }}
                                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F] focus:ring-offset-1 cursor-pointer flex-shrink-0"
                                />
                                <span className={`text-sm font-medium leading-relaxed ${
                                  selectedFilterIds.includes(filter.id) ? 'text-[#1B5E20]' : 'text-gray-700'
                                }`}>
                                  {filter.name}
                                </span>
                              </label>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Mégse
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Mentés...' : modalOpen === 'add' ? 'Hozzáadás' : 'Mentés'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
