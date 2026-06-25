'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DatosProceso, VariablesAvanzadas, ResultadoTecnologia, Actividad } from '@/types/medicion'

export interface ActualizarInput {
  id: string
  nombre: string
  cliente: string
  datos: DatosProceso
  adv: VariablesAvanzadas
  tech: ResultadoTecnologia
  actividades: Actividad[]
}

export async function actualizarProyecto(input: ActualizarInput): Promise<void> {
  const supabase = await createClient()

  const { error: e1 } = await supabase
    .from('proyectos')
    .update({ nombre: input.nombre, cliente: input.cliente || null, tipo_punto: input.datos.tipo })
    .eq('id', input.id)
  if (e1) throw new Error(e1.message)

  const { error: e2 } = await supabase
    .from('fase1_datos')
    .upsert({
      proyecto_id: input.id,
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
    }, { onConflict: 'proyecto_id' })
  if (e2) throw new Error(e2.message)

  // upsert actividades — preserva estado y notas de las existentes
  const rows = input.actividades.map(a => ({
    proyecto_id: input.id,
    actividad_id_interno: a.id,
    nombre: a.nombre,
    etapa: a.etapa,
    estado: a.estado,
    responsable_rol: a.responsable_rol,
    responsable_tipo: a.responsable_tipo,
    accion_sugerida: a.accion_sugerida,
    bloquea_exportacion_final: a.bloquea_exportacion_final,
  }))
  const { error: e3 } = await supabase
    .from('actividades')
    .upsert(rows, { onConflict: 'proyecto_id,actividad_id_interno' })
  if (e3) throw new Error(e3.message)

  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${input.id}`)
}
