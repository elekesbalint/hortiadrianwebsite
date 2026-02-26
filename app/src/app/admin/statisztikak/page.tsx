import { useState, useEffect, useMemo } from 'react'
import { getPlaces } from '@/lib/db/places'
import {
  getStatisticsForAdmin,
  type StatsPeriod,
  type StatsResult,
} from '@/app/admin/statisztikak/actions'
import { BarChart3, Download, Mail, Copy, Check } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  day: 'Napi',
  week: 'Heti',
  month: 'Havi',
  year: 'Éves',
}

export default function AdminStatsPage() {
  const [places, setPlaces] = useState<Awaited<ReturnType<typeof getPlaces>>>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<StatsPeriod>('day')
  const [placeId, setPlaceId] = useState<string>('')
  const [statsResult, setStatsResult] = useState<StatsResult | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getPlaces().then(setPlaces).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setStatsLoading(true)
    getStatisticsForAdmin(period, placeId || null)
      .then(setStatsResult)
      .finally(() => setStatsLoading(false))
  }, [period, placeId])

  const stats = useMemo(() => {
    if (places.length === 0)
      return { byCategory: {} as Record<string, number>, avgRating: 0, premiumCount: 0 }
    const byCategory = places.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {})
    const avgRating = places.reduce((s, p) => s + p.rating, 0) / places.length
    const premiumCount = places.filter((p) => p.isPremium).length
    return { byCategory, avgRating, premiumCount }
  }, [places])

  const downloadCsv = () => {
    if (!statsResult) return
    const headers = ['Időszak', 'Oldalmegtekintés', 'Hely megtekintés', 'Hely kattintás', 'Útvonal kattintás']
    const rows = statsResult.byPeriod.map((r) => [
      r.periodLabel,
      r.page_views,
      r.place_views,
      r.place_clicks,
      r.direction_clicks,
    ])
    const totalRow = ['Összesen', statsResult.totals.page_views, statsResult.totals.place_views, statsResult.totals.place_clicks, statsResult.totals.direction_clicks]
    const lines = [headers.join(';'), ...rows.map((r) => r.join(';')), totalRow.join(';')]
    const csv = lines.join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statisztika-${period}-${placeId || 'osszes'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyReportForEmail = () => {
    if (!statsResult) return
    const placeName = placeId && places.find((p) => p.id === placeId)?.name
    let text = `Statisztika – ${PERIOD_LABELS[period]} lebontás\n`
    if (placeName) text += `Hely: ${placeName}\n\n`
    text += `Összesen: oldalmegtekintés ${statsResult.totals.page_views}, hely megtekintés ${statsResult.totals.place_views}, hely kattintás ${statsResult.totals.place_clicks}, útvonal kattintás ${statsResult.totals.direction_clicks}\n\n`
    text += statsResult.byPeriod
      .map((r) => `${r.periodLabel}: megtekintés ${r.place_views}, kattintás ${r.place_clicks}, útvonal ${r.direction_clicks}`)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const selectedPlace = placeId ? places.find((p) => p.id === placeId) : null

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Statisztikák</h1>
          <div className="mt-4">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Statisztikák</h1>
        <p className="text-gray-500 mt-1">Összesítések és megtekintési adatok.</p>
      </div>

      {/* Megtekintések és kattintások */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#2D7A4F]" />
          Megtekintések és kattintások
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Oldalmegtekintések, hely megtekintések, helyre kattintások és útvonal gomb kattintások – időszak és hely szerint.
        </p>
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Időszak:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as StatsPeriod)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D7A4F] focus:border-[#2D7A4F]"
            >
              {(Object.entries(PERIOD_LABELS) as [StatsPeriod, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Hely:</span>
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D7A4F] focus:border-[#2D7A4F] min-w-[200px]"
            >
              <option value="">Összes hely</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!statsResult || statsLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D7A4F] text-white text-sm font-medium hover:bg-[#246b43] disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Letöltés (CSV)
            </button>
            {selectedPlace && (
              <button
                type="button"
                onClick={copyReportForEmail}
                disabled={!statsResult || statsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2D7A4F] text-[#2D7A4F] text-sm font-medium hover:bg-[#2D7A4F]/10 disabled:opacity-50"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Másolva' : 'Másolás (küldés a helynek)'}
              </button>
            )}
          </div>
        </div>

        {statsLoading ? (
          <p className="text-gray-500 py-4">Statisztika betöltése...</p>
        ) : statsResult ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="py-2 pr-4">Időszak</th>
                    <th className="py-2 pr-4 text-right">Oldalmegtekintés</th>
                    <th className="py-2 pr-4 text-right">Hely megtekintés</th>
                    <th className="py-2 pr-4 text-right">Hely kattintás</th>
                    <th className="py-2 pr-4 text-right">Útvonal kattintás</th>
                  </tr>
                </thead>
                <tbody>
                  {statsResult.byPeriod.map((r) => (
                    <tr key={r.periodKey} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium">{r.periodLabel}</td>
                      <td className="py-2 pr-4 text-right">{r.page_views}</td>
                      <td className="py-2 pr-4 text-right">{r.place_views}</td>
                      <td className="py-2 pr-4 text-right">{r.place_clicks}</td>
                      <td className="py-2 pr-4 text-right">{r.direction_clicks}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-semibold">
                    <td className="py-2 pr-4">Összesen</td>
                    <td className="py-2 pr-4 text-right">{statsResult.totals.page_views}</td>
                    <td className="py-2 pr-4 text-right">{statsResult.totals.place_views}</td>
                    <td className="py-2 pr-4 text-right">{statsResult.totals.place_clicks}</td>
                    <td className="py-2 pr-4 text-right">{statsResult.totals.direction_clicks}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {statsResult.byPlace.length > 0 && !placeId && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Helyek szerint (megtekintés / kattintás / útvonal)</h3>
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="py-1 pr-4">Hely</th>
                        <th className="py-1 pr-4 text-right">Megtekintés</th>
                        <th className="py-1 pr-4 text-right">Kattintás</th>
                        <th className="py-1 pr-4 text-right">Útvonal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsResult.byPlace.slice(0, 30).map((p) => (
                        <tr key={p.place_id} className="border-b border-gray-50">
                          <td className="py-1 pr-4">{p.place_name}</td>
                          <td className="py-1 pr-4 text-right">{p.place_views}</td>
                          <td className="py-1 pr-4 text-right">{p.place_clicks}</td>
                          <td className="py-1 pr-4 text-right">{p.direction_clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 space-y-2">
            <p className="text-gray-500">Nincs megtekintési adat az időszakra.</p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Ha az adatbázisban (statistics tábla) vannak sorok, de itt nem jelennek meg, add a <code className="bg-amber-100 px-1 rounded">.env.local</code> fájlhoz a <strong>SUPABASE_SERVICE_ROLE_KEY</strong> értéket (Supabase Dashboard → Project Settings → API → service_role secret), majd indítsd újra a dev szervert.
            </p>
          </div>
        )}
      </div>

      {/* Helyek összesítő (meglévő) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Helyek kategóriánként</h3>
          <ul className="space-y-2">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <li key={cat} className="flex justify-between text-sm">
                <span className="text-gray-700">{cat}</span>
                <span className="font-semibold text-[#2D7A4F]">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Átlag értékelés</h3>
          <p className="text-2xl font-bold text-[#1A1A1A]">{stats.avgRating.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Prémium helyek</h3>
          <p className="text-2xl font-bold text-[#1A1A1A]">{stats.premiumCount}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#2D7A4F]" />
          Helyek kategóriánként (oszlopdiagram)
        </h3>
        {Object.keys(stats.byCategory).length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nincs megjeleníthető adat.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(stats.byCategory).map(([cat, count]) => {
              const max = Math.max(...Object.values(stats.byCategory), 1)
              const width = (count / max) * 100
              return (
                <div key={cat} className="flex items-center gap-4">
                  <span className="w-28 text-sm font-medium text-gray-700 flex-shrink-0">{cat}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-[#2D7A4F] rounded-lg transition-all duration-500 min-w-[2rem] flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(width, count ? 8 : 0)}%` }}
                    >
                      {count > 0 && (
                        <span className="text-xs font-semibold text-white">{count}</span>
                      )}
                    </div>
                  </div>
                  <span className="w-10 text-right text-sm font-semibold text-[#2D7A4F]">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

