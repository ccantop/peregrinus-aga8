/**
 * Reporte técnico de diseño de punto de medición — @react-pdf/renderer
 * Generado en el servidor (API route), descargable como PDF.
 */

import React from 'react'
import path from 'path'
import {
  Document, Page, Text, View, StyleSheet, Font, Image,
} from '@react-pdf/renderer'

const LOGO_PATH = path.join(process.cwd(), 'public', 'logo.png')

// ─── paleta ──────────────────────────────────────────────────────────────────
const C = {
  accent:  '#4a9ebb',
  ink:     '#1b3044',
  ink2:    '#3a5a72',
  ink3:    '#8aaabb',
  panel:   '#f7fbfd',
  line:    '#d0e0e8',
  warn:    '#c17f24',
  danger:  '#b84030',
  white:   '#ffffff',
}

const s = StyleSheet.create({
  page:     { fontFamily: 'Helvetica', backgroundColor: C.white, padding: '14mm 15mm 12mm 15mm', fontSize: 8, color: C.ink },

  // encabezado
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  logoBox:  { flexDirection: 'column' },
  logoTxt:  { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 3 },
  logoSub:  { fontSize: 7, color: C.ink3, marginTop: 1, letterSpacing: 1 },
  headerR:  { flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  badge:    { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.accent, borderWidth: 1, borderColor: C.accent, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },
  warn:     { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.warn,   borderWidth: 1, borderColor: C.warn,   borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },

  divider:  { height: 1, backgroundColor: C.line, marginVertical: 6 },

  // título del proyecto
  proyNombre: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 2 },
  proyMeta:   { fontSize: 7.5, color: C.ink3, marginBottom: 8 },

  // secciones
  section:  { marginBottom: 10 },
  secTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.ink3, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },

  // tabla 2 columnas
  table:    { borderWidth: 1, borderColor: C.line, borderRadius: 3 },
  row:      { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.line },
  rowLast:  { flexDirection: 'row' },
  cell:     { flex: 1, paddingHorizontal: 6, paddingVertical: 4 },
  cellLabel:{ flex: 1, paddingHorizontal: 6, paddingVertical: 4, color: C.ink3 },
  cellVal:  { flex: 1, paddingHorizontal: 6, paddingVertical: 4, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  // tabla multi-col (tag list)
  th:       { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.ink3, backgroundColor: '#eef4f7', paddingHorizontal: 4, paddingVertical: 3 },
  td:       { fontSize: 6.5, paddingHorizontal: 4, paddingVertical: 3 },

  // caja destacada (tecnología)
  techBox:  { backgroundColor: 'rgba(74,158,187,0.08)', borderWidth: 1, borderColor: 'rgba(74,158,187,0.3)', borderRadius: 3, padding: 8, marginBottom: 6 },
  techNom:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.accent, marginBottom: 2 },
  techRef:  { fontSize: 7.5, color: C.ink2 },

  // caja AGA 8
  aga8Box:  { backgroundColor: 'rgba(74,158,187,0.06)', borderWidth: 1, borderColor: 'rgba(74,158,187,0.2)', borderRadius: 3, padding: 7, marginBottom: 4 },
  aga8Tag:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent },
  aga8Txt:  { fontSize: 7, color: C.ink2, marginTop: 2 },

  // alerta / nota
  nota:     { backgroundColor: '#fffbf4', borderWidth: 1, borderColor: C.warn, borderRadius: 3, padding: 7, marginTop: 8 },
  notaTxt:  { fontSize: 6.5, color: C.ink2, lineHeight: 1.5 },

  // normas
  normRow:  { flexDirection: 'row', gap: 4, marginBottom: 3, alignItems: 'flex-start' },
  normKey:  { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.accent, width: 90 },
  normDesc: { fontSize: 7, color: C.ink2, flex: 1, lineHeight: 1.4 },

  // actividades
  actRow:   { flexDirection: 'row', gap: 6, marginBottom: 3, alignItems: 'flex-start' },
  actDot:   { width: 7, height: 7, borderRadius: 3.5, marginTop: 1.5 },
  actTxt:   { flex: 1, fontSize: 7, color: C.ink2, lineHeight: 1.4 },

  // pie de página
  footer:   { position: 'absolute', bottom: 10, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', fontSize: 6.5, color: C.ink3 },
})

// ─── helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.secTitle}>{children}</Text>
}

function DataRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? s.rowLast : s.row}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={s.cellVal}>{value}</Text>
    </View>
  )
}

const ESTADO_COLOR: Record<string, string> = {
  tienes: '#2d8c4e', falta: C.danger, en_proceso: C.warn,
}
const ESTADO_LABEL: Record<string, string> = {
  tienes: 'Listo', falta: 'Falta', en_proceso: 'En proceso',
}

// ─── tipos ────────────────────────────────────────────────────────────────────

export interface DatosReporte {
  proyecto: {
    id: string
    nombre: string
    cliente: string | null
    tipo_punto: string
    fase_actual: string
    creado_en: string
  }
  f1: {
    fiscal: boolean
    fluido: string
    qmin: number; qnorm: number; qmax: number
    presion_kgcm2: number; diametro_pulg: number
    clase_localizacion: string
    sg?: number | null; co2_pct?: number | null; n2_pct?: number | null
    tecnologia_nombre?: string | null; tecnologia_referencia?: string | null; tecnologia_motivo?: string | null
  }
  actividades: Array<{
    nombre: string; etapa: number; estado: string
    responsable_rol: string; accion_sugerida: string
    bloquea_exportacion_final: boolean
  }>
}

const tipoLabel: Record<string, string> = {
  city_gate: 'City Gate (SISTRANGAS/CENAGAS)',
  industrial: 'Estacion industrial',
  ducto: 'Ducto regional',
  auditoria: 'Auditoria / diagnostico',
}

// ─── documento PDF ────────────────────────────────────────────────────────────

export function ReportePDF({ d }: { d: DatosReporte }) {
  const { proyecto, f1, actividades } = d
  const fecha = new Date(proyecto.creado_en).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const turndown = (Number(f1.qmax) / Math.max(Number(f1.qmin), 0.01)).toFixed(1)
  const presionKPa = (Number(f1.presion_kgcm2) * 98.0665).toFixed(1)
  const dnMm = (Number(f1.diametro_pulg) * 25.4).toFixed(0)

  const actsFalta = actividades.filter(a => a.estado === 'falta')
  const actsBloq  = actividades.filter(a => a.estado === 'falta' && a.bloquea_exportacion_final)

  // Normas aplicables
  const normas: Array<{ clave: string; desc: string }> = [
    { clave: 'NOM-020-ASEA-2024', desc: 'Diseno, construccion, operacion y mantenimiento de sistemas de medicion de gas natural y gas LP. Vigente desde 28-feb-2026.' },
  ]
  const tech = (f1.tecnologia_nombre ?? '').toLowerCase()
  if (tech.includes('ultrason') || tech.includes('aga 9')) normas.push({ clave: 'AGA 9 (2017)', desc: 'Medicion de gas natural por medidores ultrasonicos.' })
  if (tech.includes('orificio') || tech.includes('aga 3')) normas.push({ clave: 'AGA 3 / API 14.3', desc: 'Medicion de flujo de gas con placa de orificio.' })
  if (tech.includes('turbina') || tech.includes('aga 7')) normas.push({ clave: 'AGA 7 (2006)', desc: 'Medicion de gas natural con medidores de turbina.' })
  if (tech.includes('coriolis') || tech.includes('aga 11')) normas.push({ clave: 'AGA 11 (2013)', desc: 'Medicion de gas natural con medidores de efecto Coriolis.' })
  normas.push({ clave: 'AGA 8 DETAIL', desc: 'Factor Z por ecuacion de estado GERG-2008 simplificada. Requerido por NOM-020-ASEA-2024 para medicion fiscal.' })
  normas.push({ clave: 'ISA 5.1', desc: 'Simbologia e identificacion de instrumentacion.' })
  if (f1.fiscal) normas.push({ clave: 'RMF Anexo 21', desc: 'Controles volumetricos para hidrocarburos (SAT). Aplica a puntos de custodia fiscal.' })

  // Tag list (mismos instrumentos que en DXF)
  const pMax = (Number(f1.presion_kgcm2) * 1.25).toFixed(0)
  const feNorma = tech.includes('ultrason') ? 'AGA 9' : tech.includes('orificio') ? 'AGA 3/API 14.3' : tech.includes('turbina') ? 'AGA 7' : tech.includes('coriolis') ? 'AGA 11' : 'AGA/API'
  const tags = [
    ['PT-101', 'Transmisor presion',     `0-${pMax} kg/cm2`,                 'ANSI/ISA 51.1',  'Entrada'],
    ['TT-101', 'Transmisor temperatura', '-20 a +60 C',                       'ISA TR20.00.01', 'Entrada'],
    ['FE-100', `Elemento primario`,      `${f1.qmin}-${f1.qmax} m3/h`,       feNorma,          'Medicion'],
    ['FT-100', 'Transmisor flujo',       `${f1.qmin}-${f1.qmax} m3/h`,       feNorma,          'Medicion'],
    ['PCV-100','Valvula reg. presion',   `0-${f1.presion_kgcm2} kg/cm2`,     'ANSI B16.34',    'Control'],
    ['PT-102', 'Transmisor presion',     `0-${(Number(f1.presion_kgcm2)*.6).toFixed(0)} kg/cm2`, 'ANSI/ISA 51.1', 'Salida'],
    ['FQI-100','Computador de flujo',    'N/D',                               'AGA 8 DETAIL',   'Calculo'],
    ['SEP-100','Separador / filtro',     `DN${f1.diametro_pulg} ASME`,        'ASME VIII',      'Acondic.'],
  ]

  return (
    <Document title={`Reporte Tecnico — ${proyecto.nombre}`} author="Peregrin">

      {/* ─── Página 1: Datos del proyecto + Tecnología + Cálculo ─── */}
      <Page size="A4" style={s.page}>
        {/* Encabezado */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <Image src={LOGO_PATH} style={{ width: 22, height: 22, marginBottom: 2 }} />
            <Text style={s.logoTxt}>PEREGRIN</Text>
            <Text style={s.logoSub}>GAS ENGINEERING EXPERTS</Text>
          </View>
          <View style={s.headerR}>
            <Text style={s.badge}>REPORTE TECNICO</Text>
            {f1.fiscal && <Text style={s.badge}>CUSTODIA FISCAL</Text>}
            <Text style={s.warn}>BORRADOR</Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* Nombre del proyecto */}
        <Text style={s.proyNombre}>{proyecto.nombre}</Text>
        <Text style={s.proyMeta}>
          {proyecto.cliente ? `${proyecto.cliente}  ·  ` : ''}
          {tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto}  ·  {fecha}  ·  Rev. 0
        </Text>

        {/* Datos del punto */}
        <View style={s.section}>
          <SectionTitle>Datos del punto de medicion</SectionTitle>
          <View style={s.table}>
            <DataRow label="Tipo de punto"      value={tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto} />
            <DataRow label="Fluido"             value={f1.fluido === 'gn' ? 'Gas natural' : 'GLP / mezcla'} />
            <DataRow label="Custodia fiscal"    value={f1.fiscal ? 'Si' : 'No'} />
            <DataRow label="Clase localizacion" value={f1.clase_localizacion === 'na' ? 'No aplica' : `Clase ${f1.clase_localizacion}`} />
          </View>
        </View>

        {/* Condiciones de operación */}
        <View style={s.section}>
          <SectionTitle>Condiciones de diseno y proceso</SectionTitle>
          <View style={s.table}>
            <DataRow label="Caudal minimo (Qmin)"   value={`${Number(f1.qmin).toLocaleString('es-MX')} m³/h`} />
            <DataRow label="Caudal nominal (Qnorm)" value={`${Number(f1.qnorm).toLocaleString('es-MX')} m³/h`} />
            <DataRow label="Caudal maximo (Qmax)"   value={`${Number(f1.qmax).toLocaleString('es-MX')} m³/h`} />
            <DataRow label="Rango de medición"       value={`1 : ${turndown}`} />
            <DataRow label="Presion de operacion"   value={`${f1.presion_kgcm2} kg/cm²  (${presionKPa} kPa)`} />
            <DataRow label="Diametro nominal"       value={`${f1.diametro_pulg}"  (DN${dnMm} mm)`} />
            {f1.sg     != null && <DataRow label="Gravedad especifica (SG)" value={String(f1.sg)} />}
            {f1.co2_pct != null && <DataRow label="CO₂ (% mol)"       value={`${f1.co2_pct} %`} />}
            {f1.n2_pct  != null && <DataRow label="N₂ (% mol)"        value={`${f1.n2_pct} %`} last />}
          </View>
        </View>

        {/* Tecnología */}
        {f1.tecnologia_nombre && (
          <View style={s.section}>
            <SectionTitle>Tecnologia de medicion recomendada</SectionTitle>
            <View style={s.techBox}>
              <Text style={s.techNom}>{f1.tecnologia_nombre}</Text>
              {f1.tecnologia_referencia && (
                <Text style={s.techRef}>Norma de referencia: {f1.tecnologia_referencia}</Text>
              )}
              {f1.tecnologia_motivo && (
                <Text style={[s.techRef, { marginTop: 4 }]}>{f1.tecnologia_motivo}</Text>
              )}
            </View>
          </View>
        )}

        {/* Metodología de cálculo Z */}
        <View style={s.section}>
          <SectionTitle>Metodologia de calculo — Factor Z</SectionTitle>
          <View style={s.aga8Box}>
            <Text style={s.aga8Tag}>AGA 8 DETAIL  —  GERG-2008 simplificada</Text>
            <Text style={s.aga8Txt}>
              El factor de compresibilidad Z se calcula con la ecuacion de estado AGA 8 DETAIL,
              derivando la composicion molecular (CH4, C2H6, N2, CO2) de los parametros SG / CO2 / N2.
              Este es el unico metodo aceptado por NOM-020-ASEA-2024 para medicion fiscal.
            </Text>
            {f1.sg != null && (
              <Text style={[s.aga8Txt, { fontFamily: 'Helvetica-Bold', marginTop: 4 }]}>
                SG {f1.sg}{f1.co2_pct != null ? `  ·  CO2 ${f1.co2_pct} %` : ''}{f1.n2_pct != null ? `  ·  N2 ${f1.n2_pct} %` : ''}
              </Text>
            )}
          </View>
        </View>

        {/* Pie de página */}
        <View style={s.footer} fixed>
          <Text>PEREGRIN — Diseno de puntos de medicion  |  Borrador Rev.0</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* ─── Página 2: Tag list + Normas + Actividades ─── */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.logoBox}>
            <Image src={LOGO_PATH} style={{ width: 22, height: 22, marginBottom: 2 }} />
            <Text style={s.logoTxt}>PEREGRIN</Text>
            <Text style={s.logoSub}>GAS ENGINEERING EXPERTS</Text>
          </View>
          <View style={s.headerR}>
            <Text style={s.badge}>REPORTE TECNICO  |  PAG 2</Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* Tag list */}
        <View style={s.section}>
          <SectionTitle>Lista de instrumentos (Tag List) — referencia</SectionTitle>
          <View style={s.table}>
            {/* encabezado */}
            <View style={[s.row, { backgroundColor: '#eef4f7' }]}>
              {['TAG', 'TIPO', 'RANGO / ESCALA', 'NORMA', 'SERVICIO'].map((h, i) => (
                <Text key={i} style={[s.th, { flex: [0.7, 1.5, 1.3, 1, 0.8][i] }]}>{h}</Text>
              ))}
            </View>
            {tags.map(([tag, tipo, rango, norma, svc], i) => (
              <View key={i} style={i < tags.length - 1 ? s.row : s.rowLast}>
                {[tag, tipo, rango, norma, svc].map((val, j) => (
                  <Text key={j} style={[s.td, { flex: [0.7, 1.5, 1.3, 1, 0.8][j] }]}>{val}</Text>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Normas */}
        <View style={s.section}>
          <SectionTitle>Marco normativo aplicable</SectionTitle>
          {normas.map((n, i) => (
            <View key={i} style={s.normRow}>
              <Text style={s.normKey}>{n.clave}</Text>
              <Text style={s.normDesc}>{n.desc}</Text>
            </View>
          ))}
        </View>

        {/* Actividades */}
        {actividades.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Actividades y huecos del proyecto</SectionTitle>
            {actividades.map((a, i) => (
              <View key={i} style={s.actRow}>
                <View style={[s.actDot, { backgroundColor: ESTADO_COLOR[a.estado] ?? C.ink3 }]} />
                <Text style={s.actTxt}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>{ESTADO_LABEL[a.estado] ?? a.estado}</Text>
                  {'  '}{a.nombre}
                  {a.accion_sugerida ? `  —  ${a.accion_sugerida}` : ''}
                  {a.bloquea_exportacion_final && a.estado === 'falta' ? '  [BLOQUEA EXPORTACION]' : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Resumen de huecos */}
        {actsFalta.length > 0 && (
          <View style={s.nota}>
            <Text style={[s.notaTxt, { fontFamily: 'Helvetica-Bold', marginBottom: 3 }]}>
              Huecos pendientes: {actsFalta.length}  |  Bloquean exportacion final: {actsBloq.length}
            </Text>
            <Text style={s.notaTxt}>
              Este reporte es un borrador. Los huecos marcados como "Falta" deben resolverse
              antes de emitir planos para firma de ingeniero responsable.
            </Text>
          </View>
        )}

        {/* Nota legal */}
        <View style={[s.nota, { marginTop: 12, borderColor: C.line, backgroundColor: C.panel }]}>
          <Text style={[s.notaTxt, { color: C.ink3 }]}>
            AVISO LEGAL: Este documento es un borrador de ingenieria generado automaticamente.
            Requiere revision y firma de ingeniero con cedula profesional antes de tener validez legal.
            PEREGRIN no emite dictamen de Unidad de Verificacion (UV), no valida interconexion ante
            CENAGAS/SISTRANGAS, ni certifica trazabilidad metrologica. No sustituye la ingenieria de detalle.
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text>PEREGRIN — Diseno de puntos de medicion  |  Borrador Rev.0</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
