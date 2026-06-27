import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { MemoriaCalculoPDF, type DatosMemoria } from '@/lib/pdf/memoria-calculo-pdf'
import { calcularCondicionesFisicas, calcularAGA7, calcularAGA3 } from '@/lib/engine/calculo-z'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = await createClient()
  const [{ data: proyecto }, { data: f1 }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
  ])

  if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  if (!f1)       return NextResponse.json({ error: 'Fase 1 no encontrada' }, { status: 404 })

  // Intentar AGA8 del servicio Python
  const AGA8_URL = process.env.AGA8_SERVICE_URL
  let aga8: DatosMemoria['aga8'] = null
  if (AGA8_URL) {
    try {
      const presionAbsKpa = Number(f1.presion_kgcm2) * 98.0665 + 101.325
      const res = await fetch(`${AGA8_URL}/aga8`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presion_kpa: presionAbsKpa,
          temperatura_k: (Number(f1.tamb_min_c ?? 20) + 273.15),
          sg: Number(f1.sg ?? 0.65),
          co2_pct: Number(f1.co2_pct ?? 2),
          n2_pct: Number(f1.n2_pct ?? 1),
        }),
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) aga8 = await res.json()
    } catch { /* fallback to Papay */ }
  }

  // Cálculo Z Papay + Joule-Thomson
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
  const resultadoCalculo = calcularCondicionesFisicas(vars)

  // AGA 7 — conversión a condiciones base
  const Zf = aga8?.z ?? resultadoCalculo.Z_papay
  const aga7 = calcularAGA7(
    Number(f1.qmin), Number(f1.qnorm), Number(f1.qmax),
    Number(f1.presion_kgcm2), Number(f1.tamb_min_c ?? 20),
    Number(f1.p_base_kpa ?? 101.325), Number(f1.t_base_c ?? 15.6),
    Zf,
  )

  const aga3 = (f1.tecnologia_key === 'orificio' || f1.tecnologia_key === 'diafragma')
    ? calcularAGA3(
        Number(f1.qmax), Number(f1.qnorm), Number(f1.qmin),
        Number(f1.presion_kgcm2), Number(f1.tamb_min_c ?? 20),
        Number(f1.sg ?? 0.65), Zf,
        Number(f1.diametro_pulg),
        (f1.toma_diferencial ?? 'brida') as 'brida' | 'esquina' | 'ddmedio',
        Number(f1.viscosidad_cp ?? 0.012),
        Number(f1.p_base_kpa ?? 101.325), Number(f1.t_base_c ?? 15.6),
      )
    : null

  const d: DatosMemoria = {
    proyecto,
    f1,
    aga8,
    aga7,
    aga3,
    calculo: {
      Z_papay: resultadoCalculo.Z_papay,
      Tr: resultadoCalculo.Tr,
      Pr: resultadoCalculo.Pr,
      caida_jt_c: resultadoCalculo.caida_jt_c,
      t_salida_regulador_c: resultadoCalculo.t_salida_regulador_c,
      alertas: resultadoCalculo.alertas,
    },
  }

  const element = React.createElement(MemoriaCalculoPDF, { d }) as React.ReactElement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = await renderToBuffer(element as any)
  const bytes = new Uint8Array(buf)

  const nombre = proyecto.nombre.replace(/[^a-zA-Z0-9_-]/g, '_')
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="memoria-calculo-${nombre}.pdf"`,
    },
  })
}
