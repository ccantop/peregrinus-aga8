'use client'

interface Props {
  qmin: number
  qnorm: number
  qmax: number
  sg: number
}

export default function TarjetaCoriolis({ qmin, qnorm, qmax, sg }: Props) {
  // Densidad aproximada a condiciones base (101.325 kPa, 15.6 °C, Z≈1)
  // ρ = M·P / (Z·R·T) con M = sg·28.97 kg/kmol
  const rho_base = (sg * 28.97 * 101.325) / (1.0 * 8.31446 * (15.6 + 273.15))

  const mmax  = Math.round(qmax  * rho_base * 10) / 10
  const mnorm = Math.round(qnorm * rho_base * 10) / 10
  const mmin  = Math.round(qmin  * rho_base * 10) / 10

  return (
    <div className="rounded-lg border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
          Medición másica directa — Coriolis (AGA 11)
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{ background: 'rgba(74,158,187,0.08)', color: 'var(--accent)', border: '1px solid rgba(74,158,187,0.25)' }}>
          ρ base ≈ {rho_base.toFixed(3)} kg/m³
        </span>
      </div>

      <div className="rounded-md px-4 py-3 mb-4 text-xs leading-relaxed"
        style={{ background: 'rgba(74,158,187,0.06)', border: '1px solid rgba(74,158,187,0.2)', color: 'var(--ink2)' }}>
        <p className="mb-2">
          A diferencia de turbinas, ultrasónicos y placas de orificio —que miden <b style={{ color: 'var(--ink)' }}>volumen</b> y
          requieren corrección por Z, presión y temperatura (AGA 7)— el medidor Coriolis mide directamente
          la <b style={{ color: 'var(--ink)' }}>masa del fluido</b> mediante el efecto de la fuerza de Coriolis sobre
          tubos vibrantes.
        </p>
        <p className="mb-2">
          La masa <b style={{ color: 'var(--ink)' }}>no depende de las condiciones de presión ni temperatura</b>,
          por lo que no se necesita factor de compresibilidad Z ni corrección AGA 7 para obtener la cantidad
          fiscal. El caudal másico medido es directamente el valor facturado.
        </p>
        <p>
          Si el contrato requiere volumen en condiciones base (m³ std), el transmisor aplica internamente
          la densidad de referencia configurada — pero la incertidumbre de medición no se propaga a través
          de Z como en los medidores volumétricos. Esto lo hace el método preferido cuando la composición
          del gas es variable o incierta.
        </p>
      </div>

      {/* caudales en masa */}
      <div className="text-xs mb-2 font-semibold" style={{ color: 'var(--ink3)' }}>
        Caudal másico estimado (condiciones base, SG {sg})
      </div>
      <div className="rounded-md border" style={{ borderColor: 'var(--line)' }}>
        {[
          { label: 'Qmáx',  qv: qmax,  qm: mmax  },
          { label: 'Qnorm', qv: qnorm, qm: mnorm },
          { label: 'Qmín',  qv: qmin,  qm: mmin  },
        ].map(({ label, qv, qm }, i, arr) => (
          <div key={label}
            className="flex items-center justify-between px-3 py-2 text-xs"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <span style={{ color: 'var(--ink3)' }}>{label}</span>
            <div className="flex items-center gap-4">
              <span style={{ color: 'var(--ink2)' }}>
                <b style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>{qv.toLocaleString('es-MX')}</b> m³/h (vol.)
              </span>
              <span style={{ color: 'var(--ink3)' }}>→</span>
              <span style={{ color: 'var(--ink2)' }}>
                <b style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{qm.toLocaleString('es-MX')}</b> kg/h (masa)
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] mt-3" style={{ color: 'var(--ink3)' }}>
        Masa estimada con ρ Papay a condiciones base (101.325 kPa · 15.6 °C · Z≈1).
        El transmisor Coriolis usa la densidad medida en línea — este valor es referencia de diseño.
        Norma aplicable: AGA Report No. 11.
      </p>
    </div>
  )
}
