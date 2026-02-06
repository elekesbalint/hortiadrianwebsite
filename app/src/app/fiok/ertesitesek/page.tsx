'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/Card'
import { Bell, ExternalLink, Calendar } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const NOTIFICATIONS_READ_AT_KEY = 'programlaz_notifications_read_at'

type SentNotification = {
  id: string
  title: string
  body: string
  url: string | null
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FiokErtesitesekPage() {
  const [list, setList] = useState<SentNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data, error } = await supabase
        .from('sent_notifications')
        .select('id, title, body, url, created_at')
        .order('created_at', { ascending: false })
      if (!mounted) return
      if (error) {
        setList([])
        setLoading(false)
        return
      }
      setList((data ?? []) as SentNotification[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  // Megnyitáskor „megnéztem” – header badge törlése
  useEffect(() => {
    if (typeof window === 'undefined') return
    const now = new Date().toISOString()
    localStorage.setItem(NOTIFICATIONS_READ_AT_KEY, now)
    window.dispatchEvent(new Event('programlaz-notifications-read'))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
          <Bell className="h-7 w-7 text-[#2D7A4F]" />
          Értesítések
        </h1>
        <p className="text-gray-500 mt-1">
          Az admin által küldött push értesítések listája. Ugyanezek megjelennek a böngésző/rendszer értesítésközpontjában is.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Még nem érkezett értesítés. Ha bekapcsoltad a push értesítéseket a Beállításokban, itt és a rendszer értesítésközpontjában is meg fognak jelenni.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {list.map((n) => (
            <li key={n.id}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-[#1A1A1A]">{n.title}</h2>
                      <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{n.body}</p>
                      <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(n.created_at)}
                      </p>
                    </div>
                    {n.url && (
                      <Link
                        href={n.url}
                        className="flex items-center gap-1.5 text-sm font-medium text-[#2D7A4F] hover:underline shrink-0"
                      >
                        Megnyitás
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
