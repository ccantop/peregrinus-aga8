'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface HojaDatosInput {
  proyecto_id: string
  tag: string
  tipo_inst: string
  servicio: string
  linea_equipo: string
  fluido: string
  presion_op_kgcm2: number | null
  presion_dis_kgcm2: number | null
  temp_op_c: number | null
  temp_dis_c: number | null
  caudal_min: number | null
  caudal_nom: number | null
  caudal_max: number | null
  densidad_kgm3: number | null
  viscosidad_cp: number | null
  fabricante_esp: string
  fabricante_real: string
  modelo: string
  numero_serie: string
  rango_min: number | null
  rango_max: number | null
  unidad_rango: string
  exactitud_pct: number | null
  senal_salida: string
  fuente_alimentacion: string
  protocolo_com: string
  conexion_proceso: string
  tamano_conexion: string
  rating_conexion: string
  material_cuerpo: string
  material_partes_mojadas: string
  clasificacion_area: string
  certificacion_ex: string
  grado_proteccion: string
  montaje: string
  revision: string
  estado: 'borrador' | 'revisado' | 'aprobado'
}

export async function guardarHojaDatos(
  input: HojaDatosInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from('hojas_datos').upsert(
    { ...input },
    { onConflict: 'proyecto_id,tag' }
  )

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/proyectos/${input.proyecto_id}/instrumentos`)
  revalidatePath(`/proyectos/${input.proyecto_id}/instrumentos/${input.tag}`)
  return { ok: true }
}
