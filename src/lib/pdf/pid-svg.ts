// Genera el SVG del P&ID como string para embeber en PDF

interface PIDSvgData {
  tecnologia_nombre: string
  tecnologia_referencia: string
  tecnologia_key: string
  diametro_pulg: number
  presion_kgcm2: number
  qnorm: number
}

const C = {
  bg:     '#ffffff',
  pipe:   '#1a2a3a',
  teal:   '#4a9ebb',
  orange: '#c17f24',
  green:  '#2d8c4e',
  red:    '#b84030',
  ink2:   '#4a6070',
  ink3:   '#8098a8',
  panel:  '#f0f5f8',
}

export function generarPIDSvg(d: PIDSvgData): string {
  const techNombre = d.tecnologia_nombre ?? 'Por definir'
  const techRef    = d.tecnologia_referencia ?? ''
  const techKey    = d.tecnologia_key ?? ''
  const label      = techNombre.length > 18 ? techKey.toUpperCase() : techNombre

  return `<svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" width="900" height="300">
  <rect width="900" height="300" fill="${C.bg}"/>

  <!-- título -->
  <text x="450" y="22" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="13" text-anchor="middle" font-weight="bold">P&amp;ID — Estación de medición de gas</text>
  <text x="450" y="38" fill="${C.ink3}" font-family="Liberation Mono,DejaVu Sans Mono,monospace" font-size="10" text-anchor="middle">DN ${d.diametro_pulg}" — ${d.presion_kgcm2} kg/cm² — Q ${d.qnorm} m³/h  |  Tecnología: ${techNombre} · ${techRef}</text>

  <!-- línea de tubería (parte en dos para no cruzar el elemento primario) -->
  <line x1="20" y1="150" x2="400" y2="150" stroke="${C.pipe}" stroke-width="3"/>
  <line x1="510" y1="150" x2="870" y2="150" stroke="${C.pipe}" stroke-width="3"/>

  <!-- VB-01 Bloqueo entrada -->
  <rect x="40" y="125" width="52" height="50" rx="4" fill="${C.panel}" stroke="${C.teal}" stroke-width="1.5"/>
  <text x="66" y="148" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">VB-01</text>
  <text x="66" y="161" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="9"  text-anchor="middle">Bloqueo</text>
  <text x="66" y="118" fill="${C.teal}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">Entrada</text>

  <!-- FT-01 Filtro -->
  <rect x="148" y="125" width="60" height="50" rx="4" fill="${C.panel}" stroke="${C.orange}" stroke-width="1.5"/>
  <text x="178" y="148" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">FT-01</text>
  <text x="178" y="161" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="9"  text-anchor="middle">Filtro</text>
  <text x="178" y="118" fill="${C.orange}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">Separador</text>

  <!-- PCV-01 Regulador -->
  <rect x="268" y="120" width="72" height="60" rx="4" fill="${C.panel}" stroke="${C.orange}" stroke-width="1.5"/>
  <text x="304" y="148" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">PCV-01</text>
  <text x="304" y="161" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="9"  text-anchor="middle">Regulador</text>
  <text x="304" y="113" fill="${C.orange}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">Reg. presión</text>

  <!-- Elemento primario -->
  <rect x="400" y="110" width="110" height="80" rx="5" fill="rgba(45,140,78,0.08)" stroke="${C.green}" stroke-width="2"/>
  <text x="455" y="146" fill="${C.green}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="11" text-anchor="middle" font-weight="600">${label}</text>
  <text x="455" y="162" fill="${C.green}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="9"  text-anchor="middle">FE/FT-01</text>
  <text x="455" y="103" fill="${C.green}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">Elemento primario</text>

  <!-- FC-01 Computador -->
  <rect x="568" y="122" width="86" height="56" rx="4" fill="${C.panel}" stroke="${C.teal}" stroke-width="1.5"/>
  <text x="611" y="144" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">FC-01</text>
  <text x="611" y="157" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="9"  text-anchor="middle">Comp. flujo</text>
  <text x="611" y="115" fill="${C.teal}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">Cromatógrafo*</text>

  <!-- VB-02 Bloqueo salida -->
  <rect x="712" y="125" width="52" height="50" rx="4" fill="${C.panel}" stroke="${C.teal}" stroke-width="1.5"/>
  <text x="738" y="148" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">VB-02</text>
  <text x="738" y="161" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="9"  text-anchor="middle">Bloqueo</text>
  <text x="738" y="118" fill="${C.teal}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10" text-anchor="middle">Salida</text>

  <!-- PSV-01 Venteo -->
  <rect x="812" y="120" width="56" height="60" rx="4" fill="${C.panel}" stroke="${C.red}" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="840" y="145" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="9"  text-anchor="middle">PSV-01</text>
  <text x="840" y="158" fill="${C.ink2}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="9"  text-anchor="middle">Venteo</text>
  <text x="840" y="113" fill="${C.red}" font-family="Liberation Sans,DejaVu Sans,Arial,sans-serif" font-size="10"  text-anchor="middle">Seguridad</text>

  <!-- nota footer -->
  <text x="450" y="285" fill="${C.ink3}" font-family="Liberation Mono,DejaVu Sans Mono,monospace" font-size="9" text-anchor="middle">*Cromatógrafo en línea aplica a city gate fiscal — opcional en estación industrial.</text>
  <text x="450" y="298" fill="${C.ink3}" font-family="Liberation Mono,DejaVu Sans Mono,monospace" font-size="8" text-anchor="middle">Generado por Peregrin — Ingenieria normativa de estaciones de medicion de gas natural</text>
</svg>`
}
