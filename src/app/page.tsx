import { createClient } from '@/lib/supabase/server'
import Disenador, { type InitialData } from '@/components/Disenador'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ proyecto?: string }>
}) {
  const { proyecto: proyectoId } = await searchParams

  let initialData: InitialData | null = null

  if (proyectoId) {
    const supabase = await createClient()
    const [{ data: proyecto }, { data: f1 }] = await Promise.all([
      supabase.from('proyectos').select('nombre, cliente, tipo_punto').eq('id', proyectoId).single(),
      supabase.from('fase1_datos').select('*').eq('proyecto_id', proyectoId).single(),
    ])
    if (proyecto && f1) {
      initialData = {
        proyectoId,
        nombre: proyecto.nombre,
        cliente: proyecto.cliente ?? '',
        tipo_punto: proyecto.tipo_punto,
        fase1: f1,
      }
    }
  }

  return <Disenador initialData={initialData} />
}
