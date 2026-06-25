import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { TodasHojasPDF } from '@/lib/pdf/todas-hojas-pdf'
import { getInstrumentosBase } from '@/lib/instrumentos'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = await createClient()
  const [{ data: proyecto }, { data: f1 }, { data: hojas }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('hojas_datos').select('*').eq('proyecto_id', id).order('tag'),
  ])

  if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  // Construir lista completa: hojas guardadas + placeholders para las que faltan
  const base = f1 ? getInstrumentosBase(
    f1.tecnologia_key ?? 'ultrasonico',
    Number(f1.presion_kgcm2), Number(f1.qmin), Number(f1.qnorm), Number(f1.qmax),
    Number(f1.diametro_pulg),
  ) : []

  const hojaMap = new Map((hojas ?? []).map(h => [h.tag, h]))

  const todasHojas = base.map(b => hojaMap.get(b.tag) ?? {
    tag: b.tag,
    tipo_inst: b.tipo_inst,
    servicio: b.servicio,
    senal_salida: b.senal_salida,
    protocolo_com: b.protocolo_com,
    conexion_proceso: b.conexion_proceso,
    material_partes_mojadas: b.material_partes_mojadas,
    unidad_rango: b.unidad_rango,
    estado: 'borrador',
    revision: '0',
    incompleto: true,
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(TodasHojasPDF, { proyecto, f1, hojas: todasHojas }) as any
  const buf = await renderToBuffer(element)

  const slug = proyecto.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="peregrin-${slug}-hojas-r0.pdf"`,
    },
  })
}
