import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const tipoLabel: Record<string, string> = {
  city_gate: 'City Gate',
  industrial: 'Industrial',
  ducto: 'Ducto regional',
  auditoria: 'Auditoría',
}

export default async function ProyectosPage() {
  const supabase = await createClient()

  const { data: proyectos, error } = await supabase
    .from('proyectos')
    .select(`
      id, nombre, cliente, tipo_punto, fase_actual, creado_en,
      fase1_datos ( tecnologia_nombre, fiscal, qmax ),
      actividades ( estado, bloquea_exportacion_final ),
      puesta_en_marcha ( completado )
    `)
    .order('creado_en', { ascending: false })

  if (error) {
    return (
      <div className="max-w-[1260px] mx-auto px-6 py-8 text-sm" style={{ color: 'var(--danger)' }}>
        Error al cargar proyectos: {error.message}
      </div>
    )
  }

  return (
    <div className="max-w-[1260px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>Mis proyectos</h1>
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--ink3)' }}>
            {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} guardados
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#ffffff' }}
        >
          + Nuevo proyecto
        </Link>
      </div>

      {proyectos.length === 0 ? (
        <div
          className="rounded-lg border flex flex-col items-center justify-center py-24 gap-3"
          style={{ borderColor: 'var(--line)', color: 'var(--ink3)', background: 'var(--panel)' }}
        >
          <span className="text-sm">No hay proyectos guardados</span>
          <Link href="/" className="text-xs" style={{ color: 'var(--accent)' }}>
            Crear primer proyecto →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {proyectos.map(p => {
            const f1 = Array.isArray(p.fase1_datos) ? p.fase1_datos[0] : p.fase1_datos as {
              tecnologia_nombre?: string; fiscal?: boolean; qmax?: number
            } | null
            const acts = Array.isArray(p.actividades) ? p.actividades as { estado: string; bloquea_exportacion_final: boolean }[] : []
            const huecos = acts.filter(a => a.bloquea_exportacion_final && a.estado === 'falta').length
            const pem = Array.isArray(p.puesta_en_marcha) ? p.puesta_en_marcha as { completado: boolean }[] : []
            const pemTotal = pem.length
            const pemDone = pem.filter(c => c.completado).length
            const fecha = new Date(p.creado_en).toLocaleDateString('es-MX', {
              day: '2-digit', month: 'short', year: 'numeric',
            })

            return (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="group rounded-lg border px-5 py-4 flex gap-4 items-center transition-colors hover:border-[#4a9ebb]"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
              >
                {/* tipo pill */}
                <div
                  className="shrink-0 text-[10px] font-mono uppercase px-2 py-1 rounded"
                  style={{ background: 'rgba(74,158,187,0.08)', color: 'var(--ink3)', border: '1px solid var(--line)', minWidth: 88, textAlign: 'center' }}
                >
                  {tipoLabel[p.tipo_punto] ?? p.tipo_punto}
                </div>

                {/* nombre + metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{p.nombre}</span>
                    {p.cliente && (
                      <span className="text-xs" style={{ color: 'var(--ink3)' }}>{p.cliente}</span>
                    )}
                    {f1?.fiscal && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(74,158,187,0.10)', color: 'var(--accent)', border: '1px solid rgba(74,158,187,0.3)' }}>
                        FISCAL
                      </span>
                    )}
                    {huecos > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(184,64,48,0.08)', color: 'var(--danger)', border: '1px solid rgba(184,64,48,0.25)' }}>
                        {huecos} bloqueante{huecos !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1.5 flex-wrap">
                    {f1?.tecnologia_nombre && (
                      <span className="text-xs" style={{ color: 'var(--ink2)' }}>
                        {f1.tecnologia_nombre}
                      </span>
                    )}
                    {f1?.qmax != null && (
                      <span className="text-xs font-mono" style={{ color: 'var(--ink3)' }}>
                        Qmax {Number(f1.qmax).toLocaleString('es-MX')} m³/h
                      </span>
                    )}
                  </div>
                </div>

                {/* semáforo puesta en marcha — visible desde que existe Fase 1 */}
                {f1?.tecnologia_nombre && (
                  <div className="shrink-0 flex flex-col items-center gap-1"
                    title={pemTotal === 0
                      ? 'Puesta en marcha: no iniciada'
                      : `Puesta en marcha: ${pemDone}/${pemTotal} completados`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: pemTotal === 0
                          ? 'rgba(107,114,128,0.08)'
                          : pemDone === pemTotal
                            ? 'rgba(34,197,94,0.15)'
                            : pemDone > 0 ? 'rgba(234,179,8,0.15)' : 'rgba(107,114,128,0.08)',
                        color: pemTotal === 0
                          ? 'var(--ink3)'
                          : pemDone === pemTotal
                            ? '#16a34a'
                            : pemDone > 0 ? '#ca8a04' : 'var(--ink3)',
                        border: `1px solid ${
                          pemTotal === 0 ? 'var(--line)'
                          : pemDone === pemTotal ? 'rgba(34,197,94,0.4)'
                          : pemDone > 0 ? 'rgba(234,179,8,0.4)'
                          : 'var(--line)'
                        }`,
                      }}
                    >
                      {pemTotal === 0 ? '—' : pemDone === pemTotal ? '✓' : `${Math.round(pemDone / pemTotal * 100)}%`}
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: 'var(--ink3)' }}>PM</span>
                  </div>
                )}

                {/* fecha + fase + flecha */}
                <div className="shrink-0 text-right flex flex-col gap-1">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--ink3)' }}>{fecha}</span>
                  <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--ink3)' }}>{p.fase_actual}</span>
                  <span className="text-xs mt-1 transition-colors group-hover:text-[#4a9ebb]" style={{ color: 'var(--ink3)' }}>
                    Ver →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
