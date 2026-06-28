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

// ─── Tabla ID real ASME B36.10M (diámetro interno en mm) ────────────────────
// Fuente: ASME B36.10M-2018, Tabla 1. DN en pulgadas nominales.
// Schedules disponibles: sch40 (= STD para ≤10"), sch80 (= XH para ≤8"),
//                        sch160, xxh (doble extra pesado).

export type ScheduleTuberia = 'sch40' | 'sch80' | 'sch160' | 'xxh'

const ID_MM: Record<ScheduleTuberia, Record<number, number>> = {
  sch40: {
    0.5: 15.80,  0.75: 20.93,  1: 26.64,  1.25: 35.05,  1.5: 40.89,
    2: 52.50,  2.5: 62.71,  3: 77.93,  4: 102.26,  6: 154.05,
    8: 202.72,  10: 254.51,  12: 303.23,  14: 333.35,  16: 381.00,
    18: 428.65,  20: 477.82,  24: 574.65,
  },
  sch80: {
    0.5: 13.87,  0.75: 18.85,  1: 24.31,  1.25: 32.46,  1.5: 38.10,
    2: 49.25,  2.5: 58.93,  3: 73.66,  4: 97.18,  6: 146.33,
    8: 193.68,  10: 242.87,  12: 288.89,  14: 330.20,  16: 374.65,
    18: 423.42,  20: 469.90,  24: 566.52,
  },
  sch160: {
    0.5: 11.07,  0.75: 15.57,  1: 20.70,  1.25: 28.96,  1.5: 33.99,
    2: 42.82,  2.5: 53.34,  3: 66.65,  4: 87.32,  6: 131.76,
    8: 173.06,  10: 222.25,  12: 263.49,  14: 304.80,  16: 347.67,
    18: 390.53,  20: 438.15,  24: 533.40,
  },
  xxh: {
    0.5:  6.35,  0.75: 12.52,  1: 15.24,  1.25: 22.35,  1.5: 25.40,
    2: 38.10,  2.5: 46.02,  3: 58.42,  4: 80.06,  6: 120.65,
    8: 158.75,  10: 203.20,  12: 247.65,  14: 292.10,  16: 333.35,
    18: 381.00,  20: 425.45,  24: 514.35,
  },
}

export const SCHEDULE_LABELS: Record<ScheduleTuberia, string> = {
  sch40:  'Sch 40 / STD',
  sch80:  'Sch 80 / XH',
  sch160: 'Sch 160',
  xxh:    'XXH (doble extra pesado)',
}

/** Devuelve el ID real (mm) para un diámetro nominal en pulgadas y schedule dado.
 *  Fallback a diámetro nominal × 25.4 si no está en tabla. */
export function idRealMm(diametro_pulg: number, schedule: ScheduleTuberia = 'sch40'): number {
  const tabla = ID_MM[schedule]
  if (tabla[diametro_pulg] !== undefined) return tabla[diametro_pulg]
  return diametro_pulg * 25.4
}

// ─── AGA 3 — Dimensionamiento de placa de orificio (ISO 5167 / AGA Report No. 3) ──

export interface ResultadoAGA3 {
  D_mm: number           // diámetro interno de tubería (mm)
  d_mm: number           // diámetro del orificio (mm)
  beta: number           // relación de diámetros d/D
  Cd: number             // coeficiente de descarga (Reader-Harris/Gallagher)
  Ev: number             // factor de aproximación de velocidad 1/√(1-β⁴)
  dp_max_mbar: number    // ΔP a Qmax (mbar)
  dp_norm_mbar: number   // ΔP a Qnorm (mbar)
  dp_min_mbar: number    // ΔP a Qmin (mbar)
  rho_kgm3: number       // densidad del gas en condiciones de flujo
  Re_D_max: number       // Reynolds en tubería a Qmax
  toma: string
  schedule: ScheduleTuberia
  valido: boolean        // β dentro de rango AGA 3 (0.20–0.75)
  alerta?: string
  dp_objetivo_mbar: number
}

/**
 * Dimensionamiento preliminar de placa de orificio según AGA Report No. 3 / ISO 5167-2.
 * Ecuación de flujo: Qt = Cd × Ev × (π/4 × d²) × Y × √(2ΔP/ρf)
 * Cd: ecuación Reader-Harris/Gallagher (AGA 3 Part 1, §2.4).
 * Determina β y d para ΔP_max = 250 mbar a Qmax.
 */
export function calcularAGA3(
  qmax_base: number,   // m³/h en condiciones BASE
  qnorm_base: number,
  qmin_base: number,
  presion_kgcm2: number,
  tamb_c: number,
  sg: number,
  Zf: number,
  diametro_pulg: number,
  toma: 'brida' | 'esquina' | 'ddmedio',
  viscosidad_cp: number,
  p_base_kpa: number,
  t_base_c: number,
  schedule: ScheduleTuberia = 'sch40',
): ResultadoAGA3 {
  const Pf_kpa = presion_kgcm2 * 98.0665 + 101.325
  const Tf_k   = tamb_c + 273.15
  const Tb_k   = t_base_c + 273.15
  const Pb_kpa = p_base_kpa
  const Zb     = papay(0.65, Pb_kpa, t_base_c).Z

  // Caudales base → operación (m³/s)
  const factorBaseAOp = (Pb_kpa / Pf_kpa) * (Tf_k / Tb_k) * (Zf / Zb)
  const Qt_max  = qmax_base  * factorBaseAOp / 3600
  const Qt_norm = qnorm_base * factorBaseAOp / 3600
  const Qt_min  = qmin_base  * factorBaseAOp / 3600

  // Densidad gas en flujo (kg/m³): ρ = PM / (ZRT)
  const rho = (sg * 28.97 * Pf_kpa) / (Zf * 8.31446 * Tf_k)
  const mu  = viscosidad_cp * 1e-3  // Pa·s

  const D_mm = idRealMm(diametro_pulg, schedule)   // ID real ASME B36.10M
  const D_m  = D_mm / 1000
  const A_D  = Math.PI / 4 * D_m * D_m

  // Parámetros toma (Reader-Harris/Gallagher)
  let L1 = 0, L2p = 0
  if (toma === 'brida')  { L1 = 25.4 / D_mm; L2p = 25.4 / D_mm }
  if (toma === 'ddmedio') { L1 = 1; L2p = 0.47 }

  function computeCd(beta: number, ReD: number): number {
    const reDsafe = Math.max(ReD, 4000)
    const A   = Math.pow(19000 * beta / reDsafe, 0.8)
    const M2p = (2 * L2p) / (1 - beta)
    let cd = 0.5961 + 0.0261 * beta ** 2 - 0.216 * beta ** 8
    cd += 0.000521 * Math.pow(1e6 * beta / reDsafe, 0.7)
    cd += (0.0188 + 0.0063 * A) * Math.pow(beta, 3.5) * Math.pow(1e6 / reDsafe, 0.3)
    cd += (0.043 + 0.080 * Math.exp(-10 * L1) - 0.123 * Math.exp(-7 * L1))
          * (1 - 0.11 * A) * beta ** 4 / (1 - beta ** 4)
    cd -= 0.031 * (M2p - 0.8 * Math.pow(Math.max(M2p, 0), 1.1)) * Math.pow(beta, 1.3)
    return Math.max(0.55, Math.min(0.85, cd))
  }

  function flowAtDP(beta: number, DP_Pa: number): { Qt: number; Cd: number; ReD: number } {
    const d_m = beta * D_m
    const Ev  = 1 / Math.sqrt(1 - beta ** 4)
    const A_d = Math.PI / 4 * d_m * d_m
    let Cd = 0.606, ReD = 1e6
    for (let i = 0; i < 6; i++) {
      const Qt_it = Cd * Ev * A_d * Math.sqrt(2 * DP_Pa / rho)
      ReD = rho * (Qt_it / A_D) * D_m / mu
      Cd  = computeCd(beta, ReD)
    }
    const Qt = Cd * Ev * A_d * Math.sqrt(2 * DP_Pa / rho)
    return { Qt, Cd, ReD }
  }

  // Buscar β que produce Qt_max a ΔP_obj = 250 mbar (25 000 Pa)
  const DP_obj_Pa = 25_000
  let lo = 0.20, hi = 0.75
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const { Qt } = flowAtDP(mid, DP_obj_Pa)
    if (Qt < Qt_max) lo = mid; else hi = mid
  }
  const beta = (lo + hi) / 2
  const { Cd, ReD } = flowAtDP(beta, DP_obj_Pa)
  const Ev   = 1 / Math.sqrt(1 - beta ** 4)
  const d_mm = beta * D_mm

  // ΔP a los demás caudales: ΔP ∝ Qt²
  const dp_norm_Pa = DP_obj_Pa * (Qt_norm / Qt_max) ** 2
  const dp_min_Pa  = DP_obj_Pa * (Qt_min  / Qt_max) ** 2

  const fuera_rango = beta < 0.20 || beta > 0.75
  const alerta = beta < 0.20
    ? 'β calculado < 0.20: diámetro de orificio muy pequeño. Considerar tubería mayor o ΔP objetivo menor.'
    : beta > 0.75
    ? 'β calculado > 0.75: fuera del rango AGA 3. Considerar ΔP objetivo mayor o verificar diámetro de tubería.'
    : undefined

  const tapaLabel = toma === 'brida' ? 'Brida (flange taps)'
    : toma === 'esquina' ? 'Esquina (corner taps)'
    : 'D–D/2 (pipe taps)'

  return {
    D_mm:          Math.round(D_mm * 10) / 10,
    d_mm:          Math.round(d_mm * 10) / 10,
    beta:          Math.round(beta * 10000) / 10000,
    Cd:            Math.round(Cd * 10000) / 10000,
    Ev:            Math.round(Ev * 10000) / 10000,
    dp_max_mbar:   Math.round(DP_obj_Pa / 10) / 10,
    dp_norm_mbar:  Math.round(dp_norm_Pa / 10) / 10,
    dp_min_mbar:   Math.round(dp_min_Pa  / 10) / 10,
    rho_kgm3:      Math.round(rho * 1000) / 1000,
    Re_D_max:      Math.round(ReD),
    toma:          tapaLabel,
    schedule,
    valido:        !fuera_rango,
    alerta,
    dp_objetivo_mbar: 250,
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
