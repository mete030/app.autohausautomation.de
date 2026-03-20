import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json()

    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Telefonnummer ist erforderlich' }, { status: 400 })
    }

    // Read env at request time to avoid caching stale values
    const accountId = process.env.NLPEARL_ACCOUNT_ID ?? ''
    const secretKey = process.env.NLPEARL_SECRET_KEY ?? ''
    const pearlId = process.env.NLPEARL_PEARL_ID ?? ''

    if (!accountId || !secretKey || !pearlId) {
      return NextResponse.json(
        { error: 'NLPearl Credentials nicht konfiguriert (NLPEARL_ACCOUNT_ID, NLPEARL_SECRET_KEY, NLPEARL_PEARL_ID in .env.local)' },
        { status: 500 }
      )
    }

    const bearerToken = `${accountId}:${secretKey}`
    const url = `https://api.nlpearl.ai/v1/Outbound/${pearlId}/Call`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ to }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `NLPearl API Fehler: ${res.status} — ${text}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
