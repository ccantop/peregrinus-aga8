'use client'

import { createClient } from '@/lib/supabase/client'
import type { DatosProceso, VariablesAvanzadas, ResultadoTecnologia, Actividad } from '@/types/medicion'



export interface GuardarInput {
  nombre: string
  cliente: string
  datos: DatosProceso
  adv: VariablesAvanzadas
  tech: ResultadoTecnologia
  actividades: Actividad[]
  schedule_tuberia?: string
}

export async function guardarProyecto(input: GuardarInput): Promise<string> {
  const supabase = createClient()

  // 1. Crear proyecto
  const { data: { user } } = await supabase.auth.getUser()

  const { data: proyecto, error: errProyecto } = await supabase
    .from('proyectos')
    .insert({
      nombre: input.nombre,
      cliente: input.cliente || null,
      tipo_punto: input.datos.tipo,
      fase_actual: 'fase1',
      user_id: user?.id ?? null,
    })
    .select('id')
    .single()

  if (errProyecto || !proyecto) throw new Error(errProyecto?.message ?? 'Error al crear proyecto')

  const pid = proyecto.id

  // 2. Guardar fase1_datos
  const { error: errFase1 } = await supabase.from('fase1_datos').insert({
    proyecto_id: pid,
    fiscal: input.datos.fiscal,
    fluido: input.datos.fluido,
    qmin: input.datos.qmin,
    qnorm: input.datos.qnorm,
    qmax: input.datos.qmax,
    presion_kgcm2: input.datos.presion_kgcm2,
    diametro_pulg: input.datos.diametro_pulg,
    clase_localizacion: input.datos.clase_localizacion,
    sg: input.adv.sg,
    co2_pct: input.adv.co2_pct,
    n2_pct: input.adv.n2_pct,
    viscosidad_cp: input.adv.viscosidad_cp,
    toma_diferencial: input.adv.toma_diferencial,
    elevacion_msnm: input.adv.elevacion_msnm,
    patm_kpa: input.adv.patm_kpa,
    tamb_min_c: input.adv.tamb_min_c,
    p_base_kpa: input.adv.p_base_kpa,
    t_base_c: input.adv.t_base_c,
    dew_agua_c: input.adv.dew_agua_c,
    dew_hc_c: input.adv.dew_hc_c,
    dp_regulador_bar: input.adv.dp_regulador_bar,
    tecnologia_key: input.tech.key,
    tecnologia_nombre: input.tech.nombre,
    tecnologia_motivo: input.tech.motivo,
    schedule_tuberia: input.schedule_tuberia ?? 'sch40',
  })

  if (errFase1) throw new Error(errFase1.message)

  // 3. Guardar actividades
  const rows = input.actividades.map(a => ({
    proyecto_id: pid,
    actividad_id_interno: a.id,
    nombre: a.nombre,
    etapa: a.etapa,
    estado: a.estado,
    responsable_rol: a.responsable_rol,
    responsable_tipo: a.responsable_tipo,
    accion_sugerida: a.accion_sugerida,
    bloquea_exportacion_final: a.bloquea_exportacion_final,
  }))

  const { error: errActs } = await supabase.from('actividades').insert(rows)
  if (errActs) throw new Error(errActs.message)

  return pid
}
