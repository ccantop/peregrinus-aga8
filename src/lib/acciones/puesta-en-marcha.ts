'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleItem(proyectoId: string, itemKey: string, completado: boolean) {
  const supabase = await createClient()
  await supabase.from('puesta_en_marcha').upsert({
    proyecto_id: proyectoId,
    item_key: itemKey,
    completado,
    completado_en: completado ? new Date().toISOString() : null,
  }, { onConflict: 'proyecto_id,item_key' })
  revalidatePath(`/proyectos/${proyectoId}/puesta-en-marcha`)
}
