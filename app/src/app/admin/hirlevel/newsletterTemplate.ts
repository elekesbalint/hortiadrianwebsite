/**
 * Ha a szöveg nem tartalmaz HTML tag-et, egyszerű szövegként kezeljük:
 * escape + bekezdések (dupla sortörés = új p, egy sortörés = br).
 */
function plainTextToHtml(text: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  const paras = text.trim().split(/\n\s*\n/)
  return paras
    .map((p) => {
      const line = escape(p.trim()).replace(/\n/g, '<br/>')
      return line ? `<p style="margin: 0 0 16px; color: #374151;">${line}</p>` : ''
    })
    .filter(Boolean)
    .join('')
}

/**
 * A megadott tartalmat (egyszerű szöveg vagy HTML) beilleszti a Programláz hírlevél sablonba.
 */
export function wrapNewsletterHtml(userContent: string): string {
  const hasHtml = /<[a-z][\s\S]*>/i.test(userContent.trim())
  const contentHtml = hasHtml
    ? userContent.trim()
    : plainTextToHtml(userContent) || '<p style="margin: 0; color: #374151;">Üdvözöl a Programláz!</p>'

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Programláz hírlevél</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto; font-size: 16px; line-height: 1.6; color: #374151;">
  <tr>
    <td style="padding: 32px 20px;">
      <!-- Fejléc -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #2D7A4F; border-radius: 12px 12px 0 0; padding: 28px 24px;">
        <tr>
          <td style="text-align: center;">
            <span style="display: inline-block; width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 10px; line-height: 44px; color: #fff; font-size: 22px;">📍</span>
            <h1 style="margin: 12px 0 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Programláz</h1>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">Fedezd fel Magyarország legjobb helyeit</p>
          </td>
        </tr>
      </table>
      <!-- Tartalom -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
          <td>
            ${contentHtml}
            <hr style="margin: 28px 0 20px; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Ez a hírlevél a Programláz feliratkozóinak került kiküldésre.</p>
            <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af;">© Programláz · Minden jog fenntartva.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`
  return fullHtml
}
