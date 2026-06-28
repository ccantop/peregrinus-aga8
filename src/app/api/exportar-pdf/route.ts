import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { ReportePDF } from '@/lib/pdf/reporte-pdf'
import { getLogoSrc } from '@/lib/pdf/logo'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = await createClient()
  const [{ data: proyecto }, { data: f1 }, { data: acts }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('actividades').select('*').eq('proyecto_id', id).order('etapa').order('nombre'),
  ])

  if (!proyecto || !f1) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logoSrc = await getLogoSrc()
  const element = React.createElement(ReportePDF, { d: { logoSrc, proyecto, f1, actividades: acts ?? [] } }) as any
  const buf = await renderToBuffer(element)
  const bytes = new Uint8Array(buf)

  const slug = proyecto.nombre
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="peregrin-${slug}-r0.pdf"`,
    },
  })
}
