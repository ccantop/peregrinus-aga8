import type { TipoPunto, Norma, Actividad } from '@/types/medicion'

const NORMAS_BASE: Record<TipoPunto, Norma[]> = {
  city_gate: [
    { clave: 'NOM-003-SECRE-2002',    descripcion: 'Distribución de gas natural y GLP por ductos — aplica a la interconexión.' },
    { clave: 'NOM-009-ASEA-2017',     descripcion: 'Administración de la integridad del ducto en todo su ciclo de vida.' },
    { clave: 'NOM-020-ASEA-2024',     descripcion: 'Transporte por ducto — diseño/O&M/integridad. Sustituye NOM-007-ASEA-2016 desde 28-feb-2026.' },
    { clave: 'DACG SISOPA Transporte', descripcion: 'Lineamientos de seguridad industrial y operativa ASEA para el transporte.' },
  ],
  industrial: [
    { clave: 'NOM-001-SECRE-2010', descripcion: 'Especificaciones del gas natural recibido.' },
    { clave: 'NOM-002-SECRE-2010', descripcion: 'Instalaciones de aprovechamiento — memoria técnico-descriptiva e isométrico obligatorios.' },
  ],
  ducto: [
    { clave: 'NOM-009-ASEA-2017', descripcion: 'Administración de la integridad del ducto.' },
    { clave: 'NOM-020-ASEA-2024', descripcion: 'Transporte por ducto — vigente desde 28-feb-2026, sustituye a la NOM-007-ASEA-2016.' },
    { clave: 'NOM-003-SECRE-2002', descripcion: 'Si el punto incluye entrega/derivación a distribución.' },
  ],
  auditoria: [
    { clave: 'NOM-001-SECRE-2010', descripcion: 'Especificaciones del gas natural — referencia para diagnóstico.' },
    { clave: 'NOM-009-ASEA-2017',  descripcion: 'Integridad del ducto — aplica en diagnóstico de sistemas existentes.' },
  ],
}

const NORMA_FISCAL: Norma = {
  clave: 'RMF Anexo 21 (SAT)',
  descripcion: 'Clave SMD obligatoria, incertidumbre y vigencia de calibración reportables al SAT por transferencia de custodia.',
}

export function getNormasAplicables(tipo: TipoPunto, fiscal: boolean): Norma[] {
  const base = NORMAS_BASE[tipo] ?? []
  return fiscal ? [...base, NORMA_FISCAL] : base
}

export function getActividadesBase(tipo: TipoPunto, fiscal: boolean): Actividad[] {
  const actividades: Actividad[] = [
    {
      id: 'datos-proceso',
      nombre: 'Datos de proceso',
      etapa: 1,
      estado: 'falta',
      responsable_rol: 'Cliente final',
      responsable_tipo: 'externo_opcional',
      accion_sugerida: 'Solicitar hoja de datos de proceso al cliente (caudales, presión, temperatura, composición).',
      bloquea_exportacion_final: true,
    },
    {
      id: 'motor-reglas',
      nombre: 'Motor de reglas + memoria preliminar',
      etapa: 1,
      estado: 'falta',
      responsable_rol: 'Software + ingeniero de medición',
      responsable_tipo: 'interno_energon',
      accion_sugerida: 'Completar datos de proceso para generar recomendación de tecnología.',
      bloquea_exportacion_final: false,
    },
    {
      id: 'revision-normativa',
      nombre: 'Revisión normativa/tecnológica',
      etapa: 2,
      estado: 'falta',
      responsable_rol: 'Responsable técnico (cédula profesional)',
      responsable_tipo: 'interno_energon',
      accion_sugerida: 'Validar selección de tecnología y cumplimiento normativo antes de avanzar a Fase 2.',
      bloquea_exportacion_final: true,
    },
    {
      id: 'levantamiento-fisico',
      nombre: 'Verificación física / interferencias',
      etapa: 3,
      estado: 'falta',
      responsable_rol: 'Ingeniero de campo',
      responsable_tipo: 'interno_energon',
      accion_sugerida: 'Realizar visita a sitio y documentar interferencias, espacio disponible y tramos rectos medibles.',
      bloquea_exportacion_final: true,
    },
    {
      id: 'estudio-suelo',
      nombre: 'Estudio de mecánica de suelos / zona sísmica',
      etapa: 3,
      estado: 'falta',
      responsable_rol: 'Ingeniero civil / geotécnico',
      responsable_tipo: 'externo_opcional',
      accion_sugerida: 'Contratar estudio de mecánica de suelos si la instalación requiere obra civil.',
      bloquea_exportacion_final: false,
    },
    {
      id: 'clasificacion-area',
      nombre: 'Clasificación de área eléctrica',
      etapa: 3,
      estado: 'falta',
      responsable_rol: 'Ingeniero eléctrico / instrumentista',
      responsable_tipo: 'externo_opcional',
      accion_sugerida: 'Definir clase/división/zona para selección de instrumentos a prueba de explosión.',
      bloquea_exportacion_final: true,
    },
    {
      id: 'hoja-datos-instrumento',
      nombre: 'Cotización y hoja de datos del instrumento real',
      etapa: 4,
      estado: 'falta',
      responsable_rol: 'Fabricante (Emerson/Daniel, Honeywell/Elster, Cameron, Endress+Hauser)',
      responsable_tipo: 'externo_obligatorio',
      accion_sugerida: 'Solicitar hoja de datos con dimensiones reales, datasheet y cotización al fabricante.',
      bloquea_exportacion_final: true,
    },
    {
      id: 'plano-cad',
      nombre: 'Plano CAD final + soportería estructural',
      etapa: 5,
      estado: 'falta',
      responsable_rol: 'Software + ingeniero estructural',
      responsable_tipo: 'interno_energon',
      accion_sugerida: 'Completar todos los huecos anteriores para regenerar el plano con datos reales.',
      bloquea_exportacion_final: false,
    },
    {
      id: 'dictamen-uv',
      nombre: 'Dictamen de instalación (Unidad de Verificación EMA)',
      etapa: 6,
      estado: 'falta',
      responsable_rol: 'Unidad de Verificación acreditada EMA',
      responsable_tipo: 'externo_obligatorio',
      accion_sugerida: 'Contratar UV acreditada ante EMA. Este dictamen es requerimiento legal previo al arranque.',
      bloquea_exportacion_final: true,
    },
  ]

  if (tipo === 'city_gate') {
    actividades.push({
      id: 'validacion-cenagas',
      nombre: 'Validación de interconexión con CENAGAS/transportista',
      etapa: 6,
      estado: 'falta',
      responsable_rol: 'CENAGAS / permisionario de transporte',
      responsable_tipo: 'externo_obligatorio',
      accion_sugerida: 'Iniciar trámite de interconexión ante CENAGAS — plazo variable, iniciar en paralelo con ingeniería.',
      bloquea_exportacion_final: true,
    })
  }

  if (fiscal) {
    actividades.push({
      id: 'trazabilidad-metrologica',
      nombre: 'Trazabilidad metrológica certificada',
      etapa: 6,
      estado: 'falta',
      responsable_rol: 'Laboratorio acreditado EMA / CENAM',
      responsable_tipo: 'externo_obligatorio',
      accion_sugerida: 'Certificar patrones de calibración con laboratorio acreditado EMA o CENAM para medición fiscal.',
      bloquea_exportacion_final: true,
    })
  }

  actividades.push({
    id: 'firma-responsable',
    nombre: 'Firma de memoria y plano por ingeniero con cédula',
    etapa: 7,
    estado: 'falta',
    responsable_rol: 'Ingeniero con cédula profesional',
    responsable_tipo: 'interno_energon',
    accion_sugerida: 'El software genera un borrador — la firma convierte el documento en legalmente válido.',
    bloquea_exportacion_final: true,
  })

  return actividades
}
