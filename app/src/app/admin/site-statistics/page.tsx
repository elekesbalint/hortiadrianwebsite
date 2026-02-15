'use client'

import { useState, useEffect } from 'react'
import { getSiteStatisticsForAdmin, updateSiteStatistic, type SiteStatistic } from '@/lib/db/siteStatistics'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { TrendingUp } from 'lucide-react'

export default function SiteStatisticsAdminPage() {
  const [stats, setStats] = useState<SiteStatistic[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, number>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})

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
    </div>
  )
}
