'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Send, Bell } from 'lucide-react'
import { sendPushToAll } from './actions'

export default function AdminErtesitesekPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setLoading(true)
    const res = await sendPushToAll(title || 'Programláz', body, url || undefined)
    setLoading(false)
    setResult({ ok: res.ok, message: res.message })
    if (res.ok && res.sent > 0) {
      setTitle('')
      setBody('')
      setUrl('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
          <Bell className="h-7 w-7 text-[#2D7A4F]" />
          Push értesítések
        </h1>
        <p className="text-gray-500 mt-1">
          Értesítés küldése minden feliratkozónak (pl. felkapott helyek, újdonságok).
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSend} className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="push-title" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Cím
              </label>
              <input
                id="push-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pl. Új felkapott helyek"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20"
              />
            </div>
            <div>
              <label htmlFor="push-body" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Szöveg
              </label>
              <textarea
                id="push-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Pl. Nézd meg a héten felkapott helyeket a térképen."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 resize-none"
              />
            </div>
            <div>
              <label htmlFor="push-url" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Link (opcionális)
              </label>
              <input
                id="push-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/ vagy /terkep, /hely/xyz"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20"
              />
            </div>
            {result && (
              <p
                className={`text-sm ${result.ok ? 'text-[#2D7A4F]' : 'text-red-600'}`}
              >
                {result.message}
              </p>
            )}
            <Button type="submit" size="md" isLoading={loading} disabled={!body.trim()}>
              <Send className="h-4 w-4" />
              Értesítés küldése
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
