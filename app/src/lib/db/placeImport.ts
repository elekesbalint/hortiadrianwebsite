'use server'

import * as XLSX from 'xlsx'
import { getCategories } from '@/lib/db/categories'
import { insertPlace } from '@/lib/db/places'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop'

export type ImportResult = { ok: true; imported: number; skipped: number; errors: string[] } | { ok: false; error: string }

/** Oszlop keresés: első sor kulcsai közül melyik illik a név / email mezőre */
function findColumnKey(keys: string[], patterns: RegExp[]): string | null {
  const normalized = keys.map((k) => (k ?? '').toString().trim().toLowerCase())
  for (const pattern of patterns) {
    const i = normalized.findIndex((n) => pattern.test(n))
    if (i >= 0) return keys[i] ?? null
  }
  return null
}

/** Excel fájl feldolgozása: Név + opcionális E-mail, kategória = Éttermek, cím üres. */
export async function importPlacesFromExcel(formData: FormData): Promise<ImportResult> {
  const file = formData.get('file') as File | null
  if (!file || !(file instanceof File)) {
    return { ok: false, error: 'Nincs fájl kiválasztva.' }
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch (e) {
    return { ok: false, error: 'Az Excel fájl nem olvasható. Használj .xlsx vagy .xls formátumot.' }
  }
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { ok: false, error: 'Az Excel fájlban nincs munkalap.' }
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  if (!rows.length) return { ok: false, error: 'Az első munkalapon nincs adatsor.' }

  const keys = Object.keys(rows[0] ?? {})
  const nameKey = findColumnKey(keys, [/^név$/, /^name$/, /vendéglátó.*név|név.*vendéglátó/i, /egység.*név|név.*egység/i, /cég neve/i])
  if (!nameKey) {
    return { ok: false, error: 'Nem található „Név” oszlop. Az első sorban legyen „Név” vagy „Name” oszlop.' }
  }
  const emailKey = findColumnKey(keys, [/^e-?mail$/i, /e-mail.*kapcsolat|kapcsolat.*e-?mail/i])

  const categories = await getCategories()
  const etterem = categories.find((c) => c.slug === 'ettermek' || c.slug === 'éttermek' || c.name.toLowerCase().includes('étterem'))
  if (!etterem) {
    return { ok: false, error: 'Nem található „Éttermek” kategória az adatbázisban.' }
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? {}
    const name = (row[nameKey] ?? '').toString().trim()
    if (!name) {
      skipped++
      continue
    }
    const emailRaw = emailKey ? (row[emailKey] ?? '').toString().trim() : ''
    const email = emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null

    const result = await insertPlace({
      name,
      category_id: etterem.id,
      description: '',
      address: '',
      rating: 4,
      ratingCount: 0,
      isOpen: true,
      isPremium: false,
      priceLevel: 2,
      lat: 47.4979,
      lng: 19.0402,
      imageUrl: DEFAULT_IMAGE,
      menuUrl: null,
      priceUrl: null,
      bookingUrl: null,
      website: null,
      instagram: null,
      facebook: null,
      youtube: null,
      tiktok: null,
      email,
    })

    if ('error' in result) {
      errors.push(`${name}: ${result.error}`)
    } else {
      imported++
    }
  }

  return { ok: true, imported, skipped, errors }
}
