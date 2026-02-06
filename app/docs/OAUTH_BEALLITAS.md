# OAuth beállítás lépésről lépésre (Google, Facebook, Apple)

Először vedd ki a **Supabase callback URL**-t:
- Nyisd meg: [Supabase Dashboard](https://supabase.com/dashboard) → válaszd a projektet
- **Project Settings** (bal oldalt, fogaskerék ikon) → **General**
- Másold ki a **Reference ID** értékét (pl. `abcdefghijklmnop`)
- A callback URL mindig: `https://<Reference ID>.supabase.co/auth/v1/callback`  
  Példa: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

---

## 1. Google bejelentkezés

### 1.1 Google Cloud projekt

1. Menj a [Google Cloud Console](https://console.cloud.google.com/)
2. Bejelentkezés Google fiókkal
3. Felső sáv: **Select a project** → **New Project**
4. Projekt neve: pl. „Programláz” → **Create**
5. Válaszd ki az új projektet (felső sáv)

### 1.2 OAuth consent képernyő

6. Bal oldalt: **APIs & Services** → **OAuth consent screen**
7. User Type: **External** → **Create**
8. **App information:**  
   - App name: pl. „Programláz”  
   - User support email: a te e-mail címed  
   - Developer contact: a te e-mail címed  
   → **Save and Continue**
9. **Scopes:** **Save and Continue** (nem kell extra scope)
10. **Test users:** ha External és „Testing” állapotban van, add hozzá a saját Gmail címed; különben **Save and Continue**
11. **Summary** → **Back to Dashboard**

### 1.3 OAuth Client (Client ID és Secret)

12. Bal oldalt: **APIs & Services** → **Credentials**
13. **+ Create Credentials** → **OAuth client ID**
14. Application type: **Web application**
15. Name: pl. „Programláz Web”
16. **Authorized redirect URIs** → **+ ADD URI**  
    Írd be: `https://<Reference ID>.supabase.co/auth/v1/callback`  
    (a Reference ID a Supabase Project Settings → General alatt van)
17. **Create**
18. Megjelenik egy ablak: **Client ID** és **Client secret** – másold ki mindkettőt (a secretet csak egyszer mutatja, tárold biztonságosan)

### 1.4 Beállítás a Supabase-ban

19. Supabase Dashboard → **Authentication** → **Providers**
20. **Google** → kapcsold **Enable**-ra
21. **Client ID:** beillesztés (Google-ból)
22. **Client Secret:** beillesztés (Google-ból)
23. **Save**

Kész: a bejelentkezés oldalon a „Google” gomb már a Google-lal fog bejelentkeztetni.

---

## 2. Facebook bejelentkezés

### 2.1 Facebook alkalmazás létrehozása

1. Menj a [Facebook for Developers](https://developers.facebook.com/)
2. Bejelentkezés Facebook fiókkal
3. Jobb felső: **My Apps** → **Create App**
4. Use case: **Consumer** (vagy „Other” ha nincs Consumer) → **Next**
5. App type: **Business** (vagy ami megfelel) → **Next**
6. Display name: pl. „Programláz”  
   App contact email: a te e-mail címed  
   → **Create app**

### 2.2 Facebook Login bekapcsolása

7. Bal oldalt: **Use cases** (vagy **Products**) → **Set up** mellett keress **Facebook Login**
8. **Facebook Login** → **Set up**
9. Platform: **Web** → **Next**
10. Site URL: ideiglenesen pl. `https://programlaz.hu` vagy `http://localhost:3000` (később módosítható) → **Save** → **Continue**

### 2.3 App ID és App Secret

11. Bal oldalt: **Settings** → **Basic**
12. Ha kéri, add meg az **App domain**-t (pl. `programlaz.hu` vagy `localhost`).
13. **App ID** – ez a Client ID a Supabase-nak (másold ki)
14. **App Secret** – **Show** → jelszó megadása → másold ki az App Secret-et

### 2.4 Redirect URI megadása Facebooknak

15. Bal oldalt: **Use cases** → **Facebook Login** → **Settings** (vagy **Customize** → **Facebook Login** → **Settings**)
16. **Valid OAuth Redirect URIs** mező:  
    Add hozzá: `https://<Reference ID>.supabase.co/auth/v1/callback`  
    (Supabase Reference ID a Project Settings → General alatt)
17. **Save Changes**

### 2.5 Alkalmazás mód (élő)

18. **Settings** → **Basic**: alul **App Mode**  
    - **Development:** csak a te Facebook fiókod (és hozzáadott tesztfelhasználók) tud bejelentkezni  
    - **Live:** bárki használhatja – ehhez kell **App Review** (később)
19. Fejlesztéshez hagyd **Development**-on, és add hozzá magad **Roles** → **Test Users** alatt, ha kell.

### 2.6 Beállítás a Supabase-ban

20. Supabase Dashboard → **Authentication** → **Providers**
21. **Facebook** → **Enable**
22. **Client ID (App ID):** a Facebook App ID
23. **Client Secret (App Secret):** a Facebook App Secret
24. **Save**

Kész: a „Facebook” gomb a Facebookkal fog bejelentkeztetni.

---

## 3. Apple bejelentkezés (Sign in with Apple)

Apple-nél több lépés van; szükséges Apple Developer Program tagság (éves díj).

### 3.1 App ID (Bundle ID) – ha még nincs

1. [Apple Developer](https://developer.apple.com/account/) → bejelentkezés
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. **+** → **App IDs** → **Continue** → **App** → **Continue**
4. Description: pl. „Programláz”, Bundle ID: pl. `hu.programlaz.app` → **Continue** → **Register**

### 3.2 Services ID (ez lesz a „Client ID” a Supabase-nak)

5. **Identifiers** → **+** → **Services IDs** → **Continue**
6. Description: pl. „Programláz Sign in with Apple”
7. **Identifier:** egyedi azonosító, pl. `hu.programlaz.app.signin` (nem kell pont a végén, csak egyedi string)
8. **Continue** → **Register**

### 3.3 Sign in with Apple konfigurálása a Services ID-n

9. Listából kattints a most létrehozott Services ID-ra (pl. `hu.programlaz.app.signin`)
10. Kapcsold be a **Sign In with Apple** jelölőt → **Configure** mellett **Configure**
11. **Primary App ID:** válaszd ki a korábbi App ID-t (pl. `hu.programlaz.app`)
12. **Domains and Subdomains:**  
    Add meg a Supabase projekt domainjét: `<Reference ID>.supabase.co`  
    (pl. `abcdefghijklmnop.supabase.co`, Reference ID a Supabase Project Settings → General)
13. **Return URLs:**  
    Add meg: `https://<Reference ID>.supabase.co/auth/v1/callback`
14. **Save** → **Continue** → **Save**

### 3.4 Key (Private Key) létrehozása

15. Bal oldalt: **Keys** → **+** (Create a key)
16. Key name: pl. „Programláz Sign in with Apple”
17. Kapcsold be **Sign In with Apple** → **Configure** mellett **Configure**
18. **Primary App ID:** válaszd az App ID-t → **Save**
19. **Continue** → **Register**
20. **Download** – letölt egy `.p8` fájlt (csak egyszer elérhető). Tárold biztonságosan.
21. Jegyezd fel: **Key ID** (pl. `ABC123XYZ`)

### 3.5 Szükséges adatok összegyűjtése

22. **Team ID:** Apple Developer oldal jobb felső, vagy **Membership** → Team ID
23. **Client ID (Supabase-nak):** a Services ID azonosító (pl. `hu.programlaz.app.signin`)
24. **Services ID (ugyanaz):** ugyanaz az érték
25. **Key ID:** a Key létrehozásakor látott Key ID
26. **Private Key:** nyisd meg a letöltött `.p8` fájlt szövegszerkesztővel, másold ki a teljes tartalmat (beleértve a `-----BEGIN PRIVATE KEY-----` és `-----END PRIVATE KEY-----` sorokat is)

### 3.6 Beállítás a Supabase-ban

27. Supabase Dashboard → **Authentication** → **Providers** → **Apple**
28. **Enable** Apple
29. Töltsd ki:
   - **Services ID (Client ID):** pl. `hu.programlaz.app.signin`
   - **Secret Key (Private Key):** a .p8 fájl teljes tartalma
   - **Key ID:** a Key ID (pl. `ABC123XYZ`)
   - **Team ID:** Apple Team ID
   - **Bundle ID / App ID:** pl. `hu.programlaz.app`
30. **Save**

Kész: az „Apple” gomb Sign in with Apple-lal fog bejelentkeztetni.

---

## Supabase URL Configuration (közös)

Mindhárom provider működéséhez a Supabase-nak tudnia kell, hová irányítson vissza a felhasználót:

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL:**  
   - Éles: `https://programlaz.hu` (vagy a te domain)  
   - Fejlesztés: `http://localhost:3000`
3. **Redirect URLs:** add hozzá (soronként, ha többet enged):
   - `http://localhost:3000/auth/callback`
   - `https://programlaz.hu/auth/callback` (vagy a te domain)

Ha csak egy redirect URL engedélyezett, élesben a production URL-t add meg; localhosthoz ideiglenesen át lehet állítani.

---

## Gyors ellenőrzőlista

| Provider | Hol veszed a Client ID-t?        | Redirect URI hova megy?        |
|---------|-----------------------------------|-------------------------------|
| Google  | Cloud Console → Credentials → OAuth client | Supabase callback URL (fent) |
| Facebook| Developers → App → Settings → Basic → App ID | Facebook Login → Settings → Valid OAuth Redirect URIs |
| Apple   | Services ID azonosító            | Services ID → Configure → Return URLs |

Minden redirect URI a Supabase felé: `https://<Reference ID>.supabase.co/auth/v1/callback`
