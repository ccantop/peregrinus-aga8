'use client'

import type { ResultadoTecnologia } from '@/types/medicion'

interface PIDProps {
  tech: ResultadoTecnologia
  diametro: number
  presion: number
  qnorm: number
}

const C = {
  pipe:   '#2a3328',
  teal:   '#5fc6c6',
  orange: '#e0a23a',
  green:  '#9fd13a',
  red:    '#d6604d',
  ink2:   '#aab6a0',
  ink3:   '#71806a',
  panel:  '#151a14',
}

export default function PID({ tech, diametro, presion, qnorm }: PIDProps) {
  return (
    <svg
      viewBox="0 0 900 280"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto rounded-md"
      style={{ background: '#0a0c09' }}
    >
      {/* línea de tubería */}
      <line x1="20" y1="140" x2="870" y2="140" stroke={C.pipe} strokeWidth="3" />

      {/* header */}
      <text x="20" y="22" fill={C.ink3} fontFamily="monospace" fontSize="11">
        DN {diametro}&quot; — {presion} kg/cm² — Q {qnorm} m³/h
      </text>
      <text x="20" y="36" fill={C.ink3} fontFamily="monospace" fontSize="10">
        Tecnología: {tech.nombre} · {tech.referencia}
      </text>

      {/* VB-01 Bloqueo entrada */}
      <g>
        <rect x="40" y="115" width="52" height="50" rx="4" fill={C.panel} stroke={C.teal} strokeWidth="1.2" />
        <text x="66" y="138" fill={C.ink2} fontSize="10" textAnchor="middle">VB-01</text>
        <text x="66" y="151" fill={C.ink2} fontSize="9"  textAnchor="middle">Bloqueo</text>
        <text x="66" y="108" fill={C.teal} fontSize="10" textAnchor="middle">Entrada</text>
      </g>

      {/* FT-01 Filtro */}
      <g>
        <rect x="148" y="115" width="60" height="50" rx="4" fill={C.panel} stroke={C.orange} strokeWidth="1.2" />
        <text x="178" y="138" fill={C.ink2} fontSize="10" textAnchor="middle">FT-01</text>
        <text x="178" y="151" fill={C.ink2} fontSize="9"  textAnchor="middle">Filtro</text>
        <text x="178" y="108" fill={C.orange} fontSize="10" textAnchor="middle">Separador</text>
      </g>

      {/* PCV-01 Regulador */}
      <g>
        <rect x="268" y="110" width="72" height="60" rx="4" fill={C.panel} stroke={C.orange} strokeWidth="1.2" />
        <text x="304" y="138" fill={C.ink2} fontSize="10" textAnchor="middle">PCV-01</text>
        <text x="304" y="151" fill={C.ink2} fontSize="9"  textAnchor="middle">Regulador</text>
        <text x="304" y="103" fill={C.orange} fontSize="10" textAnchor="middle">Reg. presión</text>
      </g>

      {/* Elemento primario — destacado con el nombre de la tecnología */}
      <g>
        <rect x="400" y="100" width="110" height="80" rx="5"
          fill="rgba(159,209,58,0.10)" stroke={C.green} strokeWidth="1.8" />
        <text x="455" y="130" fill={C.green} fontSize="11" textAnchor="middle" fontWeight="600">
          {tech.nombre.length > 18 ? tech.key.toUpperCase() : tech.nombre}
        </text>
        <text x="455" y="146" fill={C.green} fontSize="9"  textAnchor="middle">FE/FT-01</text>
        <text x="455" y="93"  fill={C.green} fontSize="10" textAnchor="middle">Elemento primario</text>
      </g>

      {/* FC-01 Computador de flujo + cromatógrafo */}
      <g>
        <rect x="568" y="112" width="86" height="56" rx="4" fill={C.panel} stroke={C.teal} strokeWidth="1.2" />
        <text x="611" y="134" fill={C.ink2} fontSize="10" textAnchor="middle">FC-01</text>
        <text x="611" y="147" fill={C.ink2} fontSize="9"  textAnchor="middle">Comp. flujo</text>
        <text x="611" y="105" fill={C.teal} fontSize="10" textAnchor="middle">Cromatógrafo*</text>
      </g>

      {/* VB-02 Bloqueo salida */}
      <g>
        <rect x="712" y="115" width="52" height="50" rx="4" fill={C.panel} stroke={C.teal} strokeWidth="1.2" />
        <text x="738" y="138" fill={C.ink2} fontSize="10" textAnchor="middle">VB-02</text>
        <text x="738" y="151" fill={C.ink2} fontSize="9"  textAnchor="middle">Bloqueo</text>
        <text x="738" y="108" fill={C.teal} fontSize="10" textAnchor="middle">Salida</text>
      </g>

      {/* PSV-01 Venteo */}
      <g>
        <rect x="812" y="110" width="56" height="60" rx="4"
          fill={C.panel} stroke={C.red} strokeWidth="1.2" strokeDasharray="4 3" />
        <text x="840" y="136" fill={C.ink2} fontSize="9"  textAnchor="middle">PSV-01</text>
        <text x="840" y="149" fill={C.ink2} fontSize="9"  textAnchor="middle">Venteo</text>
        <text x="840" y="103" fill={C.red} fontSize="10"  textAnchor="middle">Seguridad</text>
      </g>

      {/* nota footer */}
      <text x="450" y="265" fill={C.ink3} fontSize="10" textAnchor="middle" fontFamily="monospace">
        *Cromatógrafo en línea aplica a city gate fiscal — opcional en estación industrial.
      </text>
    </svg>
  )
}
