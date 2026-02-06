# OAuth és Supabase Auth – programlaz.hu beállítása

Az alábbi lépéseket éles domain (programlaz.hu) használatához kell megcsinálni.

---

## 1. Supabase URL konfiguráció (ezt mindenképp)

1. Nyisd meg: **[Supabase Dashboard](https://supabase.com/dashboard)** → válaszd ki a projektet (pl. tvujxajmfjkzwscdbxda).
2. Bal oldalt: **Authentication** → **URL Configuration**.
3. Állítsd be:
   - **Site URL:**  
     `https://programlaz.hu`  
     (Ez az „alap” cím, ahova a Supabase visszairányít.)
   - **Redirect URLs:** kattints **Add URL** és add hozzá **mindkettőt** (soronként):
     - `http://localhost:3000/auth/callback`
     - `https://programlaz.hu/auth/callback`
4. **Save**.

Ettől fogva a bejelentkezés után a Supabase a programlaz.hu-ra (vagy localhostra) irányít.

---

## 2. Google bejelentkezés (ha használod)

A redirect a **Supabase** felé megy, nem közvetlenül a programlaz.hu-ra. A Google Cloud-ban csak a Supabase callback URL kell.

1. **[Google Cloud Console](https://console.cloud.google.com/)** → APIs & Services → **Credentials**.
2. Nyisd meg a **OAuth 2.0 Client ID**-t (Web application).
3. **Authorized redirect URIs** között legyen:
   - `https://tvujxajmfjkzwscdbxda.supabase.co/auth/v1/callback`  
   (A Reference ID a Supabase Project Settings → General alatt látható; ha más, cseréld ki.)
4. **Save**.

Nem kell külön `https://programlaz.hu/...` a Google redirect URI-k közé.

---

## 3. Facebook bejelentkezés (ha használod)

1. **[Facebook for Developers](https://developers.facebook.com/)** → My Apps → válaszd az alkalmazást.
2. **Facebook Login** → **Settings** (vagy Customize → Facebook Login → Settings).
3. **Valid OAuth Redirect URIs:** legyen benne  
   `https://tvujxajmfjkzwscdbxda.supabase.co/auth/v1/callback`
4. **Settings** → **Basic**: **App Domains** mezőbe add hozzá: `programlaz.hu`.
5. **Save Changes**.

---

## 4. Apple bejelentkezés (ha használod)

1. [Apple Developer](https://developer.apple.com/account/) → **Certificates, Identifiers & Profiles** → **Identifiers**.
2. Válaszd ki a **Services ID**-t (pl. Sign in with Apple-hoz).
3. **Sign In with Apple** → **Configure**:
   - **Domains and Subdomains:** `tvujxajmfjkzwscdbxda.supabase.co`
   - **Return URLs:** `https://tvujxajmfjkzwscdbxda.supabase.co/auth/v1/callback`
4. **Save** → **Continue** → **Save**.

---

## Összefoglaló

| Hol | Mit állítasz |
|-----|----------------|
| **Supabase** → Authentication → URL Configuration | Site URL: `https://programlaz.hu`; Redirect URLs: `http://localhost:3000/auth/callback` és `https://programlaz.hu/auth/callback` |
| **Google** → Credentials → OAuth client | Redirect URI: `https://<Reference ID>.supabase.co/auth/v1/callback` |
| **Facebook** → Facebook Login → Settings | Valid OAuth Redirect URI: ugyanaz a Supabase callback; App Domains: `programlaz.hu` |
| **Apple** → Services ID → Configure | Domains: `<Reference ID>.supabase.co`; Return URL: Supabase callback |

A **Reference ID** a Supabase Project Settings → General alatt látható (pl. `tvujxajmfjkzwscdbxda`).
