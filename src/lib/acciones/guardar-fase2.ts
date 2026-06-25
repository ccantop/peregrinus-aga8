'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Fase2Input {
  proyecto_id: string
  // Levantamiento físico
  interferencias_descripcion: string
  tramos_rectos_disponibles: number | null
  orientacion_instalacion: string
  vibracion_notas: string
  espacio_fisico_cm2: number | null
  // Civil / sismo
  tipo_suelo: string
  zona_sismica: string
  profundidad_enterrado_m: number | null
  // Eléctrico
  clasificacion_area: string
  clase_division_zona: string
  // Instrumento real
  fabricante: string
  modelo: string
  numero_serie: string
  dimensiones_json: {
    largo_mm: number | null
    ancho_mm: number | null
    alto_mm: number | null
    face_to_face_mm: number | null
    peso_kg: number | null
  }
}

export async function guardarFase2(input: Fase2Input): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from('fase2_datos').upsert(
    {
      proyecto_id:                   input.proyecto_id,
      interferencias_descripcion:    input.interferencias_descripcion || null,
      tramos_rectos_disponibles:     input.tramos_rectos_disponibles,
      orientacion_instalacion:       input.orientacion_instalacion || null,
      vibracion_notas:               input.vibracion_notas || null,
      espacio_fisico_cm2:            input.espacio_fisico_cm2,
      tipo_suelo:                    input.tipo_suelo || null,
      zona_sismica:                  input.zona_sismica || null,
      profundidad_enterrado_m:       input.profundidad_enterrado_m,
      clasificacion_area:            input.clasificacion_area || null,
      clase_division_zona:           input.clase_division_zona || null,
      fabricante:                    input.fabricante || null,
      modelo:                        input.modelo || null,
      numero_serie:                  input.numero_serie || null,
      dimensiones_json:              input.dimensiones_json,
    },
    { onConflict: 'proyecto_id' }
  )

  if (error) return { ok: false, error: error.message }

  // Avanzar fase_actual a fase2
  await supabase
    .from('proyectos')
    .update({ fase_actual: 'fase2' })
    .eq('id', input.proyecto_id)

  revalidatePath(`/proyectos/${input.proyecto_id}`)
  revalidatePath(`/proyectos/${input.proyecto_id}/fase2`)
  return { ok: true }
}
