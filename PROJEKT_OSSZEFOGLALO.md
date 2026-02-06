# Programláz – Térképalapú weboldal projekt – Teljes összefoglaló

**Projekt neve:** Programláz
**Megrendelő:** Horti Adrián

## 1. Projekt lényege

**Típus:** Térkép- és kategóriaalapú platform (hovamenjunk.hu referenciával).

**Cél:** Látogatók helyszíneket (éttermek, szállások, látnivalók, programok) keressenek, szűrjenek és böngésszenek térképen és listában. Minden tartalom admin felületből kezelhető.

**Megrendelő:** Horti Adrián  
**Referencia:** hovamenjunk.hu (és PDF specifikáció, AI generált képek csak útmutatásra)

---

## 2. Funkcionális követelmények (PDF alapján)

### 2.1 Térkép (1.0)
- Hovamenjunk.hu stílusú interaktív térkép
- Zoom: nagyításkor több részlet; buborékok csak bizonyos zoomnál látszanak, összlétszám távolról is
- Listanézet: találatok külön listában is
- Saját hely gomb + helymeghatározás engedély
- Gyors működés sok egyidejű felhasználó mellett
- Sugár alapú keresés: kör (km), belül aktív, kívül halványan (pl. szürke)
- Átlátható térkép (ne legyen zsúfolt); alul kártya kiválasztott helyről (név, értékelés, távolság)

### 2.2 Helyszín megjelenítés
- Nyitva/zárva: zöld vs piros keret; admin kapcsolja ki/be
- Lista: távolság, értékelés, név; opcionálisan utazási idő (autó)
- Útvonal gomb a részletes nézetben → Google Maps (vagy más, később egyeztetés)
- Menü/árlista feltöltés: JPG vagy PDF
- Szolgáltatástípusok (étterem, szállás stb.) adminból; éttermeknél „menü” gomb, szállásnál nem; minden megjelenítendő mező adminból be/ki kapcsolható

### 2.3 Statisztikák (csak admin)
- Látogatottság: éves / havi / heti / napi
- Kattintások helyszínenként
- Letölthető, opcionálisan küldhető szolgáltatóknak
- Csak admin felületről látható

### 2.4 Bejelentkezés / regisztráció (2.0)
- Térképen: premium vs alap csomag megkülönböztetése (kinézet a fejlesztőre bízva)
- Bejelentkezési felület: hovamenjunk.hu-hoz hasonló; egyedi dizájn opcionális
- Közösségi bejelentkezés: Google, Facebook, Apple
- Push értesítések: regisztráció után opció (felkapott helyek, ajánlatok)

### 2.5 Kezdőlap (3.0)
- Kereső (pl. „Hova menjünk?”)
- Kategóriák nagy kártyákkal (Szállások, Éttermek, Gyógyfürdők, Gyerekprogramok, Bárok, Látnivalók stb.)
- Felkapott helyek: feltűnő, lapozható szekció; kattintás → részletes oldal
- Admin: kategóriák kezelése (hozzáadás/eltávolítás); minden tartalom adminból

### 2.6 Kategória lista (pl. éttermek)
- Lista: kép, cím, leírás, ár, értékelés (pl. 4,7 ★ (250)), kedvenc (szív)
- Rendezés: távolság szerint növekvő (közel first)
- Szűrő felül
- Térkép gomb: jól látható → saját beépített térképes oldal (nem külső Google Maps link), adott sugaron belüli helyekkel
- Kedvencek: szív → kedvencek listába
- Admin: bővítés/összecsukás, képek/videók feltöltése, minden listing adat szerkeszthető

### 2.7 Helyszín részletes oldal
- Fotók, értékelés, fülek: Információk, Étlap, Értékelések, Fotók
- Információk: cím, nyitvatartás, leírás, telefon, e-mail, web, Instagram
- Értékelések: felhasználók értékelhetnek, fotó feltöltés, csillag
- Helymeghatározás: közelben lévő helyek, távolság szerint; engedély kérés; ha nincs engedély → Budapest alapértelmezés; gomb helymeghatározás be/ki
- Megosztás gomb (Facebook, e-mail, üzenetküldő stb.)

### 2.8 Szűrő (4.0)
- Szűrő listanézetben és térképen is
- Szempontok (adminból bővíthető): Hol? (ország, megye, város), Évszak, Időszak (nappal, este, éjjel), Tér (beltér, kültér), Kivel mész?, Megközelítés; plusz kerthelyiség, állatbarát, gluténmentes, konyha, ár, értékelés, rendezés stb.

---

## 3. Technológiai stack

| Réteg      | Technológia              |
|-----------|---------------------------|
| Frontend  | Next.js (React), Tailwind, React Query, Zustand |
| Backend   | Next.js API routes (vagy Node.js + Express) |
| Adatbázis | **Supabase (PostgreSQL)** |
| Térkép    | Google Maps API vagy Mapbox (döntés: megrendelő) |
| Auth      | NextAuth.js (Google, Facebook, Apple + email/jelszó) |
| Fájlok    | Supabase Storage (képek, menü PDF/JPG) vagy Cloudflare R2 |
| Admin     | Saját React admin ugyanabban az appban |
| Push      | Web Push API + backend |
| Hosting   | Vercel (+ Supabase) |

---

## 4. Színvilág / design

- **Téma:** Világos (light)
- **Hangulat:** Fehér + zöldes; konkrét megvalósítás a fejlesztőre bízva
- **Javasolt paletta:** Fehér háttér (#FFFFFF, #F8FAF8), fő zöld (#2D7A4F), világos zöld (#E8F5E9), sötét zöld (#1B5E20), szöveg sötétszürke (#1A1A1A), másodlagos (#6B7280)
- Részletek: `design_szinek.md`

---

## 5. Árajánlat és tartalom (megállapított)

- **Ár:** 950.000 – 1.100.000 Ft
- **Idő:** 4–6 hét
- Tartalmazza: frontend, backend, admin, térkép, SEO, domain segítség, publikálás, teljes üzembe helyezés
- Térkép: Google Maps (havi $200 ingyenes kredit) vagy OpenStreetMap + Leaflet (ingyenes, több fejlesztés) – megrendelő dönt

---

## 6. Következő lépések (fejlesztés indulása)

1. Projekt inicializálás (Next.js, Tailwind, alap mappastruktúra)
2. Supabase projekt + alap táblák (users, categories, places, filters, statistics stb.)
3. Auth (NextAuth.js) + alap layout
4. Kezdőlap + kategóriák + lista nézet
5. Térkép integráció (Google Maps vagy Mapbox)
6. Helyszín részletes oldal + szűrők
7. Admin felület (kategóriák, helyszínek, szűrők, statisztikák)
8. Kedvencek, értékelések, push, megosztás
9. Tesztelés, SEO, domain, publikálás

---

*Dokumentum utolsó frissítése: 2025.01.31*
