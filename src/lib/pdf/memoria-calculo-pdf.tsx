import React from 'react'
import { Document, Page, Text, View, StyleSheet, Svg, Rect, Line, Circle, Text as SvgText } from '@react-pdf/renderer'

const C = {
  accent: '#4a9ebb', ink: '#1b3044', ink2: '#3a5a72', ink3: '#8aaabb',
  line: '#d0e0e8', panel: '#f7fbfd', white: '#ffffff',
  warn: '#c17f24', danger: '#b84030', ok: '#2d8c4e',
}

const s = StyleSheet.create({
  page:     { fontFamily: 'Helvetica', fontSize: 8, color: C.ink, padding: '13mm 15mm 11mm 15mm', backgroundColor: C.white },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  logoTxt:  { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 3 },
  logoSub:  { fontSize: 6.5, color: C.ink3, marginTop: 1 },
  badge:    { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.accent, borderWidth: 1, borderColor: C.accent, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },
  warnBadge:{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.warn,   borderWidth: 1, borderColor: C.warn,   borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },
  divider:  { height: 1, backgroundColor: C.line, marginVertical: 5 },

  // portada
  docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.ink, marginTop: 10, marginBottom: 3 },
  docSub:   { fontSize: 9, color: C.ink2, marginBottom: 12 },

  // secciones
  secNum:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.accent, marginBottom: 2, marginTop: 10 },
  secTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 4 },
  body:     { fontSize: 7.5, color: C.ink2, lineHeight: 1.5, marginBottom: 3 },
  bold:     { fontFamily: 'Helvetica-Bold', color: C.ink },

  // tablas
  tbl:      { borderWidth: 1, borderColor: C.line, borderRadius: 2, marginBottom: 6 },
  tRow:     { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.line },
  tRowLast: { flexDirection: 'row' },
  tHdr:     { backgroundColor: C.panel },
  tLbl:     { width: '22%', paddingHorizontal: 6, paddingVertical: 3.5, color: C.ink3 },
  tVal:     { flex: 1, paddingHorizontal: 6, paddingVertical: 3.5, fontFamily: 'Helvetica-Bold' },
  tLbl2:    { width: '22%', paddingHorizontal: 6, paddingVertical: 3.5, color: C.ink3, borderLeftWidth: 1, borderColor: C.line },
  tVal2:    { flex: 1, paddingHorizontal: 6, paddingVertical: 3.5, fontFamily: 'Helvetica-Bold' },

  // caja AGA8
  aga8Box:  { backgroundColor: 'rgba(74,158,187,0.06)', borderWidth: 1, borderColor: 'rgba(74,158,187,0.25)', borderRadius: 3, padding: 8, marginBottom: 6 },
  aga8Tag:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.accent, marginBottom: 2 },

  // alertas
  alertBox: { borderRadius: 2, padding: 5, marginBottom: 4, flexDirection: 'row', gap: 5 },
  alertTxt: { flex: 1, fontSize: 7, lineHeight: 1.4 },

  // caja resultado tecnología
  techBox:  { backgroundColor: 'rgba(74,158,187,0.08)', borderWidth: 1, borderColor: 'rgba(74,158,187,0.3)', borderRadius: 3, padding: 8, marginBottom: 6 },
  techNom:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.accent, marginBottom: 2 },

  // normas
  normRow:  { flexDirection: 'row', gap: 4, marginBottom: 4 },
  normKey:  { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.accent, width: 95 },
  normDesc: { fontSize: 7, color: C.ink2, flex: 1, lineHeight: 1.4 },

  footer:   { position: 'absolute', bottom: 10, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', fontSize: 6.5, color: C.ink3 },
})

// ─── helpers ─────────────────────────────────────────────────────────────────

function Row2({ l1, v1, l2, v2, last }: { l1: string; v1?: string | number | null; l2: string; v2?: string | number | null; last?: boolean }) {
  const fmt = (v: unknown) => (v != null && v !== '') ? String(v) : '—'
  return (
    <View style={last ? s.tRowLast : s.tRow}>
      <Text style={s.tLbl}>{l1}</Text>
      <Text style={s.tVal}>{fmt(v1)}</Text>
      <Text style={s.tLbl2}>{l2}</Text>
      <Text style={s.tVal2}>{fmt(v2)}</Text>
    </View>
  )
}

function Row({ label, value, last }: { label: string; value?: string | number | null; last?: boolean }) {
  return (
    <View style={last ? s.tRowLast : s.tRow}>
      <Text style={s.tLbl}>{label}</Text>
      <Text style={s.tVal}>{value != null && value !== '' ? String(value) : '—'}</Text>
    </View>
  )
}

const ALERT_COLOR = { info: C.accent, warn: C.warn, danger: C.danger }
const ALERT_BG    = { info: 'rgba(74,158,187,0.07)', warn: 'rgba(193,127,36,0.08)', danger: 'rgba(184,64,48,0.07)' }

function AlertBox({ nivel, texto }: { nivel: string; texto: string }) {
  const col = ALERT_COLOR[nivel as keyof typeof ALERT_COLOR] ?? C.ink3
  const bg  = ALERT_BG[nivel as keyof typeof ALERT_BG]  ?? 'rgba(0,0,0,0.04)'
  return (
    <View style={[s.alertBox, { backgroundColor: bg, borderLeftWidth: 3, borderColor: col }]}>
      <Text style={[s.alertTxt, { color: col }]}>
        {nivel.toUpperCase()}{'  '}{texto}
      </Text>
    </View>
  )
}

// ─── gráficas SVG ─────────────────────────────────────────────────────────────

function RangoChart({ qmin, qnorm, qmax }: { qmin: number; qnorm: number; qmax: number }) {
  const W = 468, H = 94
  const PL = 14, PR = 14, trackY = 46, trackH = 12
  const trackW = W - PL - PR
  const scale = qmax * 1.08
  const xOf = (q: number) => PL + (q / scale) * trackW
  const xMin = xOf(qmin), xNorm = xOf(qnorm), xMax = xOf(qmax)
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`
  const td = (Number(qmax) / Math.max(Number(qmin), 0.01)).toFixed(1)
  return (
    <Svg width={W} height={H}>
      {/* eje de referencia */}
      <Line x1={PL} y1={trackY + trackH + 1} x2={PL + trackW} y2={trackY + trackH + 1} stroke={C.line} strokeWidth={0.5} />
      {/* fondo */}
      <Rect x={PL} y={trackY} width={trackW} height={trackH} fill="#e8f4f8" rx="3" />
      {/* rango medible */}
      <Rect x={xMin} y={trackY} width={xMax - xMin} height={trackH} fill={C.accent} rx="2" />
      {/* Qnorm — barra central */}
      <Rect x={xNorm - 2} y={trackY + 1} width={4} height={trackH - 2} fill={C.ink} rx="1" />
      {/* Qmin / Qmax ticks — solo dentro de la barra */}
      <Line x1={xMin} y1={trackY + 1} x2={xMin} y2={trackY + trackH - 1} stroke={C.ink2} strokeWidth={1.5} />
      <Line x1={xMax} y1={trackY + 1} x2={xMax} y2={trackY + trackH - 1} stroke={C.ink2} strokeWidth={1.5} />
      {/* etiquetas ARRIBA con espacio suficiente */}
      <SvgText x={xMin} y={trackY - 18} style={{ fontSize: 7, fill: C.ink2 }} textAnchor="middle">Qmin</SvgText>
      <SvgText x={xMin} y={trackY - 9} style={{ fontSize: 6.5, fill: C.ink3 }} textAnchor="middle">{fmt(qmin)} m3/h</SvgText>
      <SvgText x={xMax} y={trackY - 18} style={{ fontSize: 7, fill: C.ink2 }} textAnchor="middle">Qmax</SvgText>
      <SvgText x={xMax} y={trackY - 9} style={{ fontSize: 6.5, fill: C.ink3 }} textAnchor="middle">{fmt(qmax)} m3/h</SvgText>
      {/* etiqueta ABAJO: Qnorm */}
      <SvgText x={xNorm} y={trackY + trackH + 12} style={{ fontSize: 7.5, fill: C.ink }} textAnchor="middle">Qnorm  {fmt(qnorm)} m3/h</SvgText>
      {/* turndown */}
      <SvgText x={W - PR} y={H - 4} style={{ fontSize: 6.5, fill: C.ink3 }} textAnchor="end">Rango de medición {td}:1</SvgText>
    </Svg>
  )
}

function JTChart({ tamb, t_salida, dew_agua, dew_hc }: {
  tamb: number; t_salida: number; dew_agua: number; dew_hc: number
}) {
  const W = 468, H = 108
  const PL = 20, PR = 20
  // zona texto arriba 32px, barra 14px, zona texto abajo 62px
  const trackY = 32, trackH = 14
  const trackW = W - PL - PR
  const allT = [tamb, t_salida, dew_agua, dew_hc]
  const T_MIN = Math.min(...allT) - 12
  const T_MAX = Math.max(...allT) + 12
  const xOf = (t: number) => PL + ((t - T_MIN) / (T_MAX - T_MIN)) * trackW
  const xAmb = xOf(tamb), xSal = xOf(t_salida)
  const xDewA = xOf(dew_agua), xDewH = xOf(dew_hc)
  const margenOk = t_salida > dew_agua + 3
  const salCol = margenOk ? C.ok : C.danger
  const mid = trackY + trackH / 2
  const bY = trackY + trackH
  const R = 5
  const deltaT = (t_salida - tamb).toFixed(1)   // negativo = enfriamiento

  return (
    <Svg width={W} height={H}>
      {/* fondo pista */}
      <Rect x={PL} y={trackY} width={trackW} height={trackH} fill="#e8f4f8" stroke="none" rx="3" />
      {/* ticks de rocío dentro de la barra */}
      <Line x1={xDewA} y1={trackY + 2} x2={xDewA} y2={trackY + trackH - 2} stroke={C.danger} strokeWidth={2.5} />
      <Line x1={xDewH} y1={trackY + 2} x2={xDewH} y2={trackY + trackH - 2} stroke={C.warn}   strokeWidth={2.5} />
      {/* círculos */}
      <Circle cx={xAmb} cy={mid} r={String(R)} fill={C.accent} stroke="none" />
      <Circle cx={xSal} cy={mid} r={String(R)} fill={salCol}   stroke="none" />
      {/* guías ligeras */}
      <Line x1={xDewA} y1={bY} x2={xDewA} y2={bY + 9} stroke="rgba(184,64,48,0.25)" strokeWidth={0.8} />
      <Line x1={xDewH} y1={bY} x2={xDewH} y2={bY + 9} stroke="rgba(193,127,36,0.25)" strokeWidth={0.8} />

      {/* ARRIBA: T operacion — "T" alineada al centro del círculo azul */}
      <SvgText x={xAmb - R} y={trackY - 6} style={{ fontSize: 7, fill: C.accent }} textAnchor="start">{`T operacion  ${tamb.toFixed(1)}C`}</SvgText>

      {/* ABAJO — Rocio H2O: etiqueta + valor en una línea, centrado */}
      <SvgText x={xDewA} y={bY + 13} style={{ fontSize: 6.5, fill: C.danger }} textAnchor="middle">Rocio H2O</SvgText>
      <SvgText x={xDewA} y={bY + 22} style={{ fontSize: 7.5, fill: C.danger }} textAnchor="middle">{dew_agua.toFixed(1)}C</SvgText>
      {/* ABAJO — Rocio HC */}
      <SvgText x={xDewH} y={bY + 13} style={{ fontSize: 6.5, fill: C.warn }}   textAnchor="middle">Rocio HC</SvgText>
      <SvgText x={xDewH} y={bY + 22} style={{ fontSize: 7.5, fill: C.warn }}   textAnchor="middle">{dew_hc.toFixed(1)}C</SvgText>
      {/* ABAJO — T salida: etiqueta+valor en línea 1, estado en línea 2, inicio en borde izq del círculo */}
      <SvgText x={xSal - R} y={bY + 13} style={{ fontSize: 6.5, fill: salCol }} textAnchor="start">{`T salida regulador  ${t_salida.toFixed(1)}C  (dT ${deltaT}C)`}</SvgText>
      <SvgText x={xSal - R} y={bY + 23} style={{ fontSize: 7, fill: salCol }}   textAnchor="start">{margenOk ? 'OK — margen suficiente' : 'RIESGO DE HIDRATO'}</SvgText>
    </Svg>
  )
}

function ComposicionChart({ sg, co2_pct, n2_pct, composicion }: {
  sg: number; co2_pct: number; n2_pct: number; composicion?: Record<string, number> | null
}) {
  const W = 468, H = 96
  const PL = 14, PR = 14, barY = 38, barH = 18
  const barW = W - PL - PR

  let ch4 = 0, c2p = 0, co2 = co2_pct, n2 = n2_pct

  if (composicion) {
    const get = (...keys: string[]) => {
      for (const k of keys) { if (composicion[k] != null) return composicion[k] * 100 }
      return 0
    }
    ch4 = get('methane', 'Methane', 'CH4')
    co2 = get('co2', 'CO2', 'carbon_dioxide')
    n2  = get('nitrogen', 'N2', 'Nitrogen')
    c2p = Math.max(0, 100 - ch4 - co2 - n2)
  } else {
    const rest = Math.max(0, 100 - co2 - n2)
    const mwMix  = sg * 28.9625
    const mwRest = (mwMix - (co2 / 100) * 44.01 - (n2 / 100) * 28.013) / Math.max(0.01, rest / 100)
    const c2frac = Math.max(0, Math.min(0.5, (mwRest - 16.043) / (30.07 - 16.043)))
    c2p = rest * c2frac
    ch4 = rest - c2p
  }

  const total = ch4 + c2p + co2 + n2
  const segs = [
    { label: 'Metano CH4',   pct: ch4, color: C.accent },
    { label: 'Pesados C2+',  pct: c2p, color: '#2d8c4e' },
    { label: 'CO2',          pct: co2, color: C.warn },
    { label: 'Nitrogeno N2', pct: n2,  color: C.ink3 },
  ]
  // leyenda en fila arriba de la barra
  const legendX = [PL, PL + 110, PL + 210, PL + 310]
  return (
    <Svg width={W} height={H}>
      {/* leyenda */}
      {segs.map((seg, i) => (
        <React.Fragment key={seg.label + 'leg'}>
          <Rect x={legendX[i]} y={10} width={8} height={8} fill={seg.color} rx="1" />
          <SvgText x={legendX[i] + 11} y={17} style={{ fontSize: 6.5, fill: seg.color }}>{seg.label}</SvgText>
        </React.Fragment>
      ))}
      {/* barra apilada */}
      {(() => {
        let cursor = PL
        return segs.map(seg => {
          const w = (seg.pct / total) * barW
          const x = cursor
          cursor += w
          return (
            <React.Fragment key={seg.label}>
              <Rect x={x} y={barY} width={w} height={barH} fill={seg.color} rx="0" />
              {w > 24 && (
                <SvgText x={x + w / 2} y={barY + barH / 2 + 3} style={{ fontSize: 7, fill: '#fff' }} textAnchor="middle">
                  {seg.pct.toFixed(1)}%
                </SvgText>
              )}
            </React.Fragment>
          )
        })
      })()}
      {/* fuente */}
      <SvgText x={W - PR} y={H - 2} style={{ fontSize: 6, fill: C.ink3 }} textAnchor="end">
        {composicion ? 'Fuente: AGA 8 DETAIL' : 'Estimado de SG, CO2, N2'}
      </SvgText>
    </Svg>
  )
}

// ─── props ────────────────────────────────────────────────────────────────────

export interface DatosMemoria {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proyecto: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f1: any
  aga8?: {
    z: number
    densidad_kgm3: number
    composicion: Record<string, number>
  } | null
  aga7?: {
    Fpv: number
    Zf: number
    Zb: number
    qb_min: number
    qb_norm: number
    qb_max: number
    Pf_kpa: number
    Pb_kpa: number
    Tf_k: number
    Tb_k: number
  } | null
  aga3?: {
    D_mm: number
    d_mm: number
    beta: number
    Cd: number
    Ev: number
    dp_max_mbar: number
    dp_norm_mbar: number
    dp_min_mbar: number
    rho_kgm3: number
    Re_D_max: number
    toma: string
    schedule: string
    valido: boolean
    alerta?: string
    dp_objetivo_mbar: number
  } | null
  calculo: {
    Z_papay: number
    Tr: number
    Pr: number
    caida_jt_c: number
    t_salida_regulador_c: number
    alertas: Array<{ nivel: string; texto: string }>
  }
}

// ─── documento ───────────────────────────────────────────────────────────────

export function MemoriaCalculoPDF({ d }: { d: DatosMemoria }) {
  const { proyecto, f1, aga8, aga7, aga3, calculo } = d
  const fecha = new Date(proyecto.creado_en).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const presionKPa   = (Number(f1.presion_kgcm2) * 98.0665).toFixed(1)
  const presionBar   = (Number(f1.presion_kgcm2) * 0.980665).toFixed(2)
  const dnMm         = (Number(f1.diametro_pulg) * 25.4).toFixed(0)
  const turndown     = (Number(f1.qmax) / Math.max(Number(f1.qmin), 0.01)).toFixed(1)
  const Z_usado      = aga8?.z ?? calculo.Z_papay
  const metodo_Z     = aga8 ? 'AGA 8 DETAIL (GERG-2008)' : 'Papay (screening)'
  const pAbsKPa      = Number(f1.presion_kgcm2) * 98.0665 + 101.325
  const T_K          = (Number(f1.tamb_min_c ?? 20) + 273.15)
  const R            = 8.314
  const MW_mix       = 0.65 * 28.9625  // aproximación
  const densidad_calc = aga8?.densidad_kgm3 ?? (pAbsKPa * 1000 * MW_mix / (R * T_K * Z_usado * 1000)).toFixed(3)

  // Normas
  const tech = (f1.tecnologia_nombre ?? '').toLowerCase()
  const normas = [
    { clave: 'NOM-020-ASEA-2024', desc: 'Diseño, construcción, operación y mantenimiento de sistemas de medición de gas natural y gas LP. Vigente desde 28-feb-2026.' },
    ...(tech.includes('ultrason') ? [{ clave: 'AGA Report No. 9 (2017)', desc: 'Medición de gas natural por medidores ultrasónicos. Define requisitos de tramos rectos, diagnósticos y verificación.' }] : []),
    ...(tech.includes('orificio') ? [{ clave: 'AGA Report No. 3 / API 14.3', desc: 'Medición de gas natural con placa de orificio. Ecuación de flujo, geometría y coeficientes de descarga.' }] : []),
    ...(tech.includes('turbina') ? [{ clave: 'AGA Report No. 7 (2006)', desc: 'Medición de gas natural con medidores de turbina. Calibración, instalación y operación.' }] : []),
    ...(tech.includes('coriolis') ? [{ clave: 'AGA Report No. 11 (2013)', desc: 'Medición de gas natural con medidores Coriolis.' }] : []),
    { clave: 'AGA Report No. 8 (2017)', desc: 'Ecuación de estado para el cálculo del factor Z. Método DETAIL requerido por NOM-020 para medición fiscal.' },
    { clave: 'ISA 5.1', desc: 'Simbología e identificación de instrumentación. Aplica al diagrama P&ID de la estación.' },
    ...(f1.fiscal ? [{ clave: 'RMF Anexo 21', desc: 'Controles volumétricos para contribuyentes en hidrocarburos. Aplica a puntos de custodia fiscal ante el SAT.' }] : []),
  ]

  const Footer = () => (
    <View style={s.footer} fixed>
      <Text>PEREGRIN — Memoria de cálculo  |  {proyecto.nombre}  |  Borrador Rev.0</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )

  return (
    <Document title={`Memoria de cálculo — ${proyecto.nombre}`} author="Peregrin">

      {/* ─── Página 1: Portada + Alcance + Datos de entrada ─── */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.logoTxt}>PEREGRIN</Text>
            <Text style={s.logoSub}>INGENIERIA NORMATIVA DE ESTACIONES DE MEDICION</Text>
          </View>
          <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <Text style={s.badge}>MEMORIA DE CALCULO</Text>
            <Text style={s.warnBadge}>BORRADOR REV. 0</Text>
          </View>
        </View>
        <View style={s.divider} />

        <Text style={s.docTitle}>{proyecto.nombre}</Text>
        <Text style={s.docSub}>
          {proyecto.cliente ? `${proyecto.cliente}  ·  ` : ''}
          {proyecto.tipo_punto?.replace('_', ' ').toUpperCase()}  ·  {fecha}
        </Text>

        {/* 1. Alcance */}
        <Text style={s.secNum}>1.</Text>
        <Text style={s.secTitle}>Alcance y propósito</Text>
        <Text style={s.body}>
          La presente memoria documenta los criterios técnicos, cálculos y selección normativa para el diseño
          preliminar del punto de medición de gas natural denominado <Text style={s.bold}>{proyecto.nombre}</Text>.
          El documento corresponde a la Fase 1 (diseño de oficina) y sirve como base para la ingeniería de detalle.
        </Text>
        <Text style={s.body}>
          Tipo de punto: <Text style={s.bold}>{proyecto.tipo_punto?.replace(/_/g, ' ')}</Text>.{'  '}
          Custodia fiscal: <Text style={s.bold}>{f1?.fiscal ? 'Sí — aplica NOM-020-ASEA-2024 y RMF Anexo 21' : 'No — medición de control interno'}</Text>.
        </Text>
        <Text style={s.body}>
          Este documento es un borrador generado automáticamente. No sustituye la ingeniería de detalle firmada por
          ingeniero responsable con cédula profesional.
        </Text>

        {/* 2. Datos de entrada */}
        <Text style={[s.secNum, { marginTop: 8 }]}>2.</Text>
        <Text style={s.secTitle}>Datos de entrada del proceso</Text>
        <View style={s.tbl}>
          <Row2 l1="Qmín" v1={`${Number(f1.qmin).toLocaleString('es-MX')} m³/h`}
                l2="Qmáx" v2={`${Number(f1.qmax).toLocaleString('es-MX')} m³/h`} />
          <Row2 l1="Qnorm" v1={`${Number(f1.qnorm).toLocaleString('es-MX')} m³/h`}
                l2="Rango de medición" v2={`${turndown} : 1`} />
          <Row2 l1="Presión operación" v1={`${f1.presion_kgcm2} kg/cm²  (${presionBar} bar)`}
                l2="Presión absoluta" v2={`${presionKPa} kPa`} />
          <Row2 l1="Diámetro nominal" v1={`${f1.diametro_pulg}" (DN${dnMm} mm)`}
                l2="Fluido" v2={f1.fluido === 'gn' ? 'Gas natural' : 'GLP / mezcla'} />
          <Row2 l1="T° mín diseño" v1={f1.tamb_min_c != null ? `${f1.tamb_min_c} °C` : null}
                l2="Elevación" v2={f1.elevacion_msnm != null ? `${f1.elevacion_msnm} msnm` : 'N/D'} />
          <Row2 l1="P base cálculo" v1={f1.p_base_kpa != null ? `${f1.p_base_kpa} kPa` : '101.325 kPa'}
                l2="T base cálculo" v2={f1.t_base_c != null ? `${f1.t_base_c} °C` : '15.6 °C'} last />
        </View>

        {/* Gráfica rango de operación */}
        <Text style={[s.secTitle, { marginTop: 6 }]}>Rango de operación</Text>
        <View style={{ marginBottom: 4 }}>
          <RangoChart
            qmin={Number(f1.qmin)}
            qnorm={Number(f1.qnorm)}
            qmax={Number(f1.qmax)}
          />
        </View>

        {/* Composición del gas */}
        <Text style={s.secTitle}>Composición del gas (parámetros de entrada)</Text>
        <View style={s.tbl}>
          <Row2 l1="Gravedad específica (SG)" v1={f1.sg ?? 'N/D'}
                l2="SG respecto a aire = 1" v2="P.M. mezcla aprox." />
          <Row2 l1="CO₂ (% mol)" v1={f1.co2_pct != null ? `${f1.co2_pct} %` : 'N/D'}
                l2="N₂ (% mol)" v2={f1.n2_pct != null ? `${f1.n2_pct} %` : 'N/D'} />
          <Row2 l1="Punto rocío agua" v1={f1.dew_agua_c != null ? `${f1.dew_agua_c} °C` : 'N/D'}
                l2="Punto rocío HC" v2={f1.dew_hc_c != null ? `${f1.dew_hc_c} °C` : 'N/D'} last />
        </View>

        {/* Gráfica composición */}
        <Text style={[s.secTitle, { marginTop: 12 }]}>Composición estimada (% mol)</Text>
        <View style={{ marginBottom: 2 }}>
          <ComposicionChart
            sg={Number(f1.sg ?? 0.65)}
            co2_pct={Number(f1.co2_pct ?? 2)}
            n2_pct={Number(f1.n2_pct ?? 1)}
            composicion={aga8?.composicion}
          />
        </View>

        <Footer />
      </Page>

      {/* ─── Página 2: Cálculo Z + JT + Tecnología ─── */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View><Text style={s.logoTxt}>PEREGRIN</Text><Text style={s.logoSub}>MEMORIA DE CALCULO</Text></View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}><Text style={s.badge}>{proyecto.nombre}</Text></View>
        </View>
        <View style={s.divider} />

        {/* 3. Factor Z */}
        <Text style={s.secNum}>3.</Text>
        <Text style={s.secTitle}>Cálculo del factor de compresibilidad Z</Text>

        <View style={s.aga8Box}>
          <Text style={s.aga8Tag}>Método: {metodo_Z}</Text>
          <Text style={[s.body, { marginBottom: 0 }]}>
            {aga8
              ? 'Factor Z calculado con la ecuación de estado AGA 8 DETAIL (GERG-2008 simplificada), implementada mediante la librería pyaga8. La composición molecular se estima a partir de SG, CO₂ y N₂ por el método de equilibrio de pesos moleculares.'
              : 'Factor Z calculado con la correlación de Papay. Válido únicamente para screening preliminar. Para medición fiscal se requiere AGA 8 DETAIL (NOM-020-ASEA-2024). Activar el servicio Python (pyaga8) para obtener el valor normativo.'}
          </Text>
        </View>

        <View style={s.tbl}>
          <Row2 l1="Z (método usado)" v1={Z_usado.toFixed(6)}
                l2="Método" v2={metodo_Z} />
          {calculo.Z_papay > 0 && aga8 && (
            <Row2 l1="Z Papay (referencia)" v1={calculo.Z_papay.toFixed(6)}
                  l2="Diferencia" v2={`${Math.abs((aga8.z - calculo.Z_papay) / calculo.Z_papay * 100).toFixed(2)} %`} />
          )}
          <Row2 l1="Temperatura reducida Tr" v1={calculo.Tr.toFixed(4)}
                l2="Presión reducida Pr" v2={calculo.Pr.toFixed(4)} />
          <Row  label="Densidad en condiciones de operación"
                value={aga8 ? `${aga8.densidad_kgm3} kg/m³` : `${densidad_calc} kg/m³ (estimada)`} last />
        </View>

        {aga8?.composicion && (
          <>
            <Text style={s.secTitle}>Composición molecular derivada (AGA 8)</Text>
            <View style={s.tbl}>
              {Object.entries(aga8.composicion).map(([comp, frac], i, arr) => (
                <Row key={comp} label={comp} value={`${(frac * 100).toFixed(4)} % mol`} last={i === arr.length - 1} />
              ))}
            </View>
          </>
        )}

        {/* 4. Joule-Thomson */}
        <Text style={[s.secNum, { marginTop: 6 }]}>4.</Text>
        <Text style={s.secTitle}>Efecto Joule-Thomson en etapa de regulación</Text>
        <Text style={s.body}>
          La reducción de presión en la válvula reguladora produce un enfriamiento del gas (efecto JT).
          Se calcula con el coeficiente JT estimado a partir de la gravedad especifica del gas.
        </Text>
        <View style={s.tbl}>
          <Row2 l1="dP en regulador" v1={f1.dp_regulador_bar != null ? `${f1.dp_regulador_bar} bar` : 'N/D'}
                l2="Coef. JT estimado" v2={`~${(0.3 + (Number(f1.sg ?? 0.65) - 0.55) * 0.6).toFixed(2)} C/bar`} />
          <Row2 l1="Caída de temperatura" v1={`${calculo.caida_jt_c.toFixed(2)} °C`}
                l2="T° salida regulador" v2={`${calculo.t_salida_regulador_c.toFixed(2)} °C`} />
          <Row2 l1="Punto rocío agua" v1={f1.dew_agua_c != null ? `${f1.dew_agua_c} °C` : 'N/D'}
                l2="Margen vs. rocío agua" v2={f1.dew_agua_c != null
                  ? `${(calculo.t_salida_regulador_c - Number(f1.dew_agua_c)).toFixed(1)} °C`
                  : 'N/D'} last />
        </View>

        {/* Gráfica JT + diagnóstico */}
        {f1.tamb_min_c != null && f1.dew_agua_c != null && f1.dew_hc_c != null && (() => {
          const tSal    = calculo.t_salida_regulador_c
          const dewAgua = Number(f1.dew_agua_c)
          const dewHC   = Number(f1.dew_hc_c)
          const margenAgua = tSal - dewAgua
          const margenHC   = tSal - dewHC
          const riesgoHidrato = margenAgua <= 3
          const riesgoHC      = margenHC   <= 3
          const col = riesgoHidrato ? C.danger : riesgoHC ? C.warn : C.ok

          let diagnostico: string
          if (riesgoHidrato) {
            diagnostico =
              `T salida regulador ${tSal.toFixed(1)} °C — margen de solo ${margenAgua.toFixed(1)} °C sobre el punto de rocío de agua (${dewAgua} °C). ` +
              `Riesgo de formación de hidratos. Considerar precalentamiento aguas arriba del regulador o reducción de presión en etapas.`
          } else if (riesgoHC) {
            diagnostico =
              `T salida regulador ${tSal.toFixed(1)} °C — margen de ${margenAgua.toFixed(1)} °C sobre el rocío de agua (OK), ` +
              `pero solo ${margenHC.toFixed(1)} °C sobre el rocío de HC (${dewHC} °C). Riesgo de condensación de líquidos. ` +
              `Verificar separador aguas arriba del medidor.`
          } else {
            diagnostico =
              `T salida regulador ${tSal.toFixed(1)} °C — margen de ${margenAgua.toFixed(1)} °C sobre el punto de rocío de agua (${dewAgua} °C). ` +
              `Sin riesgo de hidratos en condiciones de diseño. No se requiere precalentamiento.`
          }

          return (
            <>
              <Text style={[s.secTitle, { marginTop: 4 }]}>Perfil de temperatura — efecto JT</Text>
              <View style={{ marginBottom: 4 }}>
                <JTChart tamb={Number(f1.tamb_min_c)} t_salida={tSal} dew_agua={dewAgua} dew_hc={dewHC} />
              </View>

              {/* Cómo leer la gráfica */}
              <View style={{ borderWidth: 1, borderColor: C.line, borderRadius: 3, padding: 7, marginBottom: 5, backgroundColor: C.panel }}>
                <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.ink3, letterSpacing: 1, marginBottom: 4 }}>
                  COMO LEER ESTA GRAFICA
                </Text>
                {[
                  { dot: C.accent,  texto: 'Punto azul (T operacion): temperatura del gas antes de la valvula reguladora de presion.' },
                  { dot: C.ok,      texto: 'Punto verde / rojo (T salida): temperatura real del gas despues de la reduccion de presion. El enfriamiento se debe al efecto Joule-Thomson.' },
                  { dot: C.danger,  texto: 'Linea roja (Rocio H2O): si el gas baja de esta temperatura, el agua disuelta forma hidratos — tapones solidos que bloquean tuberias e instrumentos.' },
                  { dot: C.warn,    texto: 'Linea ambar (Rocio HC): si el gas baja de esta temperatura, los hidrocarburos pesados condensan liquido, lo que contamina la medicion y puede danar el medidor.' },
                  { dot: C.warn,    texto: 'Flecha naranja: magnitud del enfriamiento JT. Cuanto mayor la caida de presion en el regulador, mayor el enfriamiento.' },
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 5, marginBottom: 2.5 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.dot, marginTop: 1, flexShrink: 0 }} />
                    <Text style={{ fontSize: 6.5, color: C.ink2, flex: 1, lineHeight: 1.5 }}>{item.texto}</Text>
                  </View>
                ))}
                <Text style={{ fontSize: 6, color: C.ink3, marginTop: 3, lineHeight: 1.4 }}>
                  Nota: estos calculos son estimaciones de ingenieria basica. Ante cualquier condicion de riesgo, consultar con un especialista antes de proceder con el diseno de detalle.
                </Text>
              </View>

              <View style={{
                borderLeftWidth: 3, borderColor: col,
                backgroundColor: riesgoHidrato ? 'rgba(184,64,48,0.06)' : riesgoHC ? 'rgba(193,127,36,0.06)' : 'rgba(45,140,78,0.06)',
                borderRadius: 2, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 4,
              }}>
                <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: col, marginBottom: 2 }}>
                  Diagnóstico JT
                </Text>
                <Text style={{ fontSize: 7, color: C.ink2, lineHeight: 1.5 }}>{diagnostico}</Text>
              </View>
            </>
          )
        })()}

        {/* Alertas */}
        {calculo.alertas.length > 0 && (
          <>
            <Text style={s.secTitle}>Alertas de diseño</Text>
            {calculo.alertas.map((a, i) => (
              <AlertBox key={i} nivel={a.nivel} texto={a.texto} />
            ))}
          </>
        )}

        <Footer />
      </Page>

      {/* ─── Página 3: Tecnología + Normas + Conclusiones ─── */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View><Text style={s.logoTxt}>PEREGRIN</Text><Text style={s.logoSub}>MEMORIA DE CALCULO</Text></View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}><Text style={s.badge}>{proyecto.nombre}</Text></View>
        </View>
        <View style={s.divider} />

        {/* 5. AGA 7 — Conversión a condiciones base */}
        {aga7 && (
          <>
            <Text style={s.secNum}>5.</Text>
            <Text style={s.secTitle}>Cálculo de caudal en condiciones base — AGA 7</Text>
            <Text style={s.body}>
              El medidor volumétrico (turbina, ultrasónico u orificio) registra el caudal Qt en
              condiciones de operación — alta presión y temperatura real del sitio. Los contratos
              de gas se facturan en condiciones base (101.325 kPa y 15.6 °C), donde un m³ tiene
              menor densidad. La corrección se realiza con la ecuación AGA Report No. 7 (2006):
            </Text>
            <Text style={[s.body, { fontFamily: 'Helvetica-Bold', color: C.accent, marginLeft: 10 }]}>
              Qb = Qt × (Pf/Pb) × (Tb/Tf) × (Zb/Zf)
            </Text>
            <Text style={[s.body, { marginBottom: 5 }]}>
              El factor Z en condiciones de flujo (Zf) proviene de AGA 8 DETAIL (pyaga8); el Z en
              condiciones base (Zb) se calcula a baja presión donde el gas es casi ideal. La relación
              Zb/Zf completa la corrección de no-idealidad del gas real.
            </Text>
            <View style={s.tbl}>
              <Row2 l1="Presión de flujo (Pf)" v1={`${aga7.Pf_kpa} kPa abs`}
                    l2="Presión base (Pb)"     v2={`${aga7.Pb_kpa} kPa`} />
              <Row2 l1="Temp. de flujo (Tf)"   v1={`${aga7.Tf_k} K (${(aga7.Tf_k - 273.15).toFixed(1)} °C)`}
                    l2="Temp. base (Tb)"        v2={`${aga7.Tb_k} K (${(aga7.Tb_k - 273.15).toFixed(1)} °C)`} />
              <Row2 l1="Z flujo (Zf)"           v1={aga7.Zf.toFixed(5)}
                    l2="Z base (Zb)"            v2={aga7.Zb.toFixed(5)} />
              <Row2 l1="Factor Fpv"             v1={aga7.Fpv.toFixed(4)}
                    l2="Fpv²"                   v2={(aga7.Fpv * aga7.Fpv).toFixed(4)} last />
            </View>
            <View style={[s.aga8Box, { marginBottom: 6 }]}>
              <Text style={s.aga8Tag}>Caudales corregidos a condiciones base</Text>
              <View style={s.tbl}>
                <Row2 l1="Qb mínimo"  v1={`${aga7.qb_min.toLocaleString('es-MX')} m³/h`}
                      l2="Qt mínimo"  v2={`${Number(f1.qmin).toLocaleString('es-MX')} m³/h`} />
                <Row2 l1="Qb normal"  v1={`${aga7.qb_norm.toLocaleString('es-MX')} m³/h`}
                      l2="Qt normal"  v2={`${Number(f1.qnorm).toLocaleString('es-MX')} m³/h`} />
                <Row2 l1="Qb máximo"  v1={`${aga7.qb_max.toLocaleString('es-MX')} m³/h`}
                      l2="Qt máximo"  v2={`${Number(f1.qmax).toLocaleString('es-MX')} m³/h`} last />
              </View>
              <Text style={[s.body, { marginTop: 3, marginBottom: 0 }]}>
                {`Qb/Qt = ${(aga7.qb_norm / Number(f1.qnorm)).toFixed(4)} — por cada m³ medido en condiciones de operación, `}
                {`se facturan ${(aga7.qb_norm / Number(f1.qnorm)).toFixed(4)} m³ en condiciones base.`}
              </Text>
            </View>
            <Text style={[s.body, { fontSize: 7, color: C.ink3 }]}>
              Zf calculado con {aga8 ? 'AGA 8 DETAIL (pyaga8)' : 'correlación de Papay (screening)'}. Zb calculado con Papay a condiciones base (101 kPa, 15.6 °C). Para cómputo fiscal se requiere AGA 8 DETAIL en ambas condiciones.
            </Text>
          </>
        )}

        {/* AGA 3 — sólo para placa de orificio */}
        {aga3 && (
          <>
            <Text style={s.secNum}>{aga7 ? '6.' : '5.'}</Text>
            <Text style={s.secTitle}>Dimensionamiento de placa de orificio — AGA 3 / ISO 5167</Text>
            <Text style={s.body}>
              La placa de orificio es un elemento de restricción que genera una presión diferencial ΔP proporcional al cuadrado del caudal.
              El diámetro del orificio (d) se selecciona para que a caudal máximo la presión diferencial sea igual al rango del transmisor elegido.
              La relación β = d/D debe estar entre 0.20 y 0.75 para que sea válida la ecuación de descarga Reader-Harris/Gallagher (AGA 3 Part 1, §2.4).
            </Text>
            <View style={s.tbl}>
              <View style={[s.tRow, s.tHdr]}>
                <Text style={[s.tLbl, { fontFamily: 'Helvetica-Bold', color: C.ink }]}>Parámetro</Text>
                <Text style={[s.tVal, { fontFamily: 'Helvetica-Bold', color: C.ink }]}>Valor</Text>
                <Text style={[s.tLbl2, { fontFamily: 'Helvetica-Bold', color: C.ink }]}>Parámetro</Text>
                <Text style={[s.tVal2, { fontFamily: 'Helvetica-Bold', color: C.ink }]}>Valor</Text>
              </View>
              <Row2 l1="Diám. tubería (D)" v1={`${aga3.D_mm} mm (${f1.diametro_pulg}")`}
                    l2="Diám. orificio (d)" v2={`${aga3.d_mm} mm`} />
              <Row2 l1="Relación β = d/D"  v1={aga3.beta.toFixed(4)}
                    l2="Coef. descarga Cd" v2={aga3.Cd.toFixed(4)} />
              <Row2 l1="Factor Ev"          v1={aga3.Ev.toFixed(4)}
                    l2="Tipo de toma"       v2={aga3.toma} />
              <Row2 l1="Densidad flujo"     v1={`${aga3.rho_kgm3} kg/m³`}
                    l2="Re tubería (Qmax)"  v2={aga3.Re_D_max.toLocaleString('es-MX')} last />
            </View>
            <View style={[s.aga8Box, { marginBottom: 6 }]}>
              <Text style={s.aga8Tag}>Presión diferencial por punto de operación</Text>
              <Text style={[s.body, { marginBottom: 4, marginTop: 2 }]}>
                ΔP objetivo a Qmax: {aga3.dp_objetivo_mbar} mbar (rango del transmisor diferencial)
              </Text>
              <View style={s.tbl}>
                <Row2 l1="ΔP a Qmáx"  v1={`${aga3.dp_max_mbar} mbar`}
                      l2="Qmáx"       v2={`${Number(f1.qmax).toLocaleString('es-MX')} m³/h (base)`} />
                <Row2 l1="ΔP a Qnorm" v1={`${aga3.dp_norm_mbar} mbar`}
                      l2="Qnorm"      v2={`${Number(f1.qnorm).toLocaleString('es-MX')} m³/h (base)`} />
                <Row2 l1="ΔP a Qmín"  v1={`${aga3.dp_min_mbar} mbar`}
                      l2="Qmín"       v2={`${Number(f1.qmin).toLocaleString('es-MX')} m³/h (base)`} last />
              </View>
            </View>
            {aga3.alerta && (
              <View style={[s.alertBox, { backgroundColor: 'rgba(193,127,36,0.08)', borderWidth: 1, borderColor: 'rgba(193,127,36,0.3)' }]}>
                <Text style={[s.alertTxt, { color: C.warn }]}>⚠ {aga3.alerta}</Text>
              </View>
            )}
            <Text style={[s.body, { fontSize: 7, color: C.ink3, marginBottom: 4 }]}>
              Diámetro interno (D) tomado de tabla ASME B36.10M {aga3.schedule === 'sch40' ? 'Sch 40 / STD' : aga3.schedule === 'sch80' ? 'Sch 80 / XH' : aga3.schedule === 'sch160' ? 'Sch 160' : 'XXH'}. Si el proyecto usa otro schedule o material, el β real diferirá.
              Para custodia fiscal, el cálculo debe realizarse con el ID medido en campo y la ecuación completa AGA 3 Part 2 + AGA 8 DETAIL.
            </Text>
          </>
        )}

        {/* Tecnología */}
        <Text style={s.secNum}>{[aga7, aga3].filter(Boolean).length === 2 ? '7.' : [aga7, aga3].some(Boolean) ? '6.' : '5.'}</Text>
        <Text style={s.secTitle}>Selección de tecnología de medición</Text>
        <View style={s.techBox}>
          <Text style={s.techNom}>{f1.tecnologia_nombre ?? 'Por definir'}</Text>
          {f1.tecnologia_referencia && (
            <Text style={[s.body, { marginBottom: 2 }]}>Norma de referencia: {f1.tecnologia_referencia}</Text>
          )}
          {f1.tecnologia_motivo && (
            <Text style={s.body}>{f1.tecnologia_motivo}</Text>
          )}
        </View>

        <Text style={s.secTitle}>Criterios aplicados en la selección</Text>
        <View style={s.tbl}>
          <Row2 l1="Rango de medición calculado" v1={`${turndown} : 1`}
                l2="Custodia fiscal" v2={f1.fiscal ? 'Sí' : 'No'} />
          <Row2 l1="Fluido" v1={f1.fluido === 'gn' ? 'Gas natural' : 'GLP / mezcla'}
                l2="Diámetro nominal" v2={`${f1.diametro_pulg}" (DN${dnMm})`} />
          <Row2 l1="Qmín / Qmáx" v1={`${Number(f1.qmin).toLocaleString()} / ${Number(f1.qmax).toLocaleString()} m³/h`}
                l2="Presión operación" v2={`${f1.presion_kgcm2} kg/cm²`} last />
        </View>

        <Text style={[s.body, { marginBottom: 6 }]}>
          El motor de reglas aplica la siguiente lógica de prioridad:{'\n'}
          GLP → Coriolis (masa directa)  |  Fiscal + TD &gt; 30:1 → Ultrasónico  |
          Fiscal + TD ≤ 5:1 → Orificio  |  TD 10–30:1 → Turbina  |
          No fiscal + TD &gt; 20:1 → Diafragma  |  Default → Ultrasónico.
        </Text>

        {/* Normas */}
        <Text style={[s.secNum, { marginTop: 4 }]}>{
          [aga7, aga3].filter(Boolean).length === 2 ? '8.' :
          [aga7, aga3].some(Boolean) ? '7.' : '6.'
        }</Text>
        <Text style={s.secTitle}>Marco normativo aplicable</Text>
        {normas.map((n, i) => (
          <View key={i} style={s.normRow}>
            <Text style={s.normKey}>{n.clave}</Text>
            <Text style={s.normDesc}>{n.desc}</Text>
          </View>
        ))}

        {/* Conclusiones */}
        <Text style={[s.secNum, { marginTop: 6 }]}>{
          [aga7, aga3].filter(Boolean).length === 2 ? '9.' :
          [aga7, aga3].some(Boolean) ? '8.' : '7.'
        }</Text>
        <Text style={s.secTitle}>Conclusiones y próximos pasos</Text>
        <Text style={s.body}>
          Con base en los datos de proceso ingresados, se determina que la tecnología de medición
          <Text style={s.bold}> {f1.tecnologia_nombre ?? 'seleccionada'}</Text> es la más adecuada para las
          condiciones del punto <Text style={s.bold}>{proyecto.nombre}</Text>.
        </Text>
        <Text style={s.body}>
          El factor Z {aga8 ? 'obtenido mediante AGA 8 DETAIL' : 'estimado mediante correlación Papay'} es
          <Text style={s.bold}> Z = {Z_usado.toFixed(4)}</Text>.
          {!aga8 ? ' Este valor debe verificarse con AGA 8 DETAIL antes de la emisión final del documento.' : ''}
        </Text>
        <Text style={s.body}>
          Próximos pasos recomendados:{'\n'}
          • Completar datos de sitio (Fase 2): tramos rectos, clasificación de área, condiciones civiles{'\n'}
          • Obtener cotizaciones de fabricantes para el instrumento seleccionado{'\n'}
          • Llenar hojas de datos ISA/IEC por instrumento (FE-100, PT-101, TT-101, FQI-100){'\n'}
          • Emitir plano P&ID para revisión de ingeniería (Rev. A){'\n'}
          {f1.fiscal ? '• Tramitar autorización ante ASEA / verificación de UV\n' : ''}
          • Firmar y sellar esta memoria por ingeniero responsable con cédula profesional
        </Text>

        {/* Aviso legal */}
        <View style={{ marginTop: 10, borderTopWidth: 1, borderColor: C.line, paddingTop: 6 }}>
          <Text style={{ fontSize: 6, color: C.ink3, lineHeight: 1.4 }}>
            AVISO LEGAL: Documento borrador generado automáticamente por PEREGRIN. No sustituye la ingeniería de detalle.
            Requiere revisión y firma de ingeniero con cédula profesional. No emite dictamen de Unidad de Verificación
            ni valida interconexión ante CENAGAS/SISTRANGAS. Rev. 0 / {fecha}
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
