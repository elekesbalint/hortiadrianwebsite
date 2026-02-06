'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next')
    const redirectTo = next && next.startsWith('/') ? next : '/'
    const hasHash = typeof window !== 'undefined' && window.location.hash?.length > 0

    const doRedirect = () => {
      setStatus('ok')
      window.location.replace(redirectTo)
    }

    // PKCE: code a query-ben (bejelentkezés, regisztráció)
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(doRedirect)
        .catch((err) => {
          setStatus('error')
          setMessage(err?.message || 'A bejelentkezés sikertelen. Próbáld újra.')
        })
      return
    }

    // token_hash + type (pl. e-mail változtatás, jelszó reset): verifyOtp kell, ez frissíti a sessiont
    if (tokenHash && type) {
      const otpType = type === 'recovery' ? 'recovery' : type === 'email_change' ? 'email_change' : (type as 'email' | 'magiclink' | 'signup')
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: otpType })
        .then(({ error }) => {
          if (error) {
            setStatus('error')
            setMessage(error.message || 'A megerősítés sikertelen. Próbáld újra.')
            return
          }
          doRedirect()
        })
        .catch((err) => {
          setStatus('error')
          setMessage(err?.message || 'A megerősítés sikertelen. Próbáld újra.')
        })
      return
    }

    // Hash-ben jön a token (implicit flow): a Supabase kliens automatikusan feldolgozza
    if (hasHash) {
      const t = setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            doRedirect()
          } else {
            setStatus('error')
            setMessage('A munkamenet lejárt vagy érvénytelen. Próbáld újra.')
          }
        })
      }, 500)
      return () => clearTimeout(t)
    }

    // Nincs code/token_hash/hash: pl. Supabase már a saját /verify oldalán érvényesítette (e-mail változtatás)
    // és ide redirectelt. Session frissítése a szerverről lehúzza az új user adatot (új e-mail).
    supabase.auth
      .refreshSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          setStatus('error')
          setMessage(error.message || 'Hiányzó hitelesítési kód. Próbáld újra a bejelentkezést.')
          return
        }
        if (session) {
          doRedirect()
        } else {
          setStatus('error')
          setMessage('Hiányzó hitelesítési kód. Próbáld újra a bejelentkezést.')
        }
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.message || 'Hiányzó hitelesítési kód. Próbáld újra a bejelentkezést.')
      })
  }, [searchParams])

  if (status === 'loading') {
    return <LoadingSpinner variant="centered" label="Bejelentkezés folyamatban…" />
  }

  if (status === 'error') {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#F8FAF8] px-4 gap-4">
        <p className="text-red-600 text-center max-w-sm">{message}</p>
        <a
          href="/bejelentkezes"
          className="text-[#2D7A4F] font-medium hover:underline"
        >
          Vissza a bejelentkezéshez
        </a>
      </div>
    )
  }

  return <LoadingSpinner variant="centered" label="Átirányítás…" />
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner variant="centered" />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
