'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, Eye, EyeOff, LogOut, Bell, MailMinus } from 'lucide-react'
import {
  isPushSupported,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeForPush,
} from '@/lib/push'

const inputClass =
  'w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all'

export default function FiokBeallitasokPage() {
  const { user, signOut } = useAuth()
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushMessage, setPushMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [newsletterUnsubLoading, setNewsletterUnsubLoading] = useState(false)
  const [newsletterUnsubMessage, setNewsletterUnsubMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const ok = await isPushSupported()
      if (!mounted) return
      setPushSupported(ok)
      if (!ok || !user?.id) return
      const { data } = await supabase.from('push_subscriptions').select('id').limit(1).maybeSingle()
      if (mounted) setPushEnabled(!!data)
    })()
    return () => { mounted = false }
  }, [user?.id])

  const handlePushToggle = async (enable: boolean) => {
    setPushMessage(null)
    if (!user?.id) return
    setPushLoading(true)
    if (enable) {
      const perm = await requestNotificationPermission()
      if (perm !== 'granted') {
        setPushMessage({ type: 'error', text: 'Az értesítések engedélyezése szükséges a böngészőben.' })
        setPushLoading(false)
        return
      }
      const reg = await registerServiceWorker()
      if (!reg) {
        setPushMessage({ type: 'error', text: 'Service worker regisztráció sikertelen.' })
        setPushLoading(false)
        return
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setPushMessage({ type: 'error', text: 'Push konfiguráció hiányzik (VAPID).' })
        setPushLoading(false)
        return
      }
      const sub = await subscribeForPush(reg, vapidKey)
      if (!sub) {
        setPushMessage({ type: 'error', text: 'Feliratkozás sikertelen.' })
        setPushLoading(false)
        return
      }
      // @ts-expect-error Supabase generated types may not include push_subscriptions Insert
      const { error } = await supabase.from('push_subscriptions').upsert(
        { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        { onConflict: 'endpoint' }
      )
      if (error) {
        setPushMessage({ type: 'error', text: error.message })
        setPushLoading(false)
        return
      }
      setPushEnabled(true)
      setPushMessage({ type: 'success', text: 'Push értesítések bekapcsolva.' })
    } else {
      const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
      if (error) {
        setPushMessage({ type: 'error', text: error.message })
        setPushLoading(false)
        return
      }
      setPushEnabled(false)
      setPushMessage({ type: 'success', text: 'Push értesítések kikapcsolva.' })
    }
    setPushLoading(false)
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMessage(null)
    if (!newEmail.trim()) return
    setEmailLoading(true)
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?next=/fiok/beallitasok` : undefined
    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo: redirectTo }
    )
    setEmailLoading(false)
    if (error) {
      setEmailMessage({ type: 'error', text: error.message })
      return
    }
    setEmailMessage({ type: 'success', text: 'Ellenőrizd az új e-mail címedet – megerősítő linket küldtünk.' })
    setNewEmail('')
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'A jelszónak legalább 8 karakter hosszúnak kell lennie.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'A két jelszó nem egyezik.' })
      return
    }
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) {
      setPasswordMessage({ type: 'error', text: error.message })
      return
    }
    setPasswordMessage({ type: 'success', text: 'A jelszavad frissítve.' })
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleNewsletterUnsubscribe = async () => {
    if (!user?.email) return
    setNewsletterUnsubMessage(null)
    setNewsletterUnsubLoading(true)
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('email', user.email)
      .select('email')
    setNewsletterUnsubLoading(false)
    if (error) {
      setNewsletterUnsubMessage({ type: 'error', text: error.message })
      return
    }
    if (data && data.length > 0) {
      setNewsletterUnsubMessage({ type: 'success', text: 'Sikeresen leiratkoztál a hírlevélről.' })
    } else {
      setNewsletterUnsubMessage({ type: 'error', text: 'Nem sikerült a leiratkozás (pl. nem voltál feliratkozva, vagy a munkamenet lejárt – próbáld újra bejelentkezés után).' })
    }
  }

  const handleLogout = async () => {
    await signOut()
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Beállítások</h1>
        <p className="text-gray-500 mt-1">E-mail, jelszó és kijelentkezés.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#2D7A4F]" />
              E-mail frissítése
            </h2>
            <p className="text-sm text-gray-500 mb-3">Jelenlegi e-mail: <strong>{user?.email}</strong></p>
            <form onSubmit={handleEmailUpdate} className="space-y-3 max-w-md">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Új e-mail cím"
                  className={inputClass}
                  required
                  autoComplete="email"
                />
              </div>
              {emailMessage && (
                <p className={`text-sm ${emailMessage.type === 'success' ? 'text-[#2D7A4F]' : 'text-red-600'}`}>
                  {emailMessage.text}
                </p>
              )}
              <Button type="submit" size="md" isLoading={emailLoading} disabled={!newEmail.trim()}>
                E-mail mentése
              </Button>
            </form>
          </section>

          <hr className="border-gray-100" />

          {pushSupported && (
            <>
              <section>
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#2D7A4F]" />
                  Push értesítések
                </h2>
                <p className="text-sm text-gray-500 mb-3">
                  Kapj értesítést pl. felkapott helyekről vagy újdonságokról.
                </p>
                {pushMessage && (
                  <p className={`text-sm mb-3 ${pushMessage.type === 'success' ? 'text-[#2D7A4F]' : 'text-red-600'}`}>
                    {pushMessage.text}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="md"
                    variant={pushEnabled ? 'outline' : 'primary'}
                    isLoading={pushLoading}
                    disabled={pushLoading}
                    onClick={() => handlePushToggle(!pushEnabled)}
                  >
                    {pushEnabled ? 'Push kikapcsolása' : 'Push bekapcsolása'}
                  </Button>
                  {pushEnabled && (
                    <span className="text-sm text-[#2D7A4F]">Értesítések bekapcsolva</span>
                  )}
                </div>
              </section>
              <hr className="border-gray-100" />
            </>
          )}

          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <MailMinus className="h-5 w-5 text-[#2D7A4F]" />
              Hírlevél
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Nem szeretnél több hírlevelet kapni? Leiratkozhatsz egy kattintással.
            </p>
            {newsletterUnsubMessage && (
              <p className={`text-sm mb-2 ${newsletterUnsubMessage.type === 'success' ? 'text-[#2D7A4F]' : 'text-red-600'}`}>
                {newsletterUnsubMessage.text}
              </p>
            )}
            <button
              type="button"
              onClick={handleNewsletterUnsubscribe}
              disabled={newsletterUnsubLoading}
              className="text-sm text-gray-500 hover:text-[#2D7A4F] underline underline-offset-2 transition-colors disabled:opacity-50"
            >
              {newsletterUnsubLoading ? 'Folyamatban…' : 'Leiratkozás a hírlevélről'}
            </button>
          </section>

          <hr className="border-gray-100" />

          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#2D7A4F]" />
              Jelszó frissítése
            </h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-3 max-w-md">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Új jelszó (min. 8 karakter)"
                  className={inputClass}
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D7A4F]"
                  aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Új jelszó megerősítése"
                  className={inputClass}
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {passwordMessage && (
                <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-[#2D7A4F]' : 'text-red-600'}`}>
                  {passwordMessage.text}
                </p>
              )}
              <Button type="submit" size="md" isLoading={passwordLoading} disabled={!newPassword || !confirmPassword}>
                Jelszó mentése
              </Button>
            </form>
          </section>

          <hr className="border-gray-100" />

          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <LogOut className="h-5 w-5 text-[#2D7A4F]" />
              Kijelentkezés
            </h2>
            <p className="text-sm text-gray-500 mb-3">Kilépés a fiókodból ezen az eszközön.</p>
            <Button variant="outline" size="md" onClick={handleLogout} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
              <LogOut className="h-4 w-4" />
              Kijelentkezés
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
