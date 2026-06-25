'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { toggleActividad, guardarNotaActividad } from '@/lib/acciones/actualizar-actividad'

interface Actividad {
  id: string
  actividad_id_interno: string
  nombre: string
  etapa: number
  estado: string
  responsable_rol: string
  responsable_tipo: string
  accion_sugerida: string | null
  bloquea_exportacion_final: boolean
  notas: string | null
}

const estadoLabel: Record<string, string> = {
  tienes:     'Listo',
  falta:      'Falta',
  en_proceso: 'En proceso',
}
const estadoColor: Record<string, string> = {
  tienes:     '#2e7d32',
  falta:      '#b84030',
  en_proceso: '#c17f24',
}
const estadoBg: Record<string, string> = {
  tienes:     'rgba(46,125,50,0.08)',
  falta:      'rgba(184,64,48,0.08)',
  en_proceso: 'rgba(193,127,36,0.08)',
}
const tipoLabel: Record<string, string> = {
  interno_energon:      'Interno',
  externo_obligatorio:  'Externo obligatorio',
  externo_opcional:     'Externo',
}
const ciclo: Record<string, string> = {
  falta: 'en_proceso', en_proceso: 'tienes', tienes: 'falta',
}

export default function ActividadesEditor({
  actividades,
  proyectoId,
}: {
  actividades: Actividad[]
  proyectoId: string
}) {
  const [acts, setOptimistic] = useOptimistic(
    actividades,
    (prev, { id, estado }: { id: string; estado: string }) =>
      prev.map(a => a.id === id ? { ...a, estado } : a)
  )
  const [, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notaDraft, setNotaDraft] = useState<Record<string, string>>({})
  const [guardandoNota, setGuardandoNota] = useState<string | null>(null)

  const huecos = acts.filter(a => a.bloquea_exportacion_final && a.estado === 'falta')

  function handleToggle(act: Actividad) {
    const nuevoEstado = ciclo[act.estado] ?? 'falta'
    startTransition(async () => {
      setOptimistic({ id: act.id, estado: nuevoEstado })
      await toggleActividad(act.id, proyectoId, act.estado)
    })
  }

  async function handleGuardarNota(actId: string) {
    setGuardandoNota(actId)
    await guardarNotaActividad(actId, proyectoId, notaDraft[actId] ?? '')
    setGuardandoNota(null)
  }

  // agrupar por etapa
  const etapas = [...new Set(acts.map(a => a.etapa))].sort((a, b) => a - b)

  return (
    <div>
      {huecos.length > 0 && (
        <div
          className="rounded-md px-3 py-2.5 text-xs mb-4"
          style={{ background: 'rgba(184,64,48,0.08)', borderLeft: '3px solid var(--danger)', color: 'var(--ink2)' }}
        >
          <b style={{ color: 'var(--danger)' }}>
            {huecos.length} hueco{huecos.length !== 1 ? 's' : ''} bloqueante{huecos.length !== 1 ? 's' : ''}
          </b>
          {' '}— el plano no puede exportarse para firma hasta resolverlos.
        </div>
      )}

      {etapas.map(etapa => (
        <div key={etapa} className="mb-5">
          <div
            className="text-[10px] font-mono uppercase tracking-widest mb-2 pb-1 border-b"
            style={{ color: 'var(--ink3)', borderColor: 'var(--line)' }}
          >
            Etapa {etapa}
          </div>

          <div className="space-y-1.5">
            {acts.filter(a => a.etapa === etapa).map(act => (
              <div key={act.id}>
                <div
                  className="rounded-md border px-3 py-2.5 flex gap-3 items-start"
                  style={{
                    background: act.bloquea_exportacion_final && act.estado === 'falta' ? '#fff5f4' : 'var(--bg)',
                    borderColor: act.bloquea_exportacion_final && act.estado === 'falta'
                      ? 'rgba(184,64,48,0.3)' : 'var(--line)',
                  }}
                >
                  {/* botón estado (toggle) */}
                  <button
                    onClick={() => handleToggle(act)}
                    className="shrink-0 mt-0.5 text-[10px] font-mono px-2 py-1 rounded cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      background: estadoBg[act.estado],
                      color: estadoColor[act.estado],
                      border: `1px solid ${estadoColor[act.estado]}44`,
                      minWidth: 76,
                    }}
                    title="Clic para cambiar estado"
                  >
                    {estadoLabel[act.estado]}
                  </button>

                  {/* contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>
                        {act.nombre}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--ink3)' }}
                      >
                        {tipoLabel[act.responsable_tipo]}
                      </span>
                      {act.bloquea_exportacion_final && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(184,64,48,0.08)', color: 'var(--danger)' }}
                        >
                          Bloquea firma
                        </span>
                      )}
                    </div>
                    {act.accion_sugerida && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink3)' }}>
                        {act.accion_sugerida}
                      </p>
                    )}
                    {act.notas && expandedId !== act.id && (
                      <p className="text-[11px] mt-1 italic" style={{ color: 'var(--ink2)' }}>
                        {act.notas}
                      </p>
                    )}
                  </div>

                  {/* botón notas */}
                  <button
                    onClick={() => {
                      setExpandedId(expandedId === act.id ? null : act.id)
                      if (!notaDraft[act.id]) setNotaDraft(d => ({ ...d, [act.id]: act.notas ?? '' }))
                    }}
                    className="shrink-0 text-[10px] px-2 py-1 rounded cursor-pointer transition-colors hover:bg-[#eef4f7]"
                    style={{ color: act.notas ? 'var(--accent)' : 'var(--ink3)', border: '1px solid var(--line)' }}
                    title="Agregar / editar nota"
                  >
                    {act.notas ? '✎ nota' : '+ nota'}
                  </button>
                </div>

                {/* panel de nota */}
                {expandedId === act.id && (
                  <div
                    className="mx-1 rounded-b-md border border-t-0 px-3 py-2.5 flex gap-2"
                    style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                  >
                    <textarea
                      className="flex-1 text-xs rounded px-2 py-1.5 resize-none"
                      style={{
                        background: '#f2f7f9',
                        border: '1px solid #cddde5',
                        color: 'var(--ink)',
                        minHeight: 60,
                      }}
                      placeholder="Agrega una nota o referencia..."
                      value={notaDraft[act.id] ?? ''}
                      onChange={e => setNotaDraft(d => ({ ...d, [act.id]: e.target.value }))}
                    />
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => handleGuardarNota(act.id)}
                        disabled={guardandoNota === act.id}
                        className="text-[11px] px-3 py-1.5 rounded font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        {guardandoNota === act.id ? '…' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setExpandedId(null)}
                        className="text-[11px] px-3 py-1.5 rounded cursor-pointer transition-colors hover:bg-[#eef4f7]"
                        style={{ border: '1px solid var(--line)', color: 'var(--ink3)' }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
