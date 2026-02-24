# Programláz / Horti Adrian – Portfolio leírás

Használd ezt a szöveget a [Munkáim](https://www.balintelekes.hu/examples) oldalon, a többi projekt mintájára.

---

## Programláz (hortiadrianwebsite)

**Rövid megjelenített szöveg (pl. kártya alatt):**  
Teljes körű helyfelfedező platform éttermekkel, szállásokkal, látnivalókkal és eseményekkel. Interaktív térkép, kategória-specifikus szűrők, admin panel és „Partnereinknek” PDF kezelés.

---

### Technológiák:

- Next.js 16 (App Router, Server & Client Components)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Supabase (PostgreSQL, Auth, Storage, RLS, e-mail jelszó + session)
- Google Maps API (térkép, marker clustering, útvonal, Places Autocomplete)
- Server Actions és „use server” adatréteg
- Dinamikus szűrőcsoportok kategóriánként (category_filter_groups tábla)
- Cookie consent (GDPR)
- Vercel deployment

---

### Funkciók:

- **Kezdőlap:** hero, kategóriák grid, közelgő események carousel, népszerű helyek carousel, statisztika (megtekintés, partner), térkép illusztráció
- **Interaktív térkép:** Google Maps, kategória és szűrő alapú szűrés, lista nézet, keresés (név, cím), „Keresés zóna” (kör sugárral), saját helyzet, nyitva most szűrő
- **Térkép popup:** Részletek gomb, választható második gomb (Útvonal vagy Jegyvásárlás, adminból + URL)
- **Kategória oldalak:** kategória-specifikus szűrők (DB-ből: category_filter_groups), Hol?, Távolság, Rendezés, Nyitva most, esemény dátum szűrő
- **Hely részletek:** leírás, képek, értékelés, nyitvatartás, térkép, menü/árlap/jegyvásárlás linkek, kedvencekhez adás
- **Felhasználói fiók:** bejelentkezés/regisztráció, Kedvencek (gyűjtemény), beállítások
- **Hírlevél:** feliratkozás, admin hírlevél kezelés (pl. küldés)
- **Admin panel:** kategóriák (sorrend, header ikon, banner, felkapott sorrend, **szűrőcsoportok hozzárendelése kategóriához**), helyek (CRUD, képek, nyitvatartás, esemény dátum, térkép gomb típus + URL), szűrők (csoportok és opciók, **mely kategóriákhoz tartoznak**), Partnereinknek PDF (feltöltés/törlés), főoldal statisztikák
- **Helyek admin:** csak a kiválasztott kategóriához rendelt szűrők jelennek meg a hely szerkesztőben
- **Nyitva most:** automatikus számítás nyitvatartás (opening_hours) alapján Budapest időzónában, fallback manuális jelölőre
- **Partnereinknek:** nyilvános oldal egy feltöltött PDF megjelenítésével, adminból cserélhető/törölhető
- **ÁSZF / Adatvédelem:** placeholder oldalak („hamarosan elérhető”)
- **Footer:** TikTok, Facebook, Instagram linkek
- **Reszponzív:** mobilra optimalizált távolságok, horizontális görgetés (kategória sáv) touch-action és eseménykezeléssel, hogy ne görgetse az oldalt
- **SEO:** meta tagek, logikus URL-ek (kategoriak/[slug], hely/[slug], terkep)

---

### Felhasználási esetek:

- Helyfelfedező platformok
- Éttermek és szállások listázása
- Esemény- és programkalauz
- Felhasználói fiók és kedvencek
- Hírlevél és tartalomkezelés
- Admin dashboard tartalom- és szűrőkezeléssel
- Interaktív térképes alkalmazások
- Kategória-specifikus szűrők és szűrőcsoport hozzárendelés adatbázisból

---

**Weboldal megnyitása:** [élő URL, pl. hortiadrianwebsite.vercel.app vagy saját domain]

---

*Ezt a blokkot másold be a portfolio examples oldalad forrásába (pl. a belvarosiekszerkovacs / ecovisual / goldipuppy kártyák mellé), és ahol „Weboldal megnyitása” link van, cseréld ki a tényleges URL-re.*
