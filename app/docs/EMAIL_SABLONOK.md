# Programláz – E-mail sablonok (Supabase Auth)

A regisztráció megerősítő és egyéb auth e-mailek professzionális HTML sablonjai.

**Beállítás:** Supabase Dashboard → **Authentication** → **Email Templates** → válaszd ki a sablon típust (pl. Confirm signup). Minden sablonnál **két mezőt** kell kitölteni:
- **Subject** – a levél tárgya (alább minden sablonhoz megadva)
- **Message body (HTML)** – a levél tartalma (HTML blokk)

Másold be az alábbi **Subject** és **Message body** értékeket a megfelelő mezőkbe, majd mentsd a sablont.

---

## 1. Confirm signup (Regisztráció megerősítése)

Ez a levél akkor megy ki, amikor valaki regisztrál és az e-mail megerősítés be van kapcsolva.

### Subject (Tárgy)

```
Erősítsd meg a Programláz regisztrációd
```

### Message body (HTML)

Másold be a teljes blokkot a Supabase **Confirm signup** sablon „Message body” mezőjébe. A `{{ .ConfirmationURL }}` maradjon változatlan – ezt a Supabase cseréli ki a megerősítő linkre.

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #374151;">
  <tr>
    <td style="padding: 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); border-radius: 16px 16px 0 0; padding: 32px 24px;">
        <tr>
          <td style="text-align: center;">
            <span style="display: inline-block; width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; line-height: 48px; color: #fff; font-size: 24px;">📍</span>
            <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Programláz</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Fedezd fel Magyarország legjobb helyeit</p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
          <td>
            <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600;">Köszönjük a regisztrációt!</h2>
            <p style="margin: 0 0 24px; color: #6b7280;">Kattints az alábbi gombra, hogy megerősítsd az e-mail címed és aktiváld a fiókodat. Ezután bejelentkezhetsz, és mentheted a kedvenc helyeidet.</p>
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="border-radius: 12px; background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); box-shadow: 0 4px 14px 0 rgba(45, 122, 79, 0.35);">
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none;">E-mail megerősítése</a>
                </td>
              </tr>
            </table>
            <p style="margin: 24px 0 0; font-size: 13px; color: #9ca3af;">Ha a gomb nem működik, másold be a böngészőbe az alábbi linket:</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280; word-break: break-all;">{{ .ConfirmationURL }}</p>
            <hr style="margin: 28px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Ha te nem regisztráltál a Programláz oldalon, nyugodtan hagyd figyelmen kívül ezt az e-mailt.</p>
            <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">© Programláz · Minden jog fenntartva.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 2. Reset password (Jelszó visszaállítása)

### Subject (Tárgy)

```
Új jelszó kérése – Programláz
```

### Message body (HTML)

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #374151;">
  <tr>
    <td style="padding: 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); border-radius: 16px 16px 0 0; padding: 32px 24px;">
        <tr>
          <td style="text-align: center;">
            <span style="display: inline-block; width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; line-height: 48px; color: #fff; font-size: 24px;">📍</span>
            <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Programláz</h1>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
          <td>
            <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600;">Jelszó visszaállítása</h2>
            <p style="margin: 0 0 24px; color: #6b7280;">Kértek egy új jelszót ehhez a fiókhoz. Kattints az alábbi gombra, és ott megadhatod az új jelszavadat.</p>
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="border-radius: 12px; background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); box-shadow: 0 4px 14px 0 rgba(45, 122, 79, 0.35);">
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none;">Új jelszó megadása</a>
                </td>
              </tr>
            </table>
            <p style="margin: 24px 0 0; font-size: 13px; color: #9ca3af;">Ha te nem kértél jelszó-visszaállítást, nyugodtan hagyd figyelmen kívül ezt az e-mailt. A jelszavad nem változik.</p>
            <hr style="margin: 28px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">© Programláz · Minden jog fenntartva.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 3. Magic link (Bejelentkezési link)

Ha használod a magic link bejelentkezést.

### Subject (Tárgy)

```
Bejelentkezési link – Programláz
```

### Message body (HTML)

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #374151;">
  <tr>
    <td style="padding: 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); border-radius: 16px 16px 0 0; padding: 32px 24px;">
        <tr>
          <td style="text-align: center;">
            <span style="display: inline-block; width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; line-height: 48px; color: #fff; font-size: 24px;">📍</span>
            <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px; font-weight: 700;">Programláz</h1>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
          <td>
            <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600;">Bejelentkezési link</h2>
            <p style="margin: 0 0 24px; color: #6b7280;">Kattints az alábbi gombra a bejelentkezéshez. A link egyszer használható és rövid ideig érvényes.</p>
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="border-radius: 12px; background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); box-shadow: 0 4px 14px 0 rgba(45, 122, 79, 0.35);">
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none;">Bejelentkezés</a>
                </td>
              </tr>
            </table>
            <p style="margin: 24px 0 0; font-size: 13px; color: #9ca3af;">Ha te nem kértél bejelentkezési linket, nyugodtan hagyd figyelmen kívül ezt az e-mailt.</p>
            <hr style="margin: 28px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">© Programláz · Minden jog fenntartva.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 4. Change email address (E-mail cím megváltoztatása)

Ez a levél akkor megy ki, amikor a felhasználó új e-mail címet ad meg – a megerősítés az **új** címre érkezik.

### Subject (Tárgy)

```
Erősítsd meg az új e-mail címed – Programláz
```

### Message body (HTML)

A `{{ .ConfirmationURL }}` a megerősítő link, a `{{ .NewEmail }}` az új e-mail cím (opcionálisan megjeleníthető).

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #374151;">
  <tr>
    <td style="padding: 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); border-radius: 16px 16px 0 0; padding: 32px 24px;">
        <tr>
          <td style="text-align: center;">
            <span style="display: inline-block; width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; line-height: 48px; color: #fff; font-size: 24px;">📍</span>
            <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px; font-weight: 700;">Programláz</h1>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
          <td>
            <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600;">Új e-mail cím megerősítése</h2>
            <p style="margin: 0 0 24px; color: #6b7280;">Kértek egy e-mail cím megváltoztatást a Programláz fiókodhoz. Az új cím: <strong>{{ .NewEmail }}</strong>. Kattints az alábbi gombra, hogy megerősítsd az új címet; ezután ezzel tudsz bejelentkezni.</p>
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="border-radius: 12px; background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); box-shadow: 0 4px 14px 0 rgba(45, 122, 79, 0.35);">
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none;">Új e-mail megerősítése</a>
                </td>
              </tr>
            </table>
            <p style="margin: 24px 0 0; font-size: 13px; color: #9ca3af;">Ha te nem kértél e-mail cím megváltoztatást, nyugodtan hagyd figyelmen kívül ezt az e-mailt. A fiókod változatlan marad.</p>
            <hr style="margin: 28px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">© Programláz · Minden jog fenntartva.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 5. Invite user (Meghívó)

Ha admin meghívót küld egy felhasználónak.

### Subject (Tárgy)

```
Meghívtak a Programlázra
```

### Message body (HTML)

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #374151;">
  <tr>
    <td style="padding: 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); border-radius: 16px 16px 0 0; padding: 32px 24px;">
        <tr>
          <td style="text-align: center;">
            <span style="display: inline-block; width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; line-height: 48px; color: #fff; font-size: 24px;">📍</span>
            <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px; font-weight: 700;">Programláz</h1>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
          <td>
            <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600;">Meghívtak!</h2>
            <p style="margin: 0 0 24px; color: #6b7280;">Meghívtak a Programláz közösségbe. Fogadd el a meghívást az alábbi gombra kattintva, és állítsd be a fiókodat.</p>
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="border-radius: 12px; background: linear-gradient(135deg, #2D7A4F 0%, #1B5E20 100%); box-shadow: 0 4px 14px 0 rgba(45, 122, 79, 0.35);">
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none;">Meghívó elfogadása</a>
                </td>
              </tr>
            </table>
            <hr style="margin: 28px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">© Programláz · Minden jog fenntartva.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## Fontos

- A **`{{ .ConfirmationURL }}`** (és egyéb `{{ .… }}`) részeket **ne töröld és ne módosítsd** – ezeket a Supabase cseréli ki.
- A sablonok **inline stílusokat** használnak, hogy a legtöbb e-mail kliensben jól jelenjenek meg.
- A **Subject** mezőt a fenti tárgy szövegekkel töltsd ki a megfelelő sablonnál.
- Mentés után a Supabase a következő kiküldött auth e-maileknél már ezeket a sablonokat használja.
