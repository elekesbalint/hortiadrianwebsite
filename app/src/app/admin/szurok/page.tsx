'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
  getFilters,
  insertFilter,
  updateFilter,
  deleteFilter,
  type AppFilter,
} from '@/lib/db/filters'
import { Sliders, Plus, Pencil, Trash2, X } from 'lucide-react'
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

export default function AdminFiltersPage() {
  const [filters, setFilters] = useState<AppFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState<'add' | 'edit' | null>(null)
  const [editingFilter, setEditingFilter] = useState<AppFilter | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({
    group_name: '',
    group_slug: '', // Automatikusan generálódik
    name: '',
    slug: '', // Automatikusan generálódik
    order: 0,
  })
  const [formError, setFormError] = useState('')

  const load = async () => {
    setLoading(true)
    const list = await getFilters()
    setFilters(list)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const grouped = filters.reduce<Record<string, AppFilter[]>>((acc, f) => {
    const key = f.group_slug || 'egyeb'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})

  const openAdd = () => {
    setForm({ group_name: '', group_slug: '', name: '', slug: '', order: 0 })
    setEditingFilter(null)
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
    setFormError('')
    setModalOpen('edit')
  }

  const closeModal = () => {
    setModalOpen(null)
    setEditingFilter(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    // Slug automatikus generálás, ha üres
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Szűrők</h1>
          <p className="text-gray-500 mt-1">Szűrő csoportok és opciók (pl. Szolgáltatások: Parkoló, Állatbarát).</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Új szűrő
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filters.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Sliders className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Még nincs szűrő.</p>
            <p className="text-sm text-gray-400 mt-2 mb-4">Adj hozzá szűrő csoportokat és opciókat.</p>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Új szűrő
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupSlug, items]) => (
            <Card key={groupSlug}>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                  {items[0]?.group_name || groupSlug}
                </h2>
                <ul className="space-y-2">
                  {items.map((f) => (
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
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#1A1A1A]">
                  {modalOpen === 'add' ? 'Új szűrő' : 'Szűrő szerkesztése'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Csoport neve (pl. Szolgáltatások)</label>
                  <input
                    type="text"
                    value={form.group_name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        group_name: e.target.value,
                        group_slug: slugify(e.target.value), // Automatikusan generálódik
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 outline-none"
                    placeholder="Szolgáltatások"
                  />
                </div>
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
