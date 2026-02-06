# Vercel deploy – Programláz

A titkos adatok **soha** ne kerüljenek a Git-be. A `.gitignore` kizárja a `.env*` fájlokat, így a `.env.local` nincs a repóban. A Vercelben a környezeti változókat a dashboardon kell beállítani.

---

## 1. Repo feltöltése (ha még nincs GitHubon)

```bash
cd /Users/elekesbalint/Desktop/hortiadrianwebsite
git init
git add .
git commit -m "Initial commit"
# Hozz létre egy új repót a GitHubon, majd:
git remote add origin https://github.com/FELHASZNÁLÓNÉV/REPO_NEV.git
git branch -M main
git push -u origin main
```

**Fontos:** A `.env.local` és minden `.env*` ki van zárva (`.gitignore`), nem kerül fel.

---

## 2. Vercel – új projekt

1. [vercel.com](https://vercel.com) → bejelentkezés → **Add New…** → **Project**.
2. **Import** a GitHub repo (vagy Git provider) kiválasztása.
3. **Configure Project:**
   - **Root Directory:** kattints **Edit** → add meg: `app` (a Next.js app a mappában van).
   - **Framework Preset:** Next.js (automatikusan).
   - **Build Command:** `npm run build` (alap).
   - **Output Directory:** üres (Next.js default).
4. **Environment Variables** – itt add meg az összes env változót (értékeket a saját `.env.local`-ból másold, **ne commitold őket**):

   | Name | Hol van az érték |
   |------|-------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | .env.local |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | .env.local |
   | `SUPABASE_SERVICE_ROLE_KEY` | .env.local |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | .env.local |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | .env.local |
   | `VAPID_PRIVATE_KEY` | .env.local |
   | `RESEND_API_KEY` | .env.local |
   | `RESEND_FROM_EMAIL` | .env.local (pl. `Programláz <info@programlaz.hu>`) |

   Mindegyiknél válaszd: **Production**, **Preview**, **Development** (vagy legalább Production + Preview).
5. **Deploy**.

---

## 3. Mi NEM mehet a repóba

- `.env.local` és bármi `.env*` (ezt a `.gitignore` kizárja).
- API kulcsok, secretek, jelszavak – **csak** Vercel Environment Variables.

---

## 4. Deploy után

- Az oldal: `https://PROJEKT_NEV.vercel.app`.
- Domain (programlaz.hu) később: Vercel projekt → **Settings** → **Domains** → add hozzá a domaint.

Ha a build hibát ír, írd le a hibaüzenetet és a lépést, és azt nézzük.
