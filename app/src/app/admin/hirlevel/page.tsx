'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Send, Mail, Users, UserMinus } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getNewsletterSubscribers, sendNewsletter, removeNewsletterSubscriber } from './actions'

export default function AdminHirlevelPage() {
  const [emails, setEmails] = useState<string[]>([])
  const [subscribersError, setSubscribersError] = useState('')
  const [subscribersLoading, setSubscribersLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string; sent?: number; failed?: number } | null>(null)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSubscribersLoading(true)
    setSubscribersError('')
    getNewsletterSubscribers().then((res) => {
      if (cancelled) return
      setSubscribersLoading(false)
      if (res.error) setSubscribersError(res.error)
      else setEmails(res.emails)
    })
    return () => { cancelled = true }
  }, [])

  const handleUnsubscribe = async (email: string) => {
    setRemovingEmail(email)
    const res = await removeNewsletterSubscriber(email)
    setRemovingEmail(null)
    if (res.ok) {
      setEmails((prev) => prev.filter((e) => e !== email))
    } else {
      setSubscribersError(res.error ?? 'Leiratkozás sikertelen.')
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setSendLoading(true)
    const res = await sendNewsletter(subject, htmlBody)
    setSendLoading(false)
    setResult({
      ok: res.ok,
      message: res.message,
      sent: res.sent,
      failed: res.failed,
    })
    if (res.ok && res.sent > 0) {
      setSubject('')
      setHtmlBody('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
          <Mail className="h-7 w-7 text-[#2D7A4F]" />
          Hírlevél
        </h1>
        <p className="text-gray-500 mt-1">
          Hírlevél küldése a feliratkozóknak (footer Feliratkozás). E-mail küldéshez Resend API szükséges.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-[#2D7A4F]" />
            Feliratkozók ({emails.length})
          </h2>
          {subscribersLoading && <LoadingSpinner />}
          {subscribersError && <p className="text-red-600 text-sm">{subscribersError}</p>}
          {!subscribersLoading && !subscribersError && emails.length > 0 && (
            <ul className="text-sm text-gray-600 space-y-2 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {emails.map((e) => (
                <li key={e} className="flex items-center justify-between gap-2">
                  <span className="truncate">{e}</span>
                  <button
                    type="button"
                    onClick={() => handleUnsubscribe(e)}
                    disabled={removingEmail === e}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    {removingEmail === e ? '…' : 'Leiratkozás'}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!subscribersLoading && !subscribersError && emails.length === 0 && (
            <p className="text-gray-500 text-sm">Még nincs feliratkozó.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSend} className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="newsletter-subject" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Tárgy
              </label>
              <input
                id="newsletter-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Pl. Hírlevél – Programláz"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20"
              />
            </div>
            <div>
              <label htmlFor="newsletter-body" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Tartalom
              </label>
              <p className="text-gray-500 text-sm mb-2">
                Egyszerű szöveg vagy HTML. A levél automatikusan szép keretben (Programláz fejléc és lábléc) érkezik.
              </p>
              <textarea
                id="newsletter-body"
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                placeholder={'Üdvözöl a Programláz!\n\nÍme a hét újdonságai: felkapott helyek, újdonságok. Nézd meg a térképen!'}
                rows={10}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 text-sm resize-y"
              />
            </div>
            {result && (
              <p className={`text-sm ${result.ok ? 'text-[#2D7A4F]' : 'text-red-600'}`}>
                {result.message}
              </p>
            )}
            <Button
              type="submit"
              size="md"
              isLoading={sendLoading}
              disabled={!htmlBody.trim() || emails.length === 0}
            >
              <Send className="h-4 w-4" />
              Hírlevél küldése
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
