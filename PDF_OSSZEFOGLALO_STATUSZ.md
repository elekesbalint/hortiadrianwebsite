# Weboldal felépítés – PDF alapján: mi kész, mi maradt

A `weboldal_felepites_horti_adrian.pdf` alapján összeállított állapot.

---

## ✅ Elkészült / megvalósítva

### Térkép (1.0)
- Térkép hovamenjunk.hu-hoz hasonlóan, zoom, lista nézet váltás
- Cluster buborékok (szám látható távolról), egyedi helyek zoomnál
- Nyitva/zárva jelzés (zöld/piros keret) a buborékon és az infóablakban
- Infóablak: név, távolság, értékelés, kép, Részletek + Útvonal (Google Maps)
- Prémium vs alap megkülönböztetés (badge)
- Térkép színe enyhe (nem túl zöld), cluster méret és szám mérete igazítva
- Cluster kattintás: sima zoom animáció, egy kattintással szétesik
- Kategória szűrés (Éttermek, Szállások, stb.) a térképen és listában
- Szűrőpanel a térképen is (UI, egyes szűrők működnek a listanézetben)

### Bejelentkezés / Regisztráció (2.0)
- Bejelentkezési és regisztrációs oldalak, professzionális kinézet
- E-mail/jelszó, jelszó megjelenítés, „Elfelejtett jelszó” oldal
- Google / Facebook / Apple gombok (UI, később OAuth)
- Redirect a bejelentkezés után (pl. kedvencekhez adásnál)

### Kezdőlap (3.0)
- Főoldal, kategória kártyák (Éttermek, Szállások, Látnivalók, Programok), Ugrás a térképre
- Cégnév a headerben: Programláz (a PDF-ben Hovamenjünk.hu, a projekt neve Programláz)

### Kategória oldalak (éttermek, szállások, stb.)
- Lista felépítés a PDF szerint, kártyák képekkel
- Kedvencekhez adás **csak bejelentkezés után** (nincs bejelentkezés → átirányítás)
- Értékelés: érték + csillag + (értékelések száma)
- Távolság szerint növekvő sorrend (és szűrők: város, értékelés, ár, távolság, nyitva, rendezés)
- Szűrők működnek (Hol?, Távolság, Értékelés, Árkategória, Nyitva most, Rendezés)
- Térkép gomb → weboldal térképe (kategória szűrővel)
- Hely részletek oldal linkkel (/hely/[id])
- Hero háttérképek kategóriánként

### Egyéb
- Design: világos téma, zöldes (#2D7A4F, #E8F5E9, stb.)
- Header: Programláz, navigáció, Keresés → térkép, Szív → Kedvencek, Belépés/Regisztráció
- Kedvencek oldal (üres állapot + magyarázat)
- Auth kontextus: bejelentkezés állapota (később NextAuth/Supabase bekötésére)

---

## ❌ Még nincs meg / később kell

### Térkép
- **Saját helyzet gomb** – kattintásra kérjen helyadatokhoz való hozzáférést (engedély szöveg), majd középre vigye a térképet és használja a távolságokhoz.
- **Keresés zóna (kör)** – felhasználó kijelöl egy kört (km sugarú), csak a körön belüli helyek látszanak, kívül szürkén/inaktívan.
- **Útvonal: perc** – opcionálisan „X percre van” autóval (alapértelmezett), jelenleg csak km van.

### Admin felület (minden ilyen tétel erre épül)
- Kategóriák bővítése/csökkentése (éttermek, szállások, …).
- Helyek megjelenítésének testreszabása: nyitva/zárva jelzés be/ki, étlap gomb be/ki éttermeknél, stb.
- **Étlap feltöltés** – jpg/pdf, admin felületről.
- **Statisztika** – éves/havi/heti/napi: oldalmegtekintések, helyre (étteremre) kattintások; csak admin lássa; export/letöltés, igény esetén küldés a helynek.
- Szűrők bővítése/csökkentése admin felületről.
- Felkapott helyek tartalma és sorrendje adminból.
- Képek, videók feltöltése/módosítása adminból.

### Bejelentkezés / Regisztráció
- **Push értesítések** – feliratkozáskor engedélyezhető, időnként push a felkapott helyekről, ajánlatokról.

### Kezdőlap
- **Felkapott helyek** – feltűnő, nagy, lapozható (carousel) blokk; kattintás → hely adatlap; tartalom adminból.
- Kategóriák száma és lista adminból módosítható.

### Hely részletek oldal (/hely/[id])
- **Komment/értékelés szekció** – felhasználók véleményeznek, csillag, opcionálisan kép feltöltés.
- **Megosztás gomb** – Facebook, e-mail, üzenet stb.

### Helymeghatározás (általános)
- Keresésnél a **felhasználóhoz legközelebbi** helyek előre (távolság szerint).
- Helymeghatározás: egy szöveg kéri az engedélyt; ha a felhasználó nem adja meg, **alapértelmezett: Budapest**.
- **Gomb** a helymeghatározás könnyű bekapcsolásához (pl. „Saját helyem” a térképen már van, de a funkció nincs bekötve).

### Adatbázis / backend
- Supabase (vagy más backend) bekötése: helyek, kategóriák, felhasználók, kedvencek, értékelések, statisztika.
- Valódi bejelentkezés (NextAuth / Supabase Auth), session, kedvencek per user.

---

## Rövid priorítási javaslat

1. **Saját helyzet gomb** a térképen (geolocation + engedély szöveg).
2. **Helymeghatározás alapértelmezése** Budapestre, ha nincs engedély; távolság rendezés hely alapján.
3. **Felkapott helyek** carousel a kezdőlapon (kezdetben dummy adattal).
4. **Hely oldal** kibővítése: komment szekció (akár egyszerű), megosztás gomb.
5. **Admin felület** alapok (bejelentkezés, kategóriák CRUD, helyek listája), majd statisztika, étlap feltöltés, szűrők szerkesztése.
6. **Körön belüli keresés** a térképen (kijelölhető kör + szűrés).
7. **Push értesítések** (web push API).
8. **Supabase** adatbázis és auth bekötése.

Ha azt szeretnéd, hogy ebből egy konkrét ponton kezdjünk (pl. saját helyzet gomb, vagy felkapott helyek carousel), írd meg, melyikkel.
