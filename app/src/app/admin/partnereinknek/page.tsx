'use client'

import { useState, useEffect, useRef } from 'react'
import { getPartnereinknekPdfUrl, setPartnereinknekPdfUrl } from '@/lib/db/siteDocuments'
import { uploadPartnereinknekPdf } from '@/lib/db/documentUpload'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FileText } from 'lucide-react'

export default function PartnereinknekAdminPage() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getPartnereinknekPdfUrl().then((url) => {
      setCurrentUrl(url)
      setLoading(false)
    })
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Csak PDF fájl tölthető fel.')
      return
    }
    setError(null)
    setSuccess(null)
    setUploading(true)
    const url = await uploadPartnereinknekPdf(file)
    if (!url) {
      setError('A feltöltés sikertelen.')
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    const result = await setPartnereinknekPdfUrl(url)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    if (result.ok) {
      setCurrentUrl(url)
      setSuccess('A Partnereinknek PDF sikeresen feltöltve és mentve.')
    } else {
      setError(result.error)
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
          <FileText className="h-7 w-7 text-[#2D7A4F]" />
          Partnereinknek PDF
        </h1>
        <p className="text-gray-500 mt-1">
          A „Partnereinknek” nyilvános oldalon megjelenő PDF dokumentum. Ha feltöltesz egy új PDF-et, az felváltja a jelenlegit.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {currentUrl && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Jelenlegi dokumentum</p>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2D7A4F] hover:underline"
              >
                PDF megnyitása új lapon
              </a>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Új PDF feltöltése</p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#2D7A4F] file:text-white file:font-medium hover:file:bg-[#256345]"
            />
            {uploading && (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                <LoadingSpinner /> Feltöltés és mentés…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
