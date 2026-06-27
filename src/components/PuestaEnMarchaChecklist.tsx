'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleItem } from '@/lib/acciones/puesta-en-marcha'

interface Item {
  key: string
  texto: string
  peregrin?: boolean
  href?: string
  nota?: string
}
interface Seccion {
  titulo: string
  color: string
  badge: string
  items: Item[]
}

export default function PuestaEnMarchaChecklist({
  proyectoId,
  secciones,
  checkMap: initialMap,
}: {
  proyectoId: string
  secciones: Seccion[]
  checkMap: Record<string, boolean>
}) {
  const [checks, setOptimistic] = useOptimistic(
    initialMap,
    (prev, { key, val }: { key: string; val: boolean }) => ({ ...prev, [key]: val })
  )
  const [, startTransition] = useTransition()

  const totalItems  = secciones.flatMap(s => s.items).length
  const completados = secciones.flatMap(s => s.items).filter(i => checks[i.key]).length
  const pct = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0

  function handleToggle(key: string) {
    const newVal = !checks[key]
    startTransition(async () => {
      setOptimistic({ key, val: newVal })
      await toggleItem(proyectoId, key, newVal)
    })
  }

  return (
    <>
      {/* barra de progreso */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct === 100 ? '#2d8c4e' : 'var(--accent)' }} />
        </div>
        <span className="text-sm font-mono font-bold shrink-0"
          style={{ color: pct === 100 ? '#2d8c4e' : 'var(--accent)' }}>
          {completados}/{totalItems}
        </span>
        <span className="text-sm font-mono font-bold shrink-0"
          style={{ color: pct === 100 ? '#2d8c4e' : 'var(--accent)' }}>
          {pct}%
        </span>
      </div>

      {/* secciones */}
      <div className="space-y-5">
        {secciones.map(sec => {
          const itemsDone = sec.items.filter(i => checks[i.key]).length
          return (
            <div key={sec.titulo} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: `${sec.color}18`, color: sec.color, border: `1px solid ${sec.color}40` }}>
                    {sec.badge}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{sec.titulo}</span>
                </div>
                <span className="text-[10px] font-mono shrink-0"
                  style={{ color: itemsDone === sec.items.length ? '#2d8c4e' : 'var(--ink3)' }}>
                  {itemsDone}/{sec.items.length}
                </span>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {sec.items.map(item => {
                  const done = !!checks[item.key]
                  return (
                    <div key={item.key} className="flex items-start gap-3 px-4 py-3">
                      <button
                        onClick={() => handleToggle(item.key)}
                        className="mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors"
                        style={{
                          borderColor: done ? sec.color : 'var(--line)',
                          background: done ? `${sec.color}20` : 'var(--panel)',
                          cursor: 'pointer',
                        }}
                      >
                        {done && <span style={{ color: sec.color, fontSize: 10, lineHeight: 1 }}>✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm" style={{
                            color: done ? 'var(--ink3)' : 'var(--ink2)',
                            textDecoration: done ? 'line-through' : 'none',
                          }}>
                            {item.texto}
                          </span>
                          {item.peregrin && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(45,140,78,0.10)', color: '#2d8c4e', border: '1px solid rgba(45,140,78,0.25)' }}>
                              PEREGRIN
                            </span>
                          )}
                        </div>
                        {item.nota && (
                          <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--ink3)' }}>{item.nota}</p>
                        )}
                        {item.href && (
                          <a href={item.href} download
                            className="inline-block text-[10.5px] mt-1 hover:underline"
                            style={{ color: 'var(--accent)' }}>
                            Descargar ↓
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
