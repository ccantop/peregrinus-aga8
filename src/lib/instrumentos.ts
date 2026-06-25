/**
 * Catálogo de instrumentos tipo ISA para una estación de medición de gas.
 * Se usa para pre-poblar hojas de datos con valores por defecto según tag + tecnología.
 */

export interface InstrumentoBase {
  tag: string
  tipo_inst: string
  servicio: string
  unidad_rango: string
  senal_salida: string
  protocolo_com: string
  conexion_proceso: string
  material_partes_mojadas: string
}

export const TIPOS_INST = [
  'transmisor_presion',
  'transmisor_temperatura',
  'elemento_primario',
  'transmisor_flujo',
  'valvula_control',
  'computador_flujo',
  'separador_filtro',
  'valvula_aislamiento',
]

export const TIPO_LABEL: Record<string, string> = {
  transmisor_presion:    'Transmisor de presión',
  transmisor_temperatura:'Transmisor de temperatura',
  elemento_primario:     'Elemento primario de flujo',
  transmisor_flujo:      'Transmisor de flujo',
  valvula_control:       'Válvula de control / regulación',
  computador_flujo:      'Computador de flujo',
  separador_filtro:      'Separador / filtro',
  valvula_aislamiento:   'Válvula de aislamiento',
}

export const SENALES = ['4-20 mA', '4-20 mA HART', 'FOUNDATION Fieldbus', 'Profibus PA', 'Modbus RTU', 'Digital (pulsos)']
export const PROTOCOLOS = ['HART 7', 'Modbus RTU', 'FOUNDATION Fieldbus', 'Profibus PA', 'N/A']
export const FUENTES = ['24 VDC (lazo)', '24 VDC (local)', '120 VAC', '220 VAC']
export const RATINGS = ['150#', '300#', '600#', '900#', '1500#']
export const CONEXIONES = ['Brida ANSI/ASME', 'NPT macho', 'NPT hembra', 'Compresión', 'Welded']
export const MATERIALES = ['316 SS', '304 SS', 'Hastelloy C276', 'Duplex 2205', 'Carbono A105', 'PTFE']
export const CERTS_EX = ['ATEX II 2G Ex d IIC', 'IECEx Ex d IIC', 'FM Class I Div 1', 'FM Class I Div 2', 'NOM-ANCE', 'N/A']
export const GRADOS_IP = ['IP65', 'IP66', 'IP67', 'IP68', 'NEMA 4', 'NEMA 4X', 'NEMA 7']
export const ESTADOS = ['borrador', 'revisado', 'aprobado'] as const

/** Genera la lista base de instrumentos para un proyecto según tecnología. */
export function getInstrumentosBase(
  tecnologiaKey: string,
  presion: number,
  qmin: number,
  qnom: number,
  qmax: number,
  diametro: number,
): InstrumentoBase[] {
  const pMax = +(presion * 1.25).toFixed(1)
  const pBaja = +(presion * 0.6).toFixed(1)
  const dnPulg = `${diametro}"`

  const techNombre =
    tecnologiaKey === 'ultrasonico' ? 'Medidor ultrasónico' :
    tecnologiaKey === 'orificio'    ? 'Placa de orificio' :
    tecnologiaKey === 'turbina'     ? 'Medidor de turbina' :
    tecnologiaKey === 'coriolis'    ? 'Medidor Coriolis' : 'Medidor de flujo'

  return [
    {
      tag: 'PT-101',
      tipo_inst: 'transmisor_presion',
      servicio: 'Medición de presión en entrada de estación',
      unidad_rango: 'kg/cm²',
      senal_salida: '4-20 mA HART',
      protocolo_com: 'HART 7',
      conexion_proceso: 'NPT macho',
      material_partes_mojadas: '316 SS',
    },
    {
      tag: 'TT-101',
      tipo_inst: 'transmisor_temperatura',
      servicio: 'Medición de temperatura en entrada de estación',
      unidad_rango: '°C',
      senal_salida: '4-20 mA HART',
      protocolo_com: 'HART 7',
      conexion_proceso: 'NPT macho',
      material_partes_mojadas: '316 SS',
    },
    {
      tag: 'FE-100',
      tipo_inst: 'elemento_primario',
      servicio: `${techNombre} — medición de caudal de gas natural`,
      unidad_rango: 'm³/h',
      senal_salida: '4-20 mA HART',
      protocolo_com: 'HART 7',
      conexion_proceso: 'Brida ANSI/ASME',
      material_partes_mojadas: '316 SS',
    },
    {
      tag: 'FT-100',
      tipo_inst: 'transmisor_flujo',
      servicio: 'Transmisor asociado al elemento primario FE-100',
      unidad_rango: 'm³/h',
      senal_salida: '4-20 mA HART',
      protocolo_com: 'HART 7',
      conexion_proceso: 'Brida ANSI/ASME',
      material_partes_mojadas: '316 SS',
    },
    {
      tag: 'PCV-100',
      tipo_inst: 'valvula_control',
      servicio: 'Regulación de presión en salida de estación',
      unidad_rango: 'kg/cm²',
      senal_salida: '4-20 mA',
      protocolo_com: 'HART 7',
      conexion_proceso: 'Brida ANSI/ASME',
      material_partes_mojadas: 'Carbono A105',
    },
    {
      tag: 'PT-102',
      tipo_inst: 'transmisor_presion',
      servicio: 'Medición de presión en salida / línea de baja presión',
      unidad_rango: 'kg/cm²',
      senal_salida: '4-20 mA HART',
      protocolo_com: 'HART 7',
      conexion_proceso: 'NPT macho',
      material_partes_mojadas: '316 SS',
    },
    {
      tag: 'FQI-100',
      tipo_inst: 'computador_flujo',
      servicio: 'Cálculo y totalización volumétrica — AGA 8 DETAIL',
      unidad_rango: 'm³',
      senal_salida: 'Modbus RTU',
      protocolo_com: 'Modbus RTU',
      conexion_proceso: 'N/A',
      material_partes_mojadas: 'N/A',
    },
    {
      tag: 'SEP-100',
      tipo_inst: 'separador_filtro',
      servicio: 'Separación de partículas y líquidos aguas arriba del medidor',
      unidad_rango: 'N/A',
      senal_salida: 'N/A',
      protocolo_com: 'N/A',
      conexion_proceso: 'Brida ANSI/ASME',
      material_partes_mojadas: 'Carbono A105',
    },
  ]
}
