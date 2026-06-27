'use client'

import type { ResultadoAGA7 } from '@/lib/engine/calculo-z'

interface Props {
  aga7: ResultadoAGA7
  qmin: number
  qnorm: number
  qmax: number
  metodoZ: 'papay' | 'aga8-detail'
}

const chip = (label: string, value: string, accent?: boolean) => (
  <div className="rounded px-3 py-1.5 text-xs"
    style={{
      background: accent ? 'rgba(74,158,187,0.08)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${accent ? 'rgba(74,158,187,0.3)' : 'var(--line)'}`,
    }}>
    <span style={{ color: 'var(--ink3)' }}>{label} </span>
    <b style={{ color: accent ? 'var(--accent)' : 'var(--ink)', fontFamily: 'monospace' }}>{value}</b>
  </div>
)

function QbRow({ label, qb, qt }: { label: string; qb: number; qt: number }) {
  const ratio = qb / Math.max(qt, 0.01)
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0 text-xs"
      style={{ borderColor: 'var(--line)' }}>
      <span style={{ color: 'var(--ink3)' }}>{label}</span>
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--ink2)' }}>
          Qt <b style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>{qt.toLocaleString('es-MX')}</b> m³/h
        </span>
        <span style={{ color: 'var(--ink3)' }}>→</span>
        <span style={{ color: 'var(--ink2)' }}>
          Qb <b style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{qb.toLocaleString('es-MX')}</b> m³/h
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(74,158,187,0.08)', color: 'var(--accent)', border: '1px solid rgba(74,158,187,0.2)' }}>
          ×{ratio.toFixed(3)}
        </span>
      </div>
    </div>
  )
}

export default function TarjetaAGA7({ aga7, qmin, qnorm, qmax, metodoZ }: Props) {
  return (
    <div className="rounded-lg border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
          Corrección a condiciones base — AGA 7
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{
            background: 'rgba(74,158,187,0.08)',
            color: 'var(--accent)',
            border: '1px solid rgba(74,158,187,0.25)',
          }}>
          Fpv = {aga7.Fpv.toFixed(4)}
        </span>
      </div>

      <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--ink2)' }}>
        El medidor registra el caudal <b style={{ color: 'var(--ink)' }}>Qt</b> en condiciones de operación
        (alta presión, temperatura real). Los contratos de gas se facturan en condiciones base
        ({aga7.Pb_kpa} kPa · {(aga7.Tb_k - 273.15).toFixed(1)} °C).
        El factor de supercompresibilidad <b style={{ color: 'var(--ink)' }}>Fpv = √(Zb/Zf · Pf/Pb · Tb/Tf)</b> convierte
        el volumen medido al volumen facturado.
      </p>

      {/* chips de condiciones */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chip('Pf', `${aga7.Pf_kpa} kPa abs`)}
        {chip('Pb', `${aga7.Pb_kpa} kPa`)}
        {chip('Tf', `${(aga7.Tf_k - 273.15).toFixed(1)} °C`)}
        {chip('Tb', `${(aga7.Tb_k - 273.15).toFixed(1)} °C`)}
        {chip('Zf', aga7.Zf.toFixed(5), true)}
        {chip('Zb', aga7.Zb.toFixed(5))}
      </div>

      {/* tabla Qt → Qb */}
      <div className="rounded-md border mb-3" style={{ borderColor: 'var(--line)' }}>
        <QbRow label="Qmáx"  qb={aga7.qb_max}  qt={qmax}  />
        <QbRow label="Qnorm" qb={aga7.qb_norm} qt={qnorm} />
        <QbRow label="Qmín"  qb={aga7.qb_min}  qt={qmin}  />
      </div>

      <p className="text-[10px]" style={{ color: 'var(--ink3)' }}>
        Zf calculado con {metodoZ === 'aga8-detail' ? 'AGA 8 DETAIL (pyaga8)' : 'correlación Papay (screening)'}.
        Zb calculado con Papay a condiciones base. Para cómputo fiscal se requiere AGA 8 DETAIL en ambas condiciones.
      </p>
    </div>
  )
}
