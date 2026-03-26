import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCallbackNotificationEmailServerConfig } from '@/lib/email/callback-email-server-config'

/**
 * Diagnose-Endpoint für E-Mail-Zustellbarkeit.
 *
 * Sendet stufenweise Test-Mails über Brevo, um zu isolieren,
 * welche Komponente (Tracking, HTML, Links, Betreff) die
 * Zustellung bei Exchange/Outlook blockiert.
 *
 * POST /api/email/deliverability-test
 * Body: { recipientEmail, testLevel: 1-5 }
 *
 * Level 1: Reiner Text, kein HTML, kein Tracking, kein Link
 * Level 2: Minimales HTML, kein Tracking, kein Link
 * Level 3: Minimales HTML, kein Tracking, mit Link
 * Level 4: Minimales HTML, MIT Tracking, mit Link
 * Level 5: Volles Callback-Template (aktuelles vereinfachtes)
 */

const requestSchema = z.object({
  recipientEmail: z.string().trim().email(),
  testLevel: z.number().int().min(1).max(5),
})

function buildTestEmail(level: number, recipientEmail: string): {
  subject: string
  htmlContent?: string
  textContent: string
  headers: Record<string, string>
} {
  const timestamp = new Date().toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  switch (level) {
    case 1:
      // Reiner Text — kein HTML, kein Tracking, kein Link
      return {
        subject: `Technischer Zustelltest ${timestamp}`,
        textContent: `Technischer Zustelltest.\n\nDiese E-Mail wurde am ${timestamp} gesendet.\nTestlevel: 1 (reiner Text, kein HTML, kein Tracking, kein Link)\n\nWenn Sie diese E-Mail lesen, funktioniert die Basiszustellung.\n\nWackenhut Callcenter`,
        headers: {
          'X-Mailin-Track': '0',
          'X-Mailin-Track-Links': '0',
        },
      }

    case 2:
      // Minimales HTML — kein Tracking, kein Link
      return {
        subject: `Zustelltest HTML ${timestamp}`,
        htmlContent: `<html><body style="font-family:Arial,sans-serif;font-size:14px;color:#333;"><p>Zustelltest mit minimalem HTML.</p><p>Gesendet: ${timestamp}</p><p>Testlevel: 2 (einfaches HTML, kein Tracking, kein Link)</p><p>Wenn Sie diese E-Mail lesen, funktioniert HTML-Zustellung.</p><p>Wackenhut Callcenter</p></body></html>`,
        textContent: `Zustelltest mit minimalem HTML.\n\nGesendet: ${timestamp}\nTestlevel: 2 (einfaches HTML, kein Tracking, kein Link)\n\nWackenhut Callcenter`,
        headers: {
          'X-Mailin-Track': '0',
          'X-Mailin-Track-Links': '0',
        },
      }

    case 3:
      // HTML mit Link — kein Tracking
      return {
        subject: `Zustelltest mit Link ${timestamp}`,
        htmlContent: `<html><body style="font-family:Arial,sans-serif;font-size:14px;color:#333;"><p>Zustelltest mit Link.</p><p>Gesendet: ${timestamp}</p><p>Testlevel: 3 (HTML mit Link, kein Tracking)</p><p>Hier ist ein Testlink: <a href="https://www.wackenhut.de">www.wackenhut.de</a></p><p>Wackenhut Callcenter</p></body></html>`,
        textContent: `Zustelltest mit Link.\n\nGesendet: ${timestamp}\nTestlevel: 3 (HTML mit Link, kein Tracking)\nTestlink: https://www.wackenhut.de\n\nWackenhut Callcenter`,
        headers: {
          'X-Mailin-Track': '0',
          'X-Mailin-Track-Links': '0',
        },
      }

    case 4:
      // HTML mit Link UND Tracking aktiviert
      return {
        subject: `Zustelltest mit Tracking ${timestamp}`,
        htmlContent: `<html><body style="font-family:Arial,sans-serif;font-size:14px;color:#333;"><p>Zustelltest mit Tracking aktiviert.</p><p>Gesendet: ${timestamp}</p><p>Testlevel: 4 (HTML mit Link UND Tracking)</p><p>Testlink: <a href="https://www.wackenhut.de">www.wackenhut.de</a></p><p>Wackenhut Callcenter</p></body></html>`,
        textContent: `Zustelltest mit Tracking.\n\nGesendet: ${timestamp}\nTestlevel: 4 (HTML mit Link UND Tracking)\nTestlink: https://www.wackenhut.de\n\nWackenhut Callcenter`,
        headers: {},  // Tracking bleibt AN (Brevo-Default)
      }

    case 5:
      // Simuliert das echte Template (vereinfachte Version)
      return {
        subject: `Rückruf-Info: Max Mustermann`,
        htmlContent: `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#333333;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <p>Hallo Verena,</p>
      <p>es wurde ein neuer Rückruf angelegt. Hier die Details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;">Kunde</td>
          <td style="padding:6px 0;font-weight:bold;">Max Mustermann</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;">Telefon</td>
          <td style="padding:6px 0;">0711 1234567</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;">Anliegen</td>
          <td style="padding:6px 0;">Testanfrage Zustellbarkeit</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;">Priorität</td>
          <td style="padding:6px 0;">Mittel</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;">Status</td>
          <td style="padding:6px 0;">Offen</td>
        </tr>
      </table>
      <p>Gesendet: ${timestamp}</p>
      <p>Testlevel: 5 (volles vereinfachtes Template, kein Tracking)</p>
      <p>Viele Grüße<br />Wackenhut Callcenter</p>
    </div>
  </body>
</html>`,
        textContent: `Hallo Verena,\n\nes wurde ein neuer Rückruf angelegt.\n\nKunde: Max Mustermann\nTelefon: 0711 1234567\nAnliegen: Testanfrage Zustellbarkeit\nPriorität: Mittel\nStatus: Offen\n\nGesendet: ${timestamp}\nTestlevel: 5 (volles vereinfachtes Template, kein Tracking)\n\nViele Grüße\nWackenhut Callcenter`,
        headers: {
          'X-Mailin-Track': '0',
          'X-Mailin-Track-Links': '0',
        },
      }

    default:
      throw new Error(`Ungültiges Testlevel: ${level}`)
  }
}

export async function POST(req: NextRequest) {
  const emailConfig = getCallbackNotificationEmailServerConfig()
  if (!emailConfig.isConfigured) {
    return NextResponse.json(
      { error: 'E-Mail-Konfiguration nicht verfügbar.' },
      { status: 503 },
    )
  }

  try {
    const payload = requestSchema.parse(await req.json())
    const testEmail = buildTestEmail(payload.testLevel, payload.recipientEmail)

    const brevoBody: Record<string, unknown> = {
      sender: {
        name: emailConfig.senderName,
        email: emailConfig.senderEmail,
      },
      to: [{ email: payload.recipientEmail }],
      subject: testEmail.subject,
      textContent: testEmail.textContent,
    }

    if (testEmail.htmlContent) {
      brevoBody.htmlContent = testEmail.htmlContent
    }

    if (Object.keys(testEmail.headers).length > 0) {
      brevoBody.headers = testEmail.headers
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': emailConfig.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(brevoBody),
    })

    const responseText = await response.text()
    let responseJson: Record<string, unknown> | null = null

    if (responseText) {
      try {
        responseJson = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        responseJson = null
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: responseJson?.message ?? `Brevo API Fehler: ${response.status}`,
          brevoStatus: response.status,
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      ok: true,
      testLevel: payload.testLevel,
      recipientEmail: payload.recipientEmail,
      subject: testEmail.subject,
      trackingEnabled: Object.keys(testEmail.headers).length === 0,
      hasHtml: !!testEmail.htmlContent,
      hasLinks: payload.testLevel >= 3,
      providerMessageId: typeof responseJson?.messageId === 'string' ? responseJson.messageId : undefined,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Parameter. Erwartet: { recipientEmail: string, testLevel: 1-5 }' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Interner Serverfehler' },
      { status: 500 },
    )
  }
}
