'use client'

import { useMemo, useState, useEffect } from 'react'
import { getSiteStatisticsForAdmin, updateSiteStatistic, type SiteStatistic } from '@/lib/db/siteStatistics'
import { getCategoryViewStats, getPlaceViewStats, type AggregatedCategoryView, type AggregatedPlaceView } from '@/lib/db/viewStats'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { TrendingUp, Download } from 'lucide-react'

type Period = 'day' | 'week' | 'month'
type ViewMode = 'categories' | 'places'

export default function SiteStatisticsAdminPage() {
  const [stats, setStats] = useState<SiteStatistic[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, number>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})

  // Részletes megtekintés statisztikák
  const [viewMode, setViewMode] = useState<ViewMode>('categories')
  const [period, setPeriod] = useState<Period>('day')
  const [rangeDays, setRangeDays] = useState(30)
  const [categoryViews, setCategoryViews] = useState<AggregatedCategoryView[]>([])
  const [placeViews, setPlaceViews] = useState<AggregatedPlaceView[]>([])
  const [loadingViews, setLoadingViews] = useState(false)

  useEffect(() => {
    getSiteStatisticsForAdmin().then((data) => {
      setStats(data)
      const v: Record<string, number> = {}
      const l: Record<string, string> = {}
      data.forEach((s) => {
        v[s.key] = s.value
        l[s.key] = s.display_label ?? ''
      })
      setValues(v)
      setLabels(l)
      setLoading(false)
    })
  }, [])

  // Részletes statisztikák betöltése (napi sorok, utolsó rangeDays nap)
  useEffect(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - rangeDays + 1)
    const toStr = to.toISOString().slice(0, 10)
    const fromStr = from.toISOString().slice(0, 10)

    setLoadingViews(true)
    Promise.all([getCategoryViewStats(fromStr, toStr), getPlaceViewStats(fromStr, toStr)])
      .then(([cats, places]) => {
        setCategoryViews(cats)
        setPlaceViews(places)
      })
      .finally(() => setLoadingViews(false))
  }, [rangeDays])

  const handleSave = async (key: string) => {
    setSaving(key)
    setSuccess(null)
    const result = await updateSiteStatistic(key, values[key], labels[key] || undefined)
    setSaving(null)
    if (result.ok) {
      setSuccess(`A "${key === 'partners' ? 'Partner' : 'Megtekintés'}" érték mentve!`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  // Aggregálás napi/heti/havi bontásra
  const groupedCategoryViews = useMemo(() => {
    const map = new Map<string, { label: string; period: string; views: number }>()
    const rows = categoryViews
    rows.forEach((row) => {
      const d = new Date(row.date)
      let periodKey: string
      if (period === 'day') {
        periodKey = d.toISOString().slice(0, 10)
      } else if (period === 'week') {
        const firstJan = new Date(d.getFullYear(), 0, 1)
        const week = Math.ceil((((d.getTime() - firstJan.getTime()) / 86400000) + firstJan.getDay() + 1) / 7)
        periodKey = `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`
      } else {
        periodKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
      }
      const key = `${row.category_id}-${periodKey}`
      const current = map.get(key)
      if (current) {
        current.views += row.views
      } else {
        map.set(key, { label: row.name || 'Ismeretlen kategória', period: periodKey, views: row.views })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.views - a.views)
  }, [categoryViews, period])

  const groupedPlaceViews = useMemo(() => {
    const map = new Map<string, { label: string; period: string; views: number }>()
    const rows = placeViews
    rows.forEach((row) => {
      const d = new Date(row.date)
      let periodKey: string
      if (period === 'day') {
        periodKey = d.toISOString().slice(0, 10)
      } else if (period === 'week') {
        const firstJan = new Date(d.getFullYear(), 0, 1)
        const week = Math.ceil((((d.getTime() - firstJan.getTime()) / 86400000) + firstJan.getDay() + 1) / 7)
        periodKey = `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`
      } else {
        periodKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
      }
      const key = `${row.place_id}-${periodKey}`
      const current = map.get(key)
      if (current) {
        current.views += row.views
      } else {
        const labelBase = row.name || 'Ismeretlen hely'
        const label = row.category_name ? `${labelBase} (${row.category_name})` : labelBase
        map.set(key, { label, period: periodKey, views: row.views })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.views - a.views)
  }, [placeViews, period])

  const currentRows = viewMode === 'categories' ? groupedCategoryViews : groupedPlaceViews

  const handleExportCsv = () => {
    if (currentRows.length === 0) return
    const header = 'Típus;Név;Periódus;Megtekintések\n'
    const typeLabel = viewMode === 'categories' ? 'Kategória' : 'Hely'
    const lines = currentRows.map((row) => {
      const safeLabel = row.label.replace(/"/g, '""')
      return `${typeLabel};"${safeLabel}";${row.period};${row.views}`
    })
    const csv = header + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statisztikak_${viewMode}_${period}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-[#2D7A4F]" />
          Főoldal statisztikák
        </h1>
        <p className="text-gray-500 mt-1">
          A főoldal „Csatlakozz közösségünkhöz” szekciójában megjelenő számok (Partner, Megtekintés). A megtekintés általában 100K+, a partner 2K+ formátumban jelenik meg.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {stats.map((stat) => (
            <div key={stat.key} className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {stat.key === 'partners' ? 'Partner' : 'Megtekintés'} – érték (szám)
                </label>
                <input
                  type="number"
                  min={0}
                  value={values[stat.key] ?? 0}
                  onChange={(e) => setValues((v) => ({ ...v, [stat.key]: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full max-w-[200px] px-4 py-2 border border-gray-200 rounded-xl focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Megjelenő címke (opcionális)</label>
                <input
                  type="text"
                  value={labels[stat.key] ?? ''}
                  onChange={(e) => setLabels((l) => ({ ...l, [stat.key]: e.target.value }))}
                  placeholder={stat.key === 'partners' ? 'Partner' : 'Megtekintés'}
                  className="w-full max-w-[200px] px-4 py-2 border border-gray-200 rounded-xl focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20"
                />
              </div>
              <Button
                variant="primary"
                onClick={() => handleSave(stat.key)}
                disabled={saving === stat.key}
                className="self-start"
              >
                {saving === stat.key ? <LoadingSpinner /> : 'Mentés'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Részletes megtekintés statisztikák */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Kattintás statisztikák (kategóriák és helyek)</h2>
            <p className="text-xs text-gray-500 mt-1">
              Napi aggregáció az utolsó {rangeDays} napra. A heti/havi nézet ezekből kerül összesítésre.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${viewMode === 'categories' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-gray-500'}`}
                onClick={() => setViewMode('categories')}
              >
                Kategóriák
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${viewMode === 'places' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-gray-500'}`}
                onClick={() => setViewMode('places')}
              >
                Helyek
              </button>
            </div>
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${period === 'day' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-gray-500'}`}
                onClick={() => setPeriod('day')}
              >
                Napi
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${period === 'week' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-gray-500'}`}
                onClick={() => setPeriod('week')}
              >
                Heti
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${period === 'month' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-gray-500'}`}
                onClick={() => setPeriod('month')}
              >
                Havi
              </button>
            </div>
            <select
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value) || 30)}
            >
              <option value={7}>Utolsó 7 nap</option>
              <option value={30}>Utolsó 30 nap</option>
              <option value={90}>Utolsó 90 nap</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={currentRows.length === 0 || loadingViews}>
              <Download className="h-4 w-4 mr-1" />
              CSV export
            </Button>
          </div>
        </div>

        {loadingViews ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : currentRows.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Még nincs elérhető megtekintés statisztika az adott időszakra.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Név</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Periódus</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Megtekintések</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, idx) => (
                  <tr key={`${row.label}-${row.period}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-2 text-gray-800">{row.label}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{row.period}</td>
                    <td className="px-4 py-2 text-right font-semibold text-[#2D7A4F]">{row.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
