'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User, Mail, AtSign, Pencil } from 'lucide-react'

const inputClass =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all'

export default function FiokProfilPage() {
  const { user } = useAuth()
  const [editName, setEditName] = useState(false)
  const [nameValue, setNameValue] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Felhasználó'
  const username = user?.email?.split('@')[0] ?? '–'

  const handleSaveName = async () => {
    setMessage(null)
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: nameValue.trim() || undefined } })
    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    setMessage({ type: 'success', text: 'A név mentve.' })
    setEditName(false)
  }

  const startEditName = () => {
    setNameValue(user?.name ?? '')
    setEditName(true)
    setMessage(null)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Profil</h1>
        <p className="text-gray-500 mt-1">Személyes adataid áttekintése és szerkesztése.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <span className="text-2xl font-bold text-[#2D7A4F]">
                {(displayName || user?.email || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">{displayName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <dl className="space-y-4">
            <div className="flex items-center gap-4 py-3 border-b border-gray-100">
              <User className="h-5 w-5 text-[#2D7A4F] flex-shrink-0" />
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500">Név</dt>
                {editName ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      placeholder="Megjelenített név"
                      className={inputClass}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveName} disabled={saving} isLoading={saving}>
                        Mentés
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditName(false)} disabled={saving}>
                        Mégse
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <dd className="text-gray-900 font-medium">{user?.name || '–'}</dd>
                    <button
                      type="button"
                      onClick={startEditName}
                      className="mt-1 flex items-center gap-1.5 text-sm text-[#2D7A4F] hover:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Név szerkesztése
                    </button>
                  </>
                )}
                {message && (
                  <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-[#2D7A4F]' : 'text-red-600'}`}>
                    {message.text}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 py-3 border-b border-gray-100">
              <AtSign className="h-5 w-5 text-[#2D7A4F] flex-shrink-0" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Felhasználónév</dt>
                <dd className="text-gray-900 font-medium">{username}</dd>
              </div>
            </div>
            <div className="flex items-center gap-4 py-3 border-b border-gray-100">
              <Mail className="h-5 w-5 text-[#2D7A4F] flex-shrink-0" />
              <div>
                <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                <dd className="text-gray-900 font-medium">{user?.email || '–'}</dd>
              </div>
            </div>
          </dl>

          <p className="text-sm text-gray-500">
            Az e-mail módosítása a Beállítások fülön érhető el.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
