import type { DatosProceso, ResultadoTecnologia, TecnologiaKey } from '@/types/medicion'

interface TecnologiaConfig {
  key: TecnologiaKey
  nombre: string
  turndown_tipico: string
  exactitud: string
  referencia: string
}

const TECNOLOGIAS: Record<TecnologiaKey, TecnologiaConfig> = {
  coriolis:    { key: 'coriolis',    nombre: 'Coriolis (másico)',        turndown_tipico: '20:1 – 50:1',   exactitud: '±0.1–0.2%',   referencia: 'AGA 11' },
  ultrasonico: { key: 'ultrasonico', nombre: 'Ultrasónico multipath',    turndown_tipico: '30:1 – 100:1',  exactitud: '±0.15–0.3%',  referencia: 'AGA 9' },
  orificio:    { key: 'orificio',    nombre: 'Placa de orificio',        turndown_tipico: '3:1 – 5:1',     exactitud: '±0.5–1.0%',   referencia: 'AGA 3 / API 14.3' },
  turbina:     { key: 'turbina',     nombre: 'Turbina',                  turndown_tipico: '10:1 – 20:1',   exactitud: '±0.25–0.5%',  referencia: 'AGA 7' },
  diafragma:   { key: 'diafragma',   nombre: 'Diafragma',                turndown_tipico: '20:1 – 100:1',  exactitud: '±1.0–1.5%',   referencia: 'NOM-002-SECRE' },
}

function make(key: TecnologiaKey, motivo: string): ResultadoTecnologia {
  return { ...TECNOLOGIAS[key], motivo }
}

/**
 * Motor de reglas de selección de tecnología de medición.
 * Primera capa de filtro — incompleta a propósito, pendiente de refinar con experiencia de campo.
 * Prioridad de reglas: GLP > fiscal+turndown alto > fiscal+turndown bajo > turbina > diafragma > default.
 */
export function seleccionarTecnologia(datos: DatosProceso): ResultadoTecnologia {
  const { fluido, fiscal, qmin, qmax } = datos
  const turndown = qmax / Math.max(qmin, 0.01)
  const td = turndown.toFixed(1)

  if (fluido === 'glp') {
    return make('coriolis', 'GLP/mezclas requieren medición de masa directa, independiente de densidad variable.')
  }

  if (fiscal && turndown > 30) {
    return make('ultrasonico', `Turndown calculado de ${td}:1 excede el rango de orificio/turbina; sin partes móviles, ideal para fiscal.`)
  }

  if (fiscal && turndown <= 5) {
    return make('orificio', `Turndown bajo (${td}:1) y caudal estable — solución fiscal de menor costo de mantenimiento.`)
  }

  if (turndown > 10 && turndown <= 30) {
    return make('turbina', `Turndown de ${td}:1 — buen balance de exactitud y mantenimiento para industrial/interconexión media presión.`)
  }

  if (!fiscal && turndown > 20) {
    return make('diafragma', `Uso final no fiscal, turndown de ${td}:1 — diafragma cubre el rango sin necesidad de exactitud fiscal.`)
  }

  return make('ultrasonico', `Configuración por defecto de mayor versatilidad para el rango ingresado (${td}:1).`)
}

export function calcularTurndown(qmin: number, qmax: number): number {
  return qmax / Math.max(qmin, 0.01)
}
