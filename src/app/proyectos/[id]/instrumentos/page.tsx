import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstrumentosBase, TIPO_LABEL } from '@/lib/instrumentos'

const ESTADO_COLOR: Record<string, string> = {
  borrador:  'rgba(193,127,36,0.12)',
  revisado:  'rgba(74,158,187,0.12)',
  aprobado:  'rgba(45,140,78,0.12)',
}
const ESTADO_TXT: Record<string, string> = {
  borrador:  '#c17f24',
  revisado:  '#4a9ebb',
  aprobado:  '#2d8c4e',
}

export default async function InstrumentosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proyecto }, { data: f1 }, { data: hojas }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('hojas_datos').select('*').eq('proyecto_id', id).order('tag'),
  ])

  if (!proyecto) notFound()

  // Instrumentos base según tecnología
  const base = f1 ? getInstrumentosBase(
    f1.tecnologia_key ?? 'ultrasonico',
    Number(f1.presion_kgcm2),
    Number(f1.qmin), Number(f1.qnorm), Number(f1.qmax),
    Number(f1.diametro_pulg),
  ) : []

  const hojaMap = new Map((hojas ?? []).map(h => [h.tag, h]))

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-5" style={{ color: 'var(--ink3)' }}>
        <Link href="/proyectos" style={{ color: 'var(--accent)' }} className="hover:underline">Mis proyectos</Link>
        <span>/</span>
        <Link href={`/proyectos/${id}`} style={{ color: 'var(--accent)' }} className="hover:underline">{proyecto.nombre}</Link>
        <span>/</span>
        <span>Hojas de datos</span>
      </div>

      {/* encabezado */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>
            Hojas de datos de instrumentos
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--ink3)' }}>
            {proyecto.nombre} · {base.length} instrumentos · formato ISA/IEC
          </p>
        </div>
        <a
          href={`/api/exportar-hojas?id=${id}`}
          download
          className="rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 shrink-0"
          style={{ background: 'var(--accent2)', color: '#fff' }}
        >
          Generar hojas de datos ↓
        </a>
      </div>

      {/* tabla de instrumentos */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
        {/* encabezado tabla */}
        <div className="grid text-[10.5px] font-mono uppercase tracking-wider px-4 py-2.5"
          style={{
            gridTemplateColumns: '90px 1fr 1fr 80px 90px',
            background: 'var(--panel)', borderBottom: '1px solid var(--line)', color: 'var(--ink3)'
          }}>
          <span>Tag</span>
          <span>Tipo</span>
          <span>Servicio</span>
          <span>Estado</span>
          <span></span>
        </div>

        {base.map((inst, i) => {
          const hoja = hojaMap.get(inst.tag)
          const estado = hoja?.estado ?? 'sin datos'
          return (
            <div
              key={inst.tag}
              className="grid items-center px-4 py-3 text-sm"
              style={{
                gridTemplateColumns: '90px 1fr 1fr 80px 90px',
                borderBottom: i < base.length - 1 ? '1px solid var(--line)' : 'none',
                background: i % 2 === 0 ? 'var(--panel)' : 'transparent',
              }}
            >
              <span className="font-mono font-semibold text-xs" style={{ color: 'var(--accent)' }}>
                {inst.tag}
              </span>
              <span className="text-xs" style={{ color: 'var(--ink2)' }}>
                {TIPO_LABEL[inst.tipo_inst] ?? inst.tipo_inst}
              </span>
              <span className="text-xs truncate pr-4" style={{ color: 'var(--ink3)' }}>
                {hoja?.servicio ?? inst.servicio}
              </span>
              <span>
                {hoja ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{
                      background: ESTADO_COLOR[hoja.estado],
                      color: ESTADO_TXT[hoja.estado],
                    }}>
                    {hoja.estado}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--ink3)', border: '1px solid var(--line)' }}>
                    sin datos
                  </span>
                )}
              </span>
              <Link
                href={`/proyectos/${id}/instrumentos/${inst.tag}`}
                className="text-xs text-right hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                {hoja ? 'Editar →' : 'Completar →'}
              </Link>
            </div>
          )
        })}
      </div>

      <p className="text-[10.5px] mt-4" style={{ color: 'var(--ink3)' }}>
        Los instrumentos se derivan del diseño de Fase 1. Para agregar o cambiar instrumentos, actualiza la tecnología en el diseñador.
      </p>
    </div>
  )
}
