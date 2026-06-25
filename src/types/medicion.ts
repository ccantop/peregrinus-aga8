export type TipoPunto = 'city_gate' | 'industrial' | 'ducto' | 'auditoria'
export type TipoFluido = 'gn' | 'glp'
export type ClaseLocalizacion = 'na' | '1' | '2' | '3' | '4'
export type TomaDiferencialOrificio = 'brida' | 'esquina' | 'ddmedio'
export type TecnologiaKey = 'ultrasonico' | 'orificio' | 'turbina' | 'coriolis' | 'diafragma'
export type FaseProyecto = 'fase1' | 'fase2'
export type EstadoActividad = 'tienes' | 'falta' | 'en_proceso'
export type ResponsableTipo = 'interno_energon' | 'externo_obligatorio' | 'externo_opcional'

export interface DatosProceso {
  tipo: TipoPunto
  fiscal: boolean
  fluido: TipoFluido
  qmin: number
  qnorm: number
  qmax: number
  presion_kgcm2: number
  diametro_pulg: number
  clase_localizacion: ClaseLocalizacion
}

export interface VariablesAvanzadas {
  sg: number
  co2_pct: number
  n2_pct: number
  viscosidad_cp: number
  toma_diferencial: TomaDiferencialOrificio
  elevacion_msnm: number
  patm_kpa: number
  tamb_min_c: number
  p_base_kpa: number
  t_base_c: number
  dew_agua_c: number
  dew_hc_c: number
  dp_regulador_bar: number
}

export interface ResultadoTecnologia {
  key: TecnologiaKey
  nombre: string
  turndown_tipico: string
  exactitud: string
  referencia: string
  motivo: string
}

export interface AlertaFisica {
  nivel: 'info' | 'warn' | 'danger'
  texto: string
}

export interface ResultadoCalculo {
  Z_papay: number
  Z_aga8?: number          // disponible tras respuesta del servicio Python
  densidad_kgm3?: number   // kg/m³ en condiciones de operación
  metodo: 'papay' | 'aga8-detail'
  Tr: number
  Pr: number
  caida_jt_c: number
  t_salida_regulador_c: number
  alertas: AlertaFisica[]
  es_calculo_fiscal: false
}

export interface Norma {
  clave: string
  descripcion: string
}

export interface HuecoPendiente {
  id: string
  descripcion: string
  responsable_rol: string
  responsable_tipo: ResponsableTipo
  bloquea_exportacion: boolean
  estado: EstadoActividad
}

export interface Actividad {
  id: string
  nombre: string
  etapa: number
  estado: EstadoActividad
  responsable_rol: string
  responsable_tipo: ResponsableTipo
  accion_sugerida: string
  bloquea_exportacion_final: boolean
}
