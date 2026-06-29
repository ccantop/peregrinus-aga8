import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarMemoriaWord } from '@/lib/word/memoria-word'
import { calcularCondicionesFisicas, calcularAGA7, calcularAGA3 } from '@/lib/engine/calculo-z'
import type { ScheduleTuberia } from '@/lib/engine/calculo-z'

const _aga8Raw = process.env.AGA8_SERVICE_URL
const AGA8_URL = _aga8Raw
  ? _aga8Raw.startsWith('http') ? _aga8Raw : `https://${_aga8Raw}`
  : undefined

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

  // AGA 8
  let aga8: { z: number; rho_kg_m3: number; metodo: string } | null = null
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
  const Zf = aga8?.z ?? calculo.Z_papay

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
        (f1.schedule_tuberia ?? 'sch40') as ScheduleTuberia,
      )
    : null

  const buf = await generarMemoriaWord({
    proyecto, f1, aga8, aga7, aga3,
    calculo: {
      Z_papay: calculo.Z_papay,
      Tr: calculo.Tr,
      Pr: calculo.Pr,
      caida_jt_c: calculo.caida_jt_c,
      t_salida_regulador_c: calculo.t_salida_regulador_c,
      alertas: calculo.alertas,
    },
  })

  const nombre = proyecto.nombre.replace(/[^a-zA-Z0-9_-]/g, '_')
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="memoria-calculo-${nombre}.docx"`,
    },
  })
}
