import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Fase2Form from '@/components/Fase2Form'

export default async function Fase2Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proyecto }, { data: f1 }, { data: f2 }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('tecnologia_nombre, diametro_pulg').eq('proyecto_id', id).single(),
    supabase.from('fase2_datos').select('*').eq('proyecto_id', id).maybeSingle(),
  ])

  if (!proyecto) notFound()

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-5" style={{ color: 'var(--ink3)' }}>
        <Link href="/proyectos" className="hover:underline" style={{ color: 'var(--accent)' }}>
          Mis proyectos
        </Link>
        <span>/</span>
        <Link href={`/proyectos/${id}`} className="hover:underline" style={{ color: 'var(--accent)' }}>
          {proyecto.nombre}
        </Link>
        <span>/</span>
        <span>Fase 2 — Detalle</span>
      </div>

      {/* encabezado */}
      <div className="mb-7">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>
            Datos de sitio — Fase 2
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ background: 'rgba(74,158,187,0.10)', color: 'var(--accent)', border: '1px solid rgba(74,158,187,0.3)' }}>
            {proyecto.nombre}
          </span>
        </div>
        <p className="text-xs mt-1.5 leading-relaxed max-w-lg" style={{ color: 'var(--ink3)' }}>
          Registra los datos de levantamiento en campo, clasificación de área, condiciones civiles y la
          selección real del instrumento. Estos datos permiten emitir planos de detalle y hojas de datos.
        </p>
      </div>

      {/* aviso si ya está en fase2 */}
      {proyecto.fase_actual === 'fase2' && (
        <div className="rounded-md border px-4 py-3 text-xs mb-6"
          style={{ borderColor: 'rgba(45,140,78,0.3)', background: 'rgba(45,140,78,0.06)', color: '#2d6e3e' }}>
          Este proyecto ya tiene datos de Fase 2 registrados. Puedes actualizarlos a continuación.
        </div>
      )}

      <Fase2Form
        proyectoId={id}
        f1={{ tecnologia_nombre: f1?.tecnologia_nombre, diametro_pulg: f1?.diametro_pulg }}
        initial={f2}
      />
    </div>
  )
}
