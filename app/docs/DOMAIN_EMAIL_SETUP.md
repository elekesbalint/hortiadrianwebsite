# Saját domain e-mail beállítás (programlaz.hu)

Ha meglesz a **programlaz.hu** domain, ezekkel a lépésekkel a confirm signup és a hírlevél is a saját domainről mehet, és kevésbé kerülnek spambe.

## 1. Resend – hírlevél

1. [resend.com/domains](https://resend.com/domains) → **Add Domain** → add meg a `programlaz.hu`-t.
2. Másold be a Resend által megadott **SPF** és **DKIM** (TXT) rekordokat a domain DNS-be (ahol kezeled a domaint).
3. Várd meg, amíg a Resend „Verified” státuszt mutat.
4. `.env.local`:  
   `RESEND_FROM_EMAIL=Programláz <info@programlaz.hu>`  
   (vagy pl. `noreply@programlaz.hu`).

## 2. Supabase Auth – confirm signup (saját SMTP)

Ha a regisztrációs megerősítő e-mail is a saját domainről menjen:

1. **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**.
2. Kapcsold be a **Custom SMTP**-t.
3. Resend SMTP adatok (Resend docs / Dashboard):
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) vagy `587` (TLS)
   - User: `resend` (vagy az API kulcs)
   - Password: a **Resend API key** (`RESEND_API_KEY`).
4. **Sender email:** pl. `noreply@programlaz.hu` (a Resend-ben verifikált domain).
5. **Sender name:** pl. `Programláz`.

Ezután a confirm signup, reset password stb. is a programlaz.hu címről megy, és a domain hitelesítés miatt jobb a kézbesítés.
