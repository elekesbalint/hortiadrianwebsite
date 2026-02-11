'use client'

import { useState, useEffect } from 'react'
import { getSiteStatisticsForAdmin, updateSiteStatistic, type SiteStatistic } from '@/lib/db/siteStatistics'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Save, Users, Eye } from 'lucide-react'

export default function SiteStatisticsAdminPage() {
  const [stats, setStats] = useState<SiteStatistic[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [values, setValues] = useState<Record<string, number>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSiteStatisticsForAdmin()
      setStats(data)
      const initialValues: Record<string, number> = {}
      const initialLabels: Record<string, string> = {}
      data.forEach((stat) => {
        initialValues[stat.key] = stat.value
        initialLabels[stat.key] = stat.display_label || ''
      })
      setValues(initialValues)
      setLabels(initialLabels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt a statisztikák betöltésekor')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }))
    setError(null)
    setSuccess(null)

    try {
      const result = await updateSiteStatistic(key, values[key], labels[key] || undefined)
      if (result.ok) {
        setSuccess(`A "${key}" statisztika sikeresen frissítve!`)
        setTimeout(() => setSuccess(null), 3000)
        await loadStats() // Újratöltjük az adatokat
      } else {
        setError(result.error || 'Hiba történt a mentés során')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt a mentés során')
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  const getIcon = (key: string) => {
    return key === 'partners' ? Users : Eye
  }

  const getDefaultLabel = (key: string) => {
    return key === 'partners' ? 'Partner' : 'Megtekintés'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Főoldal statisztikák</h1>
        <p className="text-gray-600">
          Itt szerkesztheted a főoldalon megjelenő statisztikákat (partner száma, megtekintések száma).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat) => {
          const Icon = getIcon(stat.key)
          const isSaving = saving[stat.key] || false

          return (
            <div key={stat.key} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                  <Icon className="h-6 w-6 text-[#2D7A4F]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {stat.key === 'partners' ? 'Partner' : 'Megtekintés'}
                  </h3>
                  <p className="text-sm text-gray-500">Kulcs: {stat.key}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor={`value-${stat.key}`} className="block text-sm font-medium text-gray-700 mb-2">
                    Érték
                  </label>
                  <input
                    id={`value-${stat.key}`}
                    type="number"
                    min="0"
                    value={values[stat.key] ?? stat.value}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [stat.key]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ez az érték jelenik meg a számláló animációban a főoldalon.
                  </p>
                </div>

                <div>
                  <label htmlFor={`label-${stat.key}`} className="block text-sm font-medium text-gray-700 mb-2">
                    Megjelenítési címke (opcionális)
                  </label>
                  <input
                    id={`label-${stat.key}`}
                    type="text"
                    value={labels[stat.key] ?? stat.display_label ?? getDefaultLabel(stat.key)}
                    onChange={(e) =>
                      setLabels((prev) => ({
                        ...prev,
                        [stat.key]: e.target.value,
                      }))
                    }
                    placeholder={getDefaultLabel(stat.key)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ha üres, akkor az alapértelmezett címke jelenik meg.
                  </p>
                </div>

                <Button
                  onClick={() => handleSave(stat.key)}
                  disabled={isSaving}
                  className="w-full"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Mentés...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Mentés
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {stats.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl">
          <p className="font-medium">Nincsenek statisztikák</p>
          <p className="text-sm mt-1">
            Futtasd le az adatbázis migrációt, hogy létrejöjjenek az alapértelmezett statisztikák.
          </p>
        </div>
      )}
    </div>
  )
}
