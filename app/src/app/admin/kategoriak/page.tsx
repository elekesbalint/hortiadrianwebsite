'use client'

import { useState, useEffect } from 'react'
import {
  getCategories,
  insertCategory,
  updateCategory,
  deleteCategory,
  moveCategoryUp,
  moveCategoryDown,
  type AppCategory,
} from '@/lib/db/categories'
import { getFilterGroupOptions } from '@/lib/db/filters'
import { getFilterGroupSlugsForCategory, setFilterGroupsForCategory } from '@/lib/db/categoryFilterGroups'
import { getPlaces } from '@/lib/db/places'
import { uploadCategoryBanner } from '@/lib/db/categoryBannerUpload'
import { Button } from '@/components/ui/Button'
import { FolderTree, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Image as ImageIcon, Upload, Sliders } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CATEGORY_ICON_OPTIONS, getCategoryIconComponent } from '@/lib/categoryIcons'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AppCategory[]>([])
  const [places, setPlaces] = useState<{ category_id: string; categoryIds?: string[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [newName, setNewName] = useState('')
  const [newImage, setNewImage] = useState('')
  const [newIcon, setNewIcon] = useState<string | null>(null)
  const [newDetailPageTitle, setNewDetailPageTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editImage, setEditImage] = useState('')
  const [editIcon, setEditIcon] = useState<string | null>(null)
  const [editDetailPageTitle, setEditDetailPageTitle] = useState('')
  const [editFeaturedOrder, setEditFeaturedOrder] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingEditBanner, setUploadingEditBanner] = useState(false)
  const [filterGroupOptions, setFilterGroupOptions] = useState<{ group_slug: string; group_name: string }[]>([])
  const [editFilterGroupSlugs, setEditFilterGroupSlugs] = useState<string[]>([])

  const load = async () => {
    setLoading(true)
    const [cats, pls, groups] = await Promise.all([getCategories(), getPlaces(), getFilterGroupOptions()])
    setCategories(cats)
    setPlaces(pls.map((p) => ({ category_id: p.category_id, categoryIds: p.categoryIds })))
    setFilterGroupOptions(groups)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const placeCountByCategoryId = (categoryId: string) =>
    places.filter(
      (p) =>
        (p.categoryIds && p.categoryIds.includes(categoryId)) ||
        p.category_id === categoryId
    ).length

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, '-')
    const name = newName.trim()
    if (!slug || !name) return
    if (categories.some((c) => c.slug === slug)) {
      alert('Ez a slug már létezik.')
      return
    }
    setSaving(true)
    const ok = await insertCategory(slug, name, true, newImage.trim() || null, newIcon || null, newDetailPageTitle.trim() || null)
    setSaving(false)
    if (ok) {
      setNewSlug('')
      setNewName('')
      setNewImage('')
      setNewIcon(null)
      setNewDetailPageTitle('')
      await load()
    } else {
      alert('Hiba történt a mentés során.')
    }
  }

  const startEdit = async (id: string, name: string, image: string | null, icon: string | null, detail_page_title: string | null, featured_order: number | null) => {
    setEditingId(id)
    setEditName(name)
    setEditImage(image ?? '')
    setEditIcon(icon ?? null)
    setEditDetailPageTitle(detail_page_title ?? '')
    setEditFeaturedOrder(featured_order ? featured_order.toString() : '')
    const slugs = await getFilterGroupSlugsForCategory(id)
    setEditFilterGroupSlugs(slugs)
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    const c = categories.find((x) => x.id === editingId)
    if (!c) return
    setSaving(true)
    const ok = await updateCategory(editingId, c.slug, editName.trim(), { show_in_header: c.show_in_header, image: editImage.trim() || null, icon: editIcon || null, detail_page_title: editDetailPageTitle.trim() || null, featured_order: editFeaturedOrder ? Number(editFeaturedOrder) : null })
    const okFilters = await setFilterGroupsForCategory(editingId, editFilterGroupSlugs)
    setSaving(false)
    if (ok) {
      if (!okFilters) alert('A kategória mentve, de a szűrő hozzárendelések mentése sikertelen.')
      setEditingId(null)
      setEditName('')
      setEditImage('')
      setEditIcon(null)
      setEditDetailPageTitle('')
      setEditFeaturedOrder('')
      setEditFilterGroupSlugs([])
      await load()
    } else {
      alert('Hiba történt a mentés során.')
    }
  }

  const toggleShowInHeader = async (c: AppCategory) => {
    setSaving(true)
    const ok = await updateCategory(c.id, c.slug, c.name, { show_in_header: !c.show_in_header })
    setSaving(false)
    if (ok) await load()
    else alert('Hiba történt a mentés során.')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditImage('')
    setEditIcon(null)
    setEditDetailPageTitle('')
    setEditFeaturedOrder('')
    setEditFilterGroupSlugs([])
  }

  const handleMoveUp = async (id: string) => {
    setSaving(true)
    const ok = await moveCategoryUp(id)
    setSaving(false)
    if (ok) await load()
    else alert('Hiba történt a sorrend módosításakor.')
  }

  const handleMoveDown = async (id: string) => {
    setSaving(true)
    const ok = await moveCategoryDown(id)
    setSaving(false)
    if (ok) await load()
    else alert('Hiba történt a sorrend módosításakor.')
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      return
    }
    setSaving(true)
    const result = await deleteCategory(id)
    setSaving(false)
    if (result.ok) {
      setDeleteConfirm(null)
      await load()
    } else {
      setDeleteConfirm(null)
      alert(result.error || 'Hiba történt a törlés során.')
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
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Kategóriák</h1>
        <p className="text-gray-500 mt-1">Kategóriák kezelése az adatbázisban.</p>
      </div>

      {/* Új kategória */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-[#2D7A4F]" />
          Új kategória
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="flex-1">
            <label htmlFor="cat-slug" className="block text-sm font-medium text-gray-700 mb-1">Slug (URL-barát, pl. wellness)</label>
            <input
              id="cat-slug"
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="wellness"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700 mb-1">Megjelenített név (headerben)</label>
            <input
              id="cat-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Wellnessek"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="cat-detail-title" className="block text-sm font-medium text-gray-700 mb-1">Részletes oldal címe (opcionális)</label>
            <input
              id="cat-detail-title"
              type="text"
              value={newDetailPageTitle}
              onChange={(e) => setNewDetailPageTitle(e.target.value)}
              placeholder="Ha üres, a fenti név jelenik meg"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Header ikon (opcionális)</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setNewIcon(null)}
                title="Nincs ikon"
                className={`p-2 rounded-lg border transition-colors ${newIcon === null ? 'border-[#2D7A4F] bg-[#E8F5E9] text-[#2D7A4F]' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-500'}`}
              >
                —
              </button>
              {CATEGORY_ICON_OPTIONS.map((opt) => {
                const Icon = getCategoryIconComponent(opt.id)
                if (!Icon) return null
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewIcon(newIcon === opt.id ? null : opt.id)}
                    title={opt.label}
                    className={`p-2 rounded-lg border transition-colors ${newIcon === opt.id ? 'border-[#2D7A4F] bg-[#E8F5E9] text-[#2D7A4F]' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-500'}`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <ImageIcon className="h-4 w-4 text-[#2D7A4F]" /> Banner kép
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer text-sm text-gray-700 transition-colors">
              <Upload className="h-4 w-4" />
              {uploadingBanner ? 'Feltöltés...' : 'Fájl tallózása'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploadingBanner}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploadingBanner(true)
                  const url = await uploadCategoryBanner(file)
                  setUploadingBanner(false)
                  e.target.value = ''
                  if (url) setNewImage(url)
                  else alert('A feltöltés sikertelen.')
                }}
              />
            </label>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="primary" className="inline-flex items-center gap-2" disabled={saving}>
              {saving ? 'Mentés...' : 'Hozzáadás'}
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-[#2D7A4F]" />
            Kategóriák ({categories.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F8FAF8]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Sorrend</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Slug</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Megjelenített név</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Header ikon</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Banner kép</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Headerben</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Helyek száma</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, index) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(c.id)}
                        disabled={saving || index === 0}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-[#E8F5E9] hover:text-[#2D7A4F] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        title="Fel"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(c.id)}
                        disabled={saving || index === categories.length - 1}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-[#E8F5E9] hover:text-[#2D7A4F] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        title="Le"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <code className="px-2 py-0.5 bg-gray-100 rounded text-sm text-gray-700">{c.slug}</code>
                  </td>
                  <td className="py-3 px-4">
                    {editingId === c.id ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Headerben"
                            className="px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#2D7A4F] w-48"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="text-sm font-medium text-[#2D7A4F] hover:underline"
                            disabled={saving}
                          >
                            Mentés
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-sm text-gray-500 hover:underline"
                          >
                            Mégse
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">Részletes oldal címe (opcionális)</label>
                          <input
                            type="text"
                            value={editDetailPageTitle}
                            onChange={(e) => setEditDetailPageTitle(e.target.value)}
                            placeholder="Ha üres, a fenti név"
                            className="px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#2D7A4F] w-48 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">Felkapott sorrend (opcionális)</label>
                          <input
                            type="number"
                            min="1"
                            value={editFeaturedOrder}
                            onChange={(e) => setEditFeaturedOrder(e.target.value)}
                            placeholder="1, 2, 3... (NULL = nem felkapott)"
                            className="px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#2D7A4F] w-48 text-sm"
                          />
                          <p className="text-xs text-gray-400 mt-0.5">Ha megadva, megjelenik a főoldal "Felkapott kategóriák" szekciójában</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                            <Sliders className="h-3.5 w-3.5 text-[#2D7A4F]" />
                            Szűrők ehhez a kategóriához
                          </label>
                          <p className="text-xs text-gray-400 mb-2">Ezek a szűrőcsoportok jelennek meg a kategória és a térkép oldalon.</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {filterGroupOptions.map((opt) => (
                              <label key={opt.group_slug} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={editFilterGroupSlugs.includes(opt.group_slug)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditFilterGroupSlugs((prev) => [...prev, opt.group_slug].sort())
                                    } else {
                                      setEditFilterGroupSlugs((prev) => prev.filter((s) => s !== opt.group_slug))
                                    }
                                  }}
                                  className="rounded border-gray-300 text-[#2D7A4F] focus:ring-[#2D7A4F]"
                                />
                                {opt.group_name}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="font-medium text-[#1A1A1A]">{c.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === c.id ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setEditIcon(null)}
                          title="Nincs ikon"
                          className={`p-1.5 rounded-lg border transition-colors ${editIcon === null ? 'border-[#2D7A4F] bg-[#E8F5E9] text-[#2D7A4F]' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-500'}`}
                        >
                          —
                        </button>
                        {CATEGORY_ICON_OPTIONS.map((opt) => {
                          const Icon = getCategoryIconComponent(opt.id)
                          if (!Icon) return null
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setEditIcon(editIcon === opt.id ? null : opt.id)}
                              title={opt.label}
                              className={`p-1.5 rounded-lg border transition-colors ${editIcon === opt.id ? 'border-[#2D7A4F] bg-[#E8F5E9] text-[#2D7A4F]' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-500'}`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </button>
                          )
                        })}
                      </div>
                    ) : c.icon ? (
                      (() => {
                        const Icon = getCategoryIconComponent(c.icon)
                        return Icon ? <Icon className="h-5 w-5 text-[#2D7A4F]" /> : <span className="text-sm text-gray-400">{c.icon}</span>
                      })()
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 max-w-[280px]">
                    {editingId === c.id ? (
                      <label className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-xs text-gray-700">
                        <Upload className="h-3.5 w-3.5" />
                        {uploadingEditBanner ? 'Feltöltés...' : 'Tallózás'}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingEditBanner}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setUploadingEditBanner(true)
                            const url = await uploadCategoryBanner(file)
                            setUploadingEditBanner(false)
                            e.target.value = ''
                            if (url) setEditImage(url)
                            else alert('A feltöltés sikertelen.')
                          }}
                        />
                      </label>
                    ) : c.image ? (
                      <a href={c.image} target="_blank" rel="noopener noreferrer" className="text-sm text-[#2D7A4F] hover:underline truncate block max-w-full" title={c.image}>
                        Kép beállítva
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        checked={c.show_in_header}
                        onChange={() => toggleShowInHeader(c)}
                        disabled={saving}
                        className="rounded border-gray-300 text-[#2D7A4F] focus:ring-[#2D7A4F]"
                      />
                      <span className="text-sm text-gray-600">Megjelenik a headerben</span>
                    </label>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {placeCountByCategoryId(c.id)} hely
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingId === c.id ? null : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(c.id, c.name, c.image, c.icon, c.detail_page_title, c.featured_order)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-[#E8F5E9] hover:text-[#2D7A4F] transition-colors"
                          title="Szerkesztés"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            deleteConfirm === c.id
                              ? 'bg-red-100 text-red-600'
                              : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                          }`}
                          title={deleteConfirm === c.id ? 'Kattints újra a törléshez' : 'Törlés'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
