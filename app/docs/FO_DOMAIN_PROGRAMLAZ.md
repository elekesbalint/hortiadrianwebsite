# Fő domain: programlaz.hu

Az oldal a **programlaz.hu** fő domainre állításának checklistje.

## 1. Kód / környezeti változók

- A kódban a **metadataBase**, auth redirect és MFA issuer már a `programlaz.hu`-t használja (vagy a `NEXT_PUBLIC_SITE_URL` értékét).
- **Vercel** (vagy más host): állíts be egy környezeti változót:
  - **NEXT_PUBLIC_SITE_URL** = `https://programlaz.hu`
- Helyi fejlesztéshez a `.env.local`-ban opcionálisan beállíthatod ugyanezt; ha nincs, a kód a böngésző `window.location.origin`-jét vagy a default `https://programlaz.hu`-t használja.

## 2. Supabase Auth – Site URL és Redirect URLs

1. **Supabase Dashboard** → **Project Settings** → **Auth**.
2. **Site URL**: állítsd erre: `https://programlaz.hu`.
3. **Redirect URLs**: add hozzá (mellettük maradhat a localhost is fejlesztéshez):
   - `https://programlaz.hu/**`
   - `https://www.programlaz.hu/**` (ha a www is a Vercelre mutat).

Így a bejelentkezés, regisztráció és jelszó-visszaállítás a programlaz.hu-n fog visszairányítani.

## 3. OAuth (Google / Facebook)

- **Google Cloud Console** → Credentials → a OAuth client **Authorized redirect URIs** listájához add hozzá:  
  `https://<Reference ID>.supabase.co/auth/v1/callback`  
  (a Supabase projekt Reference ID-ja Project Settings → General alatt látszik.)  
  A **Authorized JavaScript origins**-hoz add hozzá: `https://programlaz.hu`.
- **Facebook** → Facebook Login → **Valid OAuth Redirect URIs**: ugyanaz a Supabase callback URL. **App domain**: `programlaz.hu`.

Részletek: [OAUTH_BEALLITAS.md](./OAUTH_BEALLITAS.md).

## 4. Vercel – domain

1. **Vercel** → a projekt → **Settings** → **Domains**.
2. Add hozzá a **programlaz.hu**-t (és opcionálisan a **www.programlaz.hu**-t).
3. A domain kezelőnél (ahol a DNS-t állítod) állítsd a programlaz.hu-t (és esetleg www) a Vercel által megadott rekordokra (A/CNAME).

## 5. Egyéb

- **E-mail / hírlevél** saját domainről: [DOMAIN_EMAIL_SETUP.md](./DOMAIN_EMAIL_SETUP.md).
- **Cookie / adatkezelés**: ha van cookie szöveg, ellenőrizd, hogy a domainre vonatkozó részek naprakészek legyenek.

Ha mindez megvan, az oldal a programlaz.hu fő domainen fog szolgálódni, és a megosztott linkek, OG képek és az auth is erre az URL-re fognak mutatni.
