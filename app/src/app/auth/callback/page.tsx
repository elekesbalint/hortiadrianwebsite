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
    const next = searchParams.get('next')
    const redirectTo = next && next.startsWith('/') ? next : '/'

    if (!code) {
      setStatus('error')
      setMessage('Hiányzó hitelesítési kód. Próbáld újra a bejelentkezést.')
      return
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(() => {
        setStatus('ok')
        window.location.replace(redirectTo)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.message || 'A bejelentkezés sikertelen. Próbáld újra.')
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
