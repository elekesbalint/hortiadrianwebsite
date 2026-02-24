'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
  getFilters,
  insertFilter,
  updateFilter,
  deleteFilter,
  type AppFilter,
} from '@/lib/db/filters'
import { getCategories, type AppCategory } from '@/lib/db/categories'
import { getCategoryFilterGroupsMap } from '@/lib/db/categoryFilterGroups'
import { Sliders, Plus, Pencil, Trash2, X, ChevronDown, FolderTree } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'filter'
}

type CategoryWithGroups = { category: AppCategory; groupSlugs: string[] }

export default function AdminFiltersPage() {
  const [filters, setFilters] = useState<AppFilter[]>([])
  const [categories, setCategories] = useState<AppCategory[]>([])
  const [categoryGroupsMap, setCategoryGroupsMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState<'add' | 'edit' | null>(null)
  const [editingFilter, setEditingFilter] = useState<AppFilter | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({
    group_name: '',
    group_slug: '',
    name: '',
    slug: '',
    order: 0,
  })
  const [formError, setFormError] = useState('')
  /** Ha nem üres, az "Új opció" gombból nyitottuk: csak opció neve/sorrend szerkeszthető, csoport fix */
  const [addToGroupSlug, setAddToGroupSlug] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const [list, cats, map] = await Promise.all([
      getFilters(),
      getCategories(),
      getCategoryFilterGroupsMap(),
    ])
    setFilters(list)
    setCategories(cats)
    setCategoryGroupsMap(map)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const grouped = useMemo(
    () =>
      filters.reduce<Record<string, AppFilter[]>>((acc, f) => {
        const key = f.group_slug || 'egyeb'
        if (!acc[key]) acc[key] = []
        acc[key].push(f)
        return acc
      }, {}),
    [filters]
  )

  /** Kategóriák a saját szűrőcsoportjaikkal (csak ahol van legalább egy csoport) */
  const categoriesWithGroups = useMemo((): CategoryWithGroups[] => {
    return categories
      .map((category) => ({
        category,
        groupSlugs: [...new Set(categoryGroupsMap[category.id] ?? [])],
      }))
      .filter((c) => c.groupSlugs.length > 0)
      .sort((a, b) => a.category.order - b.category.order)
  }, [categories, categoryGroupsMap])

  /** Olyan group_slug-ok, amelyek nincsenek egyetlen kategóriához sem rendelve */
  const orphanGroupSlugs = useMemo(() => {
    const assigned = new Set(Object.values(categoryGroupsMap).flat())
    return Object.keys(grouped).filter((slug) => !assigned.has(slug))
  }, [grouped, categoryGroupsMap])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const openAdd = () => {
    setForm({ group_name: '', group_slug: '', name: '', slug: '', order: 0 })
    setEditingFilter(null)
    setAddToGroupSlug(null)
    setFormError('')
    setModalOpen('add')
  }

  const openAddForGroup = (groupSlug: string, groupName: string) => {
    const items = grouped[groupSlug] ?? []
    const maxOrder = items.length > 0 ? Math.max(...items.map((f) => f.order), 0) : 0
    setForm({
      group_name: groupName,
      group_slug: groupSlug,
      name: '',
      slug: '',
      order: maxOrder + 1,
    })
    setEditingFilter(null)
    setAddToGroupSlug(groupSlug)
    setFormError('')
    setModalOpen('add')
  }

  const openEdit = (f: AppFilter) => {
    setEditingFilter(f)
    setForm({
      group_name: f.group_name,
      group_slug: f.group_slug,
      name: f.name,
      slug: f.slug,
      order: f.order,
    })
    setAddToGroupSlug(null)
    setFormError('')
    setModalOpen('edit')
  }

  const closeModal = () => {
    setModalOpen(null)
    setEditingFilter(null)
    setAddToGroupSlug(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const groupSlug = form.group_slug.trim() || slugify(form.group_name)
    const slug = form.slug.trim() || slugify(form.name)
    if (!form.group_name.trim() || !form.name.trim()) {
      setFormError('Csoport neve és a szűrő neve kötelező.')
      return
    }
    setSaving(true)
    if (modalOpen === 'add') {
      const res = await insertFilter(form.group_name.trim(), groupSlug, form.name.trim(), slug, form.order)
      setSaving(false)
      if (res) {
        closeModal()
        await load()
      } else {
        setFormError('Hiba történt a mentés során.')
      }
    } else if (editingFilter) {
      const ok = await updateFilter(
        editingFilter.id,
        form.group_name.trim(),
        groupSlug,
        form.name.trim(),
        slug,
        form.order,
        editingFilter.is_active
      )
      setSaving(false)
      if (ok) {
        closeModal()
        await load()
      } else {
        setFormError('Hiba történt a mentés során.')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      return
    }
    setSaving(true)
    const ok = await deleteFilter(id)
    setSaving(false)
    setDeleteConfirm(null)
    if (ok) await load()
  }

  const renderGroupCard = (groupSlug: string, items: AppFilter[]) => {
    const groupName = items[0]?.group_name || groupSlug
    return (
      <Card key={groupSlug} className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#1A1A1A]">{groupName}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openAddForGroup(groupSlug, groupName)}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Új opció
            </Button>
          </div>
          <ul className="space-y-2">
            {items
              .sort((a, b) => a.order - b.order)
              .map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-4 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100"
                >
                  <span className="font-medium text-gray-800">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(f)}
                      className="p-2 text-gray-500 hover:text-[#2D7A4F] hover:bg-[#E8F5E9] rounded-lg transition-colors"
                      title="Szerkesztés"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        deleteConfirm === f.id
                          ? 'bg-red-100 text-red-600'
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={deleteConfirm === f.id ? 'Törlés megerősítése' : 'Törlés'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Szűrők</h1>
          <p className="text-gray-500 mt-1">
            A szűrőket kategóriánként kezelheted. Nyisd ki a kategóriát, majd a csoportokban szerkeszd vagy add hozzá az opciókat.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Új szűrő opció
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filters.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Sliders className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Még nincs szűrő.</p>
            <p className="text-sm text-gray-400 mt-2 mb-4">
              A <strong>Kategóriák</strong> oldalon rendeld hozzá a szűrőcsoportokat a kategóriákhoz, majd itt töltsd fel az opciókat.
            </p>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Új szűrő opció
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categoriesWithGroups.map(({ category, groupSlugs }) => {
            const isExpanded = expandedCategoryIds.has(category.id)
            return (
              <Card key={category.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2 font-semibold text-[#1A1A1A]">
                    <FolderTree className="h-5 w-5 text-[#2D7A4F]" />
                    {category.name}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <CardContent className="pt-0 pb-4 px-4 border-t border-gray-100">
                    <div className="space-y-4 mt-4">
                      {groupSlugs.map((groupSlug) => {
                        const items = grouped[groupSlug] ?? []
                        if (items.length === 0) return null
                        return renderGroupCard(groupSlug, items)
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}

          {orphanGroupSlugs.length > 0 && (
            <Card className="overflow-hidden border-amber-200 bg-amber-50/30">
              <button
                type="button"
                onClick={() =>
                  setExpandedCategoryIds((prev) => {
                    const next = new Set(prev)
                    if (next.has('_egyeb')) next.delete('_egyeb')
                    else next.add('_egyeb')
                    return next
                  })
                }
                className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-50/50 transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold text-[#1A1A1A]">
                  <Sliders className="h-5 w-5 text-amber-600" />
                  Egyéb szűrőcsoportok (nincs kategóriához rendelve)
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    expandedCategoryIds.has('_egyeb') ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedCategoryIds.has('_egyeb') && (
                <CardContent className="pt-0 pb-4 px-4 border-t border-amber-100">
                  <div className="space-y-4 mt-4">
                    {orphanGroupSlugs.map((groupSlug) => renderGroupCard(groupSlug, grouped[groupSlug] ?? []))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#1A1A1A]">
                  {modalOpen === 'add' ? (addToGroupSlug ? 'Új opció a csoportba' : 'Új szűrő opció') : 'Szűrő szerkesztése'}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{formError}</p>
                )}
                {modalOpen === 'add' && addToGroupSlug ? (
                  <p className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    Csoport: <strong>{form.group_name || form.group_slug}</strong>
                  </p>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Csoport neve (pl. Szolgáltatások)</label>
                    <input
                      type="text"
                      value={form.group_name}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          group_name: e.target.value,
                          group_slug: slugify(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 outline-none"
                      placeholder="Szolgáltatások"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Szűrő neve (pl. Parkoló)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                        slug: modalOpen === 'add' ? slugify(e.target.value) : prev.slug,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 outline-none"
                    placeholder="Parkoló"
                  />
                  <p className="text-xs text-gray-500 mt-1">A slug automatikusan generálódik a névből.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sorrend</label>
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => setForm((prev) => ({ ...prev, order: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saving} isLoading={saving}>
                    {modalOpen === 'add' ? 'Hozzáadás' : 'Mentés'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
                    Mégse
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
