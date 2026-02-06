'use client'

import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'

const inputClass =
  'w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all placeholder:text-gray-400'

type EnrollData = { factorId: string; qrCode: string; secret: string }

export default function AdminBiztonsagPage() {
  const [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verifying, setVerifying] = useState(false)

  const loadFactors = async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.auth.mfa.listFactors()
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setFactors(data?.totp ?? [])
  }

  useEffect(() => {
    loadFactors()
  }, [])

  const handleCreateNewKey = async () => {
    setError('')
    setSuccess('')
    setEnrollData(null)
    setCreating(true)
    const { data: listData } = await supabase.auth.mfa.listFactors()
    const totpFactors = listData?.totp ?? []
    for (const f of totpFactors) {
      await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
    const { data: enrollRes, error: enrollErr } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Admin',
    })
    setCreating(false)
    if (enrollErr) {
      setError(enrollErr.message)
      return
    }
    if (enrollRes?.id && enrollRes?.totp?.qr_code && enrollRes?.totp?.secret) {
      setEnrollData({
        factorId: enrollRes.id,
        qrCode: enrollRes.totp.qr_code,
        secret: enrollRes.totp.secret,
      })
      setCode('')
    }
  }

  const handleVerifyNewKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollData) return
    setError('')
    setVerifying(true)
    const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollData.factorId,
      code: code.trim(),
    })
    setVerifying(false)
    if (verifyErr) {
      setError(verifyErr.message || 'Hibás kód.')
      return
    }
    setSuccess('Az új 2FA kulcs sikeresen aktiválva.')
    setEnrollData(null)
    setCode('')
    loadFactors()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
        <Shield className="h-7 w-7 text-[#2D7A4F]" />
        Biztonság (2FA)
      </h1>
      <p className="text-[#6B7280] mt-1 text-sm">
        Kétlépcsős hitelesítés beállítása ehhez a fiókhoz. Csak az admin fiók érheti el ezt az oldalt.
      </p>

      {loading ? (
        <div className="mt-6">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {success && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {factors.length > 0 && !enrollData && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-[#1A1A1A] font-medium mb-2">Aktív 2FA</p>
              <p className="text-sm text-[#6B7280] mb-4">
                Jelenleg {factors.length} autentikátor van regisztrálva. Új kulcs létrehozásakor a régit töröljük, és csak az új lesz érvényes.
              </p>
              <button
                type="button"
                onClick={handleCreateNewKey}
                disabled={creating}
                className="px-4 py-2.5 bg-[#2D7A4F] hover:bg-[#1B5E20] text-white font-medium rounded-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Létrehozás...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Új 2FA kulcs létrehozása
                  </>
                )}
              </button>
            </div>
          )}

          {factors.length === 0 && !enrollData && !creating && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-[#6B7280] text-sm">
                Jelenleg nincs 2FA kulcs. Az admin belépéskor a bejelentkezés után kell beállítani a kétlépcsős hitelesítést.
              </p>
              <button
                type="button"
                onClick={handleCreateNewKey}
                disabled={creating}
                className="mt-4 px-4 py-2.5 bg-[#2D7A4F] hover:bg-[#1B5E20] text-white font-medium rounded-xl disabled:opacity-70 flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Létrehozás...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Első 2FA kulcs létrehozása
                  </>
                )}
              </button>
            </div>
          )}

          {enrollData && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <p className="text-[#1A1A1A] font-medium">Új 2FA kulcs</p>
              <p className="text-sm text-[#6B7280]">
                Olvasd be a QR kódot az autentikátor alkalmazásoddal (pl. Google Authenticator, Authy), majd add meg az első 6 számjegyű kódot.
              </p>
              <div className="flex justify-center">
                <img src={enrollData.qrCode} alt="TOTP QR kód" className="w-48 h-48 rounded-lg border border-gray-200" />
              </div>
              <p className="text-xs text-[#6B7280] break-all font-mono bg-gray-50 p-2 rounded">
                Ha nem tudod beolvasni: {enrollData.secret}
              </p>
              <form onSubmit={handleVerifyNewKey} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className={inputClass}
                  autoComplete="one-time-code"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={verifying || code.length !== 6}
                    className="px-4 py-2.5 bg-[#2D7A4F] hover:bg-[#1B5E20] text-white font-medium rounded-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Ellenőrzés...
                      </>
                    ) : (
                      'Megerősítés'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollData(null)
                      setCode('')
                      setError('')
                      loadFactors()
                    }}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
                  >
                    Mégse
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
