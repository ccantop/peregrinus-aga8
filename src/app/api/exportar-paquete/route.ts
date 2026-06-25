import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { PDFDocument, PageSizes } from 'pdf-lib'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { MemoriaCalculoPDF, type DatosMemoria } from '@/lib/pdf/memoria-calculo-pdf'
import { ReportePDF } from '@/lib/pdf/reporte-pdf'
import { calcularCondicionesFisicas } from '@/lib/engine/calculo-z'
import { generarPIDSvg } from '@/lib/pdf/pid-svg'

const AGA8_URL = process.env.AGA8_SERVICE_URL

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = await createClient()
  const [{ data: proyecto }, { data: f1 }, { data: acts }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('actividades').select('*').eq('proyecto_id', id).order('etapa').order('nombre'),
  ])

  if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  if (!f1)       return NextResponse.json({ error: 'Fase 1 no encontrada' }, { status: 404 })

  // AGA8
  let aga8: DatosMemoria['aga8'] = null
  if (AGA8_URL) {
    try {
      const res = await fetch(`${AGA8_URL}/aga8`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presion_kpa: Number(f1.presion_kgcm2) * 98.0665 + 101.325,
          temperatura_k: Number(f1.tamb_min_c ?? 20) + 273.15,
          sg: Number(f1.sg ?? 0.65),
          co2_pct: Number(f1.co2_pct ?? 2),
          n2_pct: Number(f1.n2_pct ?? 1),
        }),
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) aga8 = await res.json()
    } catch { /* fallback Papay */ }
  }

  const vars = {
    sg: Number(f1.sg ?? 0.65),
    patm_kpa: Number(f1.presion_kgcm2) * 98.0665 + 101.325,
    tamb_min_c: Number(f1.tamb_min_c ?? 20),
    dp_regulador_bar: Number(f1.dp_regulador_bar ?? 5),
    dew_agua_c: Number(f1.dew_agua_c ?? -10),
    dew_hc_c: Number(f1.dew_hc_c ?? -20),
    co2_pct: Number(f1.co2_pct ?? 2),
    n2_pct: Number(f1.n2_pct ?? 1),
    viscosidad_cp: 0.012,
    toma_diferencial: 'brida' as const,
    elevacion_msnm: Number(f1.elevacion_msnm ?? 0),
    p_base_kpa: Number(f1.p_base_kpa ?? 101.325),
    t_base_c: Number(f1.t_base_c ?? 15.6),
  }
  const calculo = calcularCondicionesFisicas(vars)

  const dMemoria: DatosMemoria = {
    proyecto, f1, aga8,
    calculo: {
      Z_papay: calculo.Z_papay,
      Tr: calculo.Tr,
      Pr: calculo.Pr,
      caida_jt_c: calculo.caida_jt_c,
      t_salida_regulador_c: calculo.t_salida_regulador_c,
      alertas: calculo.alertas,
    },
  }

  // Generar P&ID como SVG → PNG para embeber en PDF
  const pidSvg = generarPIDSvg({
    tecnologia_nombre:     f1.tecnologia_nombre ?? 'Por definir',
    tecnologia_referencia: f1.tecnologia_referencia ?? '',
    tecnologia_key:        f1.tecnologia_key ?? '',
    diametro_pulg:         Number(f1.diametro_pulg),
    presion_kgcm2:         Number(f1.presion_kgcm2),
    qnorm:                 Number(f1.qnorm),
  })
  const pidPng = await sharp(Buffer.from(pidSvg)).resize(1800).png().toBuffer()

  // Generar los dos PDFs en paralelo
  const [memoriaBuffer, reporteBuffer] = await Promise.all([
    renderToBuffer(React.createElement(MemoriaCalculoPDF, { d: dMemoria }) as never),
    renderToBuffer(React.createElement(ReportePDF, { d: { proyecto, f1, actividades: acts ?? [] } }) as never),
  ])

  // Fusionar con pdf-lib
  const merged = await PDFDocument.create()
  merged.setTitle(`Paquete de ingeniería — ${proyecto.nombre}`)
  merged.setAuthor('Peregrin')

  for (const buf of [memoriaBuffer, reporteBuffer]) {
    const src = await PDFDocument.load(new Uint8Array(buf))
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }

  // Página P&ID: A4 horizontal con el PNG centrado
  const pidImg  = await merged.embedPng(pidPng)
  const pidPage = merged.addPage([PageSizes.A4[1], PageSizes.A4[0]])  // landscape
  const { width, height } = pidPage.getSize()
  const scale = Math.min(width / pidImg.width, height / pidImg.height) * 0.92
  const imgW  = pidImg.width  * scale
  const imgH  = pidImg.height * scale
  pidPage.drawImage(pidImg, { x: (width - imgW) / 2, y: (height - imgH) / 2, width: imgW, height: imgH })

  const pdfBytes = await merged.save()

  const slug = proyecto.nombre
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="peregrin-${slug}-paquete.pdf"`,
    },
  })
}
