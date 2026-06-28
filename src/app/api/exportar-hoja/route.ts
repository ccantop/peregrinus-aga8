import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { HojaDatosPDF } from '@/lib/pdf/hoja-datos-pdf'
import { getInstrumentosBase } from '@/lib/instrumentos'
import { getLogoSrc } from '@/lib/pdf/logo'

export async function GET(req: NextRequest) {
  const id  = req.nextUrl.searchParams.get('id')
  const tag = req.nextUrl.searchParams.get('tag')
  if (!id || !tag) return NextResponse.json({ error: 'id y tag requeridos' }, { status: 400 })

  const supabase = await createClient()
  const [{ data: proyecto }, { data: f1 }, { data: hoja }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('hojas_datos').select('*').eq('proyecto_id', id).eq('tag', tag).maybeSingle(),
  ])

  if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  // Si no hay hoja guardada, construir un placeholder con datos base del catálogo
  const hojaEfectiva = hoja ?? (() => {
    const base = f1 ? getInstrumentosBase(
      f1.tecnologia_key ?? 'ultrasonico',
      Number(f1.presion_kgcm2), Number(f1.qmin), Number(f1.qnorm), Number(f1.qmax),
      Number(f1.diametro_pulg),
    ) : []
    const b = base.find(i => i.tag === tag)
    return {
      tag,
      tipo_inst:   b?.tipo_inst  ?? '',
      servicio:    b?.servicio   ?? '',
      senal_salida: b?.senal_salida ?? '',
      protocolo_com: b?.protocolo_com ?? '',
      conexion_proceso: b?.conexion_proceso ?? '',
      material_partes_mojadas: b?.material_partes_mojadas ?? '',
      unidad_rango: b?.unidad_rango ?? '',
      estado:      'borrador',
      revision:    '0',
      incompleto:  true,          // flag para mostrar aviso en PDF
      creado_en:   new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    }
  })()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logoSrc = await getLogoSrc()
  const element = React.createElement(HojaDatosPDF, { proyecto, f1, hoja: hojaEfectiva, logoSrc }) as any
  const buf = await renderToBuffer(element)

  const slug = tag.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="peregrin-${slug}-r${hojaEfectiva.revision ?? 0}.pdf"`,
    },
  })
}
