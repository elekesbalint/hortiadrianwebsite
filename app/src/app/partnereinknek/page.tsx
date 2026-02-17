import { getPartnereinknekPdfUrl } from '@/lib/db/siteDocuments'
import Link from 'next/link'

export const metadata = {
  title: 'Partnereinknek',
  description: 'Dokumentum partnereink számára.',
}

export default async function PartnereinknekPage() {
  const pdfUrl = await getPartnereinknekPdfUrl()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-6">
          Partnereinknek
        </h1>
        {pdfUrl ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <iframe
              src={`${pdfUrl}#toolbar=1`}
              title="Partnereinknek dokumentum"
              className="w-full aspect-[3/4] min-h-[70vh] border-0"
            />
            <p className="p-4 text-sm text-gray-500 border-t border-gray-100">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2D7A4F] hover:underline"
              >
                PDF megnyitása új lapon
              </a>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">
              A Partnereinknek dokumentum hamarosan elérhető.
            </p>
            <Link
              href="/"
              className="text-[#2D7A4F] hover:underline font-medium"
            >
              Vissza a főoldalra
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
