# SEO – Programláz

Az oldal professzionális SEO optimalizálásának rövid áttekintése.

## Meta és megosztás

- **Root layout** (`app/layout.tsx`): alapértelmezett `title` + `title` template (`%s | Programláz`), `description`, `keywords`, **Open Graph** (locale, siteName, images), **Twitter Card** (summary_large_image), **canonical**, **robots** (index, follow).
- **Dinamikus oldalak**: hely (`/hely/[slug]`) és kategória (`/kategoriak/[slug]`) layoutban **generateMetadata** – egyedi cím, leírás, OG kép (helynél a hero kép), canonical.

## Strukturált adat (JSON-LD)

- **Kezdőlap**: `Organization` + `WebSite` (keresés action a `/terkep?keresés=...` felé).
- **Hely részletek**: `LocalBusiness` (név, leírás, kép, cím, koordináta, értékelés).

## Sitemap és robots

- **`/sitemap.xml`**: dinamikusan generált; tartalmazza a főoldalt, a térképet, a statikus jogi oldalakat, az összes kategória- és hely-URL-t. `lastModified`, `changeFrequency`, `priority` beállítva.
- **`/robots.txt`**: minden user-agent engedélyezve a nyilvános oldalakra; `disallow`: `/admin/`, `/auth/`, `/fiok/`, bejelentkezés/regisztráció/jelszó oldalak. Sitemap hivatkozás.

## Oldalspecifikus beállítások

| Oldal | Title / leírás | Index |
|-------|----------------|--------|
| Kezdőlap | Programláz - Fedezd fel Magyarország legjobb helyeit | ✓ |
| Térkép | Térkép – éttermek, szállások, látnivalók | ✓ |
| Hely | {Név} – {Kategória} | ✓ |
| Kategória | {Kategória} – fedezd fel a legjobb helyeket | ✓ |
| Cookie / Adatvédelem / ÁSZF | Egyedi cím + rövid leírás | ✓ |
| Partnereinknek | Partnereinknek | ✓ |
| Kedvencek | Kedvencek | noindex (felhasználói tartalom) |

## Javaslatok továbbra is

1. **Google Search Console**: regisztráld a `programlaz.hu`-t, add hozzá a sitemapot (`https://programlaz.hu/sitemap.xml`).
2. **Bing Webmaster Tools**: opcionális, ugyanígy sitemap beküldés.
3. **Tartalom**: a hely- és kategóriaoldalak leírásai egyediek, 150–160 karakter körül; a képek alt szövegei a komponensekben (pl. hely neve).
4. **Teljesítmény**: LCP/CLS barát (prioritásos képek, méretezés); a lazy load a listáknál megmarad.
5. **Verification**: ha kell, a root layout `metadata.verification` mezőjébe beállítható pl. `google: '...'`, `yandex: '...'` (Search Console / Yandex kód).

## Google Analytics 4 (GA4)

- A **GoogleAnalytics** komponens (`@/components/analytics/GoogleAnalytics`) betölti a gtag.js-t és konfigurálja a GA4-et, ha a **NEXT_PUBLIC_GA_MEASUREMENT_ID** környezeti változó be van állítva (pl. `G-XXXXXXXXXX`).
- Az első oldalbetöltés és minden kliens oldali navigáció automatikusan `page_view` eseményként kerül rögzítésre.
- **Beállítás**: [analytics.google.com](https://analytics.google.com) → Admin → Data Streams → Web → Measurement ID. Másold ki a **G-…** azonosítót, és add meg Vercelben (vagy `.env.local`-ban) a `NEXT_PUBLIC_GA_MEASUREMENT_ID` értékeként.
