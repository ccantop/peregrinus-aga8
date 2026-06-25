'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ciclo: Record<string, string> = {
  falta:      'en_proceso',
  en_proceso: 'tienes',
  tienes:     'falta',
}

export async function toggleActividad(actId: string, proyectoId: string, estadoActual: string) {
  const supabase = await createClient()
  const nuevoEstado = ciclo[estadoActual] ?? 'falta'
  const { error } = await supabase
    .from('actividades')
    .update({ estado: nuevoEstado })
    .eq('id', actId)
  if (error) throw new Error(error.message)
  revalidatePath(`/proyectos/${proyectoId}`)
}

export async function guardarNotaActividad(actId: string, proyectoId: string, notas: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('actividades')
    .update({ notas })
    .eq('id', actId)
  if (error) throw new Error(error.message)
  revalidatePath(`/proyectos/${proyectoId}`)
}
