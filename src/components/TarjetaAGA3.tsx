'use client'

import { SCHEDULE_LABELS, type ResultadoAGA3 } from '@/lib/engine/calculo-z'

interface Props {
  aga3: ResultadoAGA3
  qmin: number
  qnorm: number
  qmax: number
  tecnologia?: 'orificio' | 'diafragma'
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

function DPBar({ dp, dpMax }: { dp: number; dpMax: number }) {
  const pct = Math.min((dp / dpMax) * 100, 100)
  const color = pct > 90 ? '#b84030' : pct > 60 ? '#c17f24' : '#2d8c4e'
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--line)' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono w-16 text-right" style={{ color: 'var(--ink3)' }}>
        {dp} mbar
      </span>
    </div>
  )
}

export default function TarjetaAGA3({ aga3, qmin, qnorm, qmax, tecnologia = 'orificio' }: Props) {
  const titulo = tecnologia === 'diafragma'
    ? 'Diafragma — NOM-002-SECRE / AGA 3'
    : 'Placa de orificio — AGA 3 / ISO 5167'
  return (
    <div className="rounded-lg border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
          {titulo}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{
            background: aga3.valido ? 'rgba(45,140,78,0.1)' : 'rgba(184,64,48,0.1)',
            color: aga3.valido ? '#2d8c4e' : '#b84030',
            border: `1px solid ${aga3.valido ? 'rgba(45,140,78,0.3)' : 'rgba(184,64,48,0.3)'}`,
          }}>
          β = {aga3.beta.toFixed(4)} {aga3.valido ? '✓ rango AGA 3' : '⚠ fuera de rango'}
        </span>
      </div>

      {/* chips principales */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chip('D (tubería)', `${aga3.D_mm} mm — ${SCHEDULE_LABELS[aga3.schedule]}`, false)}
        {chip('d (orificio)', `${aga3.d_mm} mm`, true)}
        {chip('Cd', aga3.Cd.toFixed(4), false)}
        {chip('Ev', aga3.Ev.toFixed(4), false)}
        {chip('ρ flujo', `${aga3.rho_kgm3} kg/m³`, false)}
        {chip('Re (Qmax)', aga3.Re_D_max.toLocaleString('es-MX'), false)}
      </div>

      {/* tabla ΔP */}
      <div className="text-xs mb-1" style={{ color: 'var(--ink3)' }}>
        Presión diferencial — rango transmisor: <b style={{ color: 'var(--ink)' }}>0 – {aga3.dp_objetivo_mbar} mbar</b>
        {' · '}toma: <b style={{ color: 'var(--ink)' }}>{aga3.toma}</b>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px]" style={{ color: 'var(--ink3)' }}>
            <span>Qmáx — {qmax.toLocaleString('es-MX')} m³/h</span>
            <span>{Math.round((aga3.dp_max_mbar / aga3.dp_objetivo_mbar) * 100)}% escala</span>
          </div>
          <DPBar dp={aga3.dp_max_mbar} dpMax={aga3.dp_objetivo_mbar} />
        </div>
        <div>
          <div className="flex justify-between text-[10px]" style={{ color: 'var(--ink3)' }}>
            <span>Qnorm — {qnorm.toLocaleString('es-MX')} m³/h</span>
            <span>{Math.round((aga3.dp_norm_mbar / aga3.dp_objetivo_mbar) * 100)}% escala</span>
          </div>
          <DPBar dp={aga3.dp_norm_mbar} dpMax={aga3.dp_objetivo_mbar} />
        </div>
        <div>
          <div className="flex justify-between text-[10px]" style={{ color: 'var(--ink3)' }}>
            <span>Qmín — {qmin.toLocaleString('es-MX')} m³/h</span>
            <span>{Math.round((aga3.dp_min_mbar / aga3.dp_objetivo_mbar) * 100)}% escala</span>
          </div>
          <DPBar dp={aga3.dp_min_mbar} dpMax={aga3.dp_objetivo_mbar} />
        </div>
      </div>

      {aga3.alerta && (
        <div className="mt-3 rounded-sm pl-3 pr-3 py-2 text-xs"
          style={{ borderLeft: '3px solid #c17f24', background: 'rgba(193,127,36,0.08)', color: 'var(--ink2)' }}>
          {aga3.alerta}
        </div>
      )}

      <p className="text-[10px] mt-3" style={{ color: 'var(--ink3)' }}>
        D tomado de ASME B36.10M {SCHEDULE_LABELS[aga3.schedule]}. ΔP objetivo = {aga3.dp_objetivo_mbar} mbar a Qmáx.
        Screening — verificar con ID medido en campo para cómputo fiscal.
      </p>
    </div>
  )
}
