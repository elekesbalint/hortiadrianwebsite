import { NextResponse } from 'next/server'

const IRSZ_HNK_JSON_URL = 'https://cdn.jsdelivr.net/gh/ferenci-tamas/IrszHnk@master/IrszHnk.json'

/** Tartalék lista: gyakori magyar települések (ha a külső API nem érhető el) */
const FALLBACK_TELEPULESEK: string[] = [
  'Abádszalók', 'Abony', 'Ács', 'Adony', 'Ajka', 'Albertirsa', 'Aszód', 'Bácsalmás', 'Baja', 'Baktalórántháza',
  'Balassagyarmat', 'Balatonalmádi', 'Balatonfüred', 'Balatonfűzfő', 'Barcs', 'Békéscsaba', 'Békés', 'Bélapátfalva',
  'Berettyóújfalu', 'Bicske', 'Bonyhád', 'Budapest', 'Budaörs', 'Bugac', 'Cegléd', 'Celldömölk', 'Cigánd',
  'Csenger', 'Csongrád', 'Csorna', 'Dabas', 'Debrecen', 'Demecser', 'Derecske', 'Dévaványa', 'Dombóvár',
  'Dunaföldvár', 'Dunaharaszti', 'Dunaújváros', 'Dunavarsány', 'Eger', 'Érd', 'Esztergom', 'Fonyód', 'Füzesabony',
  'Gárdony', 'Gödöllő', 'Gyula', 'Gyöngyös', 'Győr', 'Hajdúböszörmény', 'Hajdúhadház', 'Hajdúnánás', 'Hajdúszoboszló',
  'Hajós', 'Hatvan', 'Herend', 'Hódmezővásárhely', 'Ibrány', 'Jászberény', 'Jászapáti', 'Kalocsa', 'Kaposvár',
  'Kapuvár', 'Karcag', 'Kazincbarcika', 'Kecskemét', 'Kemecse', 'Keszthely', 'Kisbér', 'Kiskunfélegyháza',
  'Kiskunhalas', 'Kiskunmajsa', 'Kistelek', 'Kisvárda', 'Komárom', 'Komló', 'Körmend', 'Körösladány', 'Kőszeg',
  'Kunhegyes', 'Kunszentmárton', 'Kunszentmiklós', 'Lenti', 'Lőrinci', 'Makó', 'Marcali', 'Mátészalka', 'Mélykút',
  'Mezőkövesd', 'Mezőtúr', 'Mindszent', 'Miskolc', 'Mohács', 'Monor', 'Mór', 'Nagyatád', 'Nagykálló', 'Nagykanizsa',
  'Nagykőrös', 'Nyíradony', 'Nyíregyháza', 'Orosháza', 'Örkény', 'Paks', 'Pánd', 'Pápa', 'Pécs', 'Pécsvárad',
  'Pétervására', 'Pilisvörösvár', 'Polgárdi', 'Putnok', 'Ráckeve', 'Sárbogárd', 'Sárvár', 'Sátoraljaújhely',
  'Siófok', 'Sopron', 'Sümeg', 'Szabadszállás', 'Szécsény', 'Szekszárd', 'Szentes', 'Szentendre', 'Szigetszentmiklós',
  'Szigetvár', 'Szolnok', 'Szombathely', 'Tab', 'Taktaharkány', 'Tata', 'Tatabánya', 'Tét', 'Tiszafüred',
  'Tiszakécske', 'Tiszaújváros', 'Tolna', 'Törökszentmiklós', 'Vác', 'Várpalota', 'Vásárosnamény', 'Veszprém',
  'Villány', 'Zalaegerszeg', 'Zamárdi', 'Zirc', 'Zsámbék',
]

function extractSettlementsFromIrszHnk(data: unknown): string[] {
  const set = new Set<string>()
  if (!Array.isArray(data)) {
    const obj = data as Record<string, unknown>
    if (obj && typeof obj === 'object') {
      const arr = (obj as { data?: unknown[] }).data ?? Object.values(obj)
      if (Array.isArray(arr)) return extractSettlementsFromIrszHnk(arr)
    }
    return []
  }
  for (const row of data) {
    if (row && typeof row === 'object') {
      const r = row as Record<string, unknown>
      const name =
        (r.Telepules as string) ??
        (r.telepules as string) ??
        (r.Település as string) ??
        (r.település as string) ??
        (r.helysegnev as string) ??
        (r.Helysegnev as string)
      if (typeof name === 'string' && name.trim()) set.add(name.trim())
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'hu'))
}

export async function GET() {
  try {
    const res = await fetch(IRSZ_HNK_JSON_URL, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const list = extractSettlementsFromIrszHnk(data)
    if (list.length > 0) return NextResponse.json(list)
  } catch {
    // fallback
  }
  return NextResponse.json(FALLBACK_TELEPULESEK)
}
