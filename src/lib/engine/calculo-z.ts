import type { VariablesAvanzadas, ResultadoCalculo } from '@/types/medicion'

/**
 * Aproximación de Papay para factor Z.
 * VÁLIDA SOLO PARA SCREENING — no usar para cómputo fiscal.
 * Reemplazar por pyaga8 (AGA 8 DETAIL / GERG-2008) cuando el servicio Python esté disponible.
 *
 * Propiedades pseudo-críticas: correlación de Standing a partir de gravedad específica.
 */
function papay(sg: number, presionAbsKpa: number, tempC: number): { Z: number; Tr: number; Pr: number } {
  const Tc_R = 168 + 325 * sg - 12.5 * sg * sg
  const Pc_psia = 677 + 15 * sg - 37.5 * sg * sg
  const P_psia = presionAbsKpa * 0.145038
  const T_R = (tempC + 273.15) * 1.8
  const Pr = P_psia / Pc_psia
  const Tr = T_R / Tc_R
  const Z = 1 - (3.52 * Pr) / Math.pow(10, 0.9813 * Tr) + (0.274 * Pr * Pr) / Math.pow(10, 0.8157 * Tr)
  return { Z, Tr, Pr }
}

/**
 * Coeficiente Joule-Thomson simplificado.
 * ~0.3–0.6 °C/bar, más alto en gas rico (sg mayor).
 */
function coefJT(sg: number): number {
  const coef = 0.3 + (sg - 0.55) * 0.6
  return Math.max(0.25, Math.min(0.7, coef))
}

export function calcularCondicionesFisicas(vars: VariablesAvanzadas): ResultadoCalculo {
  const { Z, Tr, Pr } = papay(vars.sg, vars.patm_kpa, vars.tamb_min_c)
  const caida_jt_c = vars.dp_regulador_bar * coefJT(vars.sg)
  const t_salida_regulador_c = vars.tamb_min_c - caida_jt_c

  const alertas: ResultadoCalculo['alertas'] = []

  alertas.push({
    nivel: 'info',
    texto: `Factor Z estimado (Papay, screening): ${Z.toFixed(4)} a Pr=${Pr.toFixed(2)}, Tr=${Tr.toFixed(2)}. Usar AGA 8 completo para cómputo fiscal final.`,
  })

  alertas.push({
    nivel: 'info',
    texto: `Caída JT estimada en etapa de regulación: ${caida_jt_c.toFixed(1)} °C (ΔP=${vars.dp_regulador_bar} bar). T salida estimada: ${t_salida_regulador_c.toFixed(1)} °C.`,
  })

  if (t_salida_regulador_c <= vars.dew_agua_c + 3) {
    alertas.push({
      nivel: 'danger',
      texto: `Riesgo de hidratos: T salida (${t_salida_regulador_c.toFixed(1)}°C) cerca o bajo el punto de rocío de agua (${vars.dew_agua_c}°C). Considerar precalentamiento o reducción multietapa.`,
    })
  }

  if (t_salida_regulador_c <= vars.dew_hc_c + 3) {
    alertas.push({
      nivel: 'warn',
      texto: `Riesgo de condensación de HC: T salida (${t_salida_regulador_c.toFixed(1)}°C) cerca o bajo el punto de rocío de HC (${vars.dew_hc_c}°C). Puede invalidar medición de gas seco — considerar separador/scrubber aguas arriba.`,
    })
  }

  if (vars.tamb_min_c < -10) {
    alertas.push({
      nivel: 'warn',
      texto: `T ambiente mínima de diseño baja (${vars.tamb_min_c}°C) — revisar calefacción de gabinete de instrumentos y rango de transmisores.`,
    })
  }

  return {
    Z_papay: Z,
    metodo: 'papay' as const,
    Tr,
    Pr,
    caida_jt_c,
    t_salida_regulador_c,
    alertas,
    es_calculo_fiscal: false,
  }
}

// ─── AGA 7 — Conversión a condiciones base (turbina / cualquier medidor volumétrico) ──

export interface ResultadoAGA7 {
  Fpv: number           // factor de supercompresibilidad
  Zf: number            // Z en condiciones de flujo
  Zb: number            // Z en condiciones base (~1 a baja presión)
  qb_min: number        // caudal mínimo en condiciones base (m³/h)
  qb_norm: number       // caudal normal en condiciones base (m³/h)
  qb_max: number        // caudal máximo en condiciones base (m³/h)
  Pf_kpa: number        // presión de flujo absoluta (kPa)
  Pb_kpa: number        // presión base (kPa)
  Tf_k: number          // temperatura de flujo (K)
  Tb_k: number          // temperatura base (K)
}

/**
 * Cálculo AGA 7 simplificado: conversión de caudal operativo a condiciones base.
 * Fórmula: Qb = Qt × (Pf/Pb) × (Tb/Tf) × (Zb/Zf)
 * Ref: AGA Report No. 7 (2006), sección 5.
 */
export function calcularAGA7(
  qmin: number, qnorm: number, qmax: number,
  presion_kgcm2: number, tamb_c: number,
  p_base_kpa: number, t_base_c: number,
  Zf: number,   // Z en condiciones de flujo (de AGA 8 o Papay)
): ResultadoAGA7 {
  const Pf_kpa = presion_kgcm2 * 98.0665 + 101.325   // gauge → absoluta
  const Pb_kpa = p_base_kpa
  const Tf_k   = tamb_c + 273.15
  const Tb_k   = t_base_c + 273.15

  // Z en condiciones base (101 kPa, ~15°C): muy cercano a 1 para gas natural
  const Zb = papay(0.65, Pb_kpa, t_base_c).Z   // SG nominal para base

  // Factor de supercompresibilidad (AGA 7 eq. 5-1)
  const Fpv = Math.sqrt((Zb / Zf) * (Pf_kpa / Pb_kpa) * (Tb_k / Tf_k))

  const factor = (Pf_kpa / Pb_kpa) * (Tb_k / Tf_k) * (Zb / Zf)

  return {
    Fpv: Math.round(Fpv * 10000) / 10000,
    Zf,
    Zb: Math.round(Zb * 10000) / 10000,
    qb_min:  Math.round(qmin  * factor * 10) / 10,
    qb_norm: Math.round(qnorm * factor * 10) / 10,
    qb_max:  Math.round(qmax  * factor * 10) / 10,
    Pf_kpa:  Math.round(Pf_kpa * 10) / 10,
    Pb_kpa,
    Tf_k:    Math.round(Tf_k * 10) / 10,
    Tb_k:    Math.round(Tb_k * 10) / 10,
  }
}

// ─── AGA 8 DETAIL — llamada al servicio Python ────────────────────────────────

export interface RespuestaAGA8 {
  z: number
  densidad_kgm3: number
  metodo: string
  composicion: Record<string, number>
}

export async function calcularAGA8(
  vars: VariablesAvanzadas,
  presion_operacion_kpa: number,
): Promise<RespuestaAGA8 | null> {
  try {
    const res = await fetch('/api/calculo-aga8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presion_kpa: presion_operacion_kpa,
        temperatura_k: vars.tamb_min_c + 273.15,
        sg: vars.sg,
        co2_pct: vars.co2_pct,
        n2_pct: vars.n2_pct,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return await res.json() as RespuestaAGA8
  } catch {
    return null
  }
}
