import { NextRequest, NextResponse } from 'next/server'

const SERVICE_URL = process.env.AGA8_SERVICE_URL ?? ''

export async function POST(req: NextRequest) {
  if (!SERVICE_URL) {
    return NextResponse.json(
      { error: 'AGA8_SERVICE_URL no configurado — usando Papay como fallback' },
      { status: 503 },
    )
  }

  try {
    const body = await req.json()
    const upstream = await fetch(`${SERVICE_URL}/aga8`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    if (!upstream.ok) {
      const text = await upstream.text()
      return NextResponse.json({ error: text }, { status: upstream.status })
    }
    const data = await upstream.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
