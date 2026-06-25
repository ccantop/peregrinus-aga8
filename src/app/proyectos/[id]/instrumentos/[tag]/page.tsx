import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstrumentosBase, TIPO_LABEL } from '@/lib/instrumentos'
import HojaDatosForm from '@/components/HojaDatosForm'

export default async function HojaDatosPage({
  params,
}: {
  params: Promise<{ id: string; tag: string }>
}) {
  const { id, tag } = await params
  const tagDec = decodeURIComponent(tag)
  const supabase = await createClient()

  const [{ data: proyecto }, { data: f1 }, { data: hoja }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('hojas_datos').select('*').eq('proyecto_id', id).eq('tag', tagDec).maybeSingle(),
  ])

  if (!proyecto) notFound()

  // Valores por defecto del catálogo
  const base = f1 ? getInstrumentosBase(
    f1.tecnologia_key ?? 'ultrasonico',
    Number(f1.presion_kgcm2),
    Number(f1.qmin), Number(f1.qnorm), Number(f1.qmax),
    Number(f1.diametro_pulg),
  ) : []

  const baseInst = base.find(b => b.tag === tagDec)
  if (!baseInst) notFound()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-5 flex-wrap" style={{ color: 'var(--ink3)' }}>
        <Link href="/proyectos" style={{ color: 'var(--accent)' }} className="hover:underline">Mis proyectos</Link>
        <span>/</span>
        <Link href={`/proyectos/${id}`} style={{ color: 'var(--accent)' }} className="hover:underline">{proyecto.nombre}</Link>
        <span>/</span>
        <Link href={`/proyectos/${id}/instrumentos`} style={{ color: 'var(--accent)' }} className="hover:underline">Hojas de datos</Link>
        <span>/</span>
        <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>{tagDec}</span>
      </div>

      {/* encabezado */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold font-mono" style={{ color: 'var(--accent)' }}>
              {tagDec}
            </h1>
            <span className="text-sm" style={{ color: 'var(--ink2)' }}>
              {TIPO_LABEL[hoja?.tipo_inst ?? baseInst.tipo_inst]}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--ink3)' }}>
            {proyecto.nombre} · Hoja de datos ISA/IEC
          </p>
        </div>
        <a
          href={`/api/exportar-hoja?id=${id}&tag=${tagDec}`}
          download
          className="rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 shrink-0"
          style={{ background: hoja ? 'var(--accent2)' : '#c8d8e0', color: hoja ? '#fff' : '#5a7a8a' }}
          title={hoja ? 'Descargar PDF' : 'Descargar PDF con datos incompletos'}
        >
          {hoja ? 'Generar hoja de datos ↓' : 'Generar hoja de datos ↓'}
        </a>
      </div>

      <HojaDatosForm
        proyectoId={id}
        baseInst={baseInst}
        f1={f1}
        initial={hoja}
      />
    </div>
  )
}
