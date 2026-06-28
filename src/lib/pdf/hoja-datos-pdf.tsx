import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { TIPO_LABEL } from '@/lib/instrumentos'

const C = {
  accent: '#4a9ebb', ink: '#1b3044', ink2: '#3a5a72', ink3: '#8aaabb',
  line: '#d0e0e8', panel: '#f7fbfd', white: '#ffffff', warn: '#c17f24',
}

const s = StyleSheet.create({
  page:     { fontFamily: 'Helvetica', fontSize: 8, color: C.ink, padding: '12mm 14mm 10mm 14mm', backgroundColor: C.white },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  logoTxt:  { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 3 },
  logoSub:  { fontSize: 6.5, color: C.ink3, marginTop: 1 },
  headerR:  { flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  badge:    { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.accent, borderWidth: 1, borderColor: C.accent, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },
  warn:     { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.warn, borderWidth: 1, borderColor: C.warn, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },
  divider:  { height: 1, backgroundColor: C.line, marginVertical: 5 },

  // tag hero
  tagHero:  { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 8 },
  tagNum:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.accent },
  tagTipo:  { fontSize: 10, color: C.ink2 },

  // sección
  secWrap:  { marginBottom: 7 },
  secTitle: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.ink3, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 },
  secBox:   { borderWidth: 1, borderColor: C.line, borderRadius: 3 },

  // filas de la tabla de datos
  row:      { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.line },
  rowLast:  { flexDirection: 'row' },
  lbl:      { width: '35%', paddingHorizontal: 6, paddingVertical: 3.5, color: C.ink3, backgroundColor: C.panel },
  val:      { flex: 1, paddingHorizontal: 6, paddingVertical: 3.5, fontFamily: 'Helvetica-Bold' },
  lbl2:     { width: '35%', paddingHorizontal: 6, paddingVertical: 3.5, color: C.ink3, backgroundColor: C.panel, borderLeftWidth: 1, borderColor: C.line },
  val2:     { flex: 1, paddingHorizontal: 6, paddingVertical: 3.5, fontFamily: 'Helvetica-Bold' },

  footer:   { position: 'absolute', bottom: 10, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', fontSize: 6.5, color: C.ink3 },

  // firma
  firmaRow: { flexDirection: 'row', marginTop: 20, gap: 0 },
  firmaBox: { flex: 1, borderTopWidth: 1, borderColor: C.line, paddingTop: 4, alignItems: 'center' },
  firmaTxt: { fontSize: 6.5, color: C.ink3 },
})

function Row({ label, value, last }: { label: string; value?: string | number | null; last?: boolean }) {
  return (
    <View style={last ? s.rowLast : s.row}>
      <Text style={s.lbl}>{label}</Text>
      <Text style={s.val}>{value != null && value !== '' ? String(value) : '—'}</Text>
    </View>
  )
}

function Row2({
  l1, v1, l2, v2, last,
}: { l1: string; v1?: string | number | null; l2: string; v2?: string | number | null; last?: boolean }) {
  return (
    <View style={last ? s.rowLast : s.row}>
      <Text style={s.lbl}>{l1}</Text>
      <Text style={s.val}>{v1 != null && v1 !== '' ? String(v1) : '—'}</Text>
      <Text style={s.lbl2}>{l2}</Text>
      <Text style={s.val2}>{v2 != null && v2 !== '' ? String(v2) : '—'}</Text>
    </View>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.secWrap}>
      <Text style={s.secTitle}>{title}</Text>
      <View style={s.secBox}>{children}</View>
    </View>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HojaDatosPDF({ proyecto, f1, hoja }: { proyecto: any; f1: any; hoja: any }) {
  const fecha = new Date(hoja.actualizado_en ?? hoja.creado_en).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  const rango = hoja.rango_min != null && hoja.rango_max != null
    ? `${hoja.rango_min} – ${hoja.rango_max} ${hoja.unidad_rango ?? ''}`
    : hoja.unidad_rango ?? '—'

  return (
    <Document title={`Hoja de datos ${hoja.tag} — ${proyecto.nombre}`} author="Peregrin">
      <Page size="A4" style={s.page}>

        {/* Encabezado */}
        <View style={s.header}>
          <View>
            <Image src={`${process.cwd()}/public/logo.png`} style={{ width: 22, height: 22, marginBottom: 2 }} />
            <Text style={s.logoTxt}>PEREGRIN</Text>
            <Text style={s.logoSub}>GAS ENGINEERING EXPERTS</Text>
          </View>
          <View style={s.headerR}>
            <Text style={s.badge}>HOJA DE DATOS ISA/IEC</Text>
            {hoja.estado === 'aprobado'
              ? <Text style={s.badge}>APROBADO</Text>
              : <Text style={s.warn}>{hoja.estado?.toUpperCase() ?? 'BORRADOR'}</Text>
            }
          </View>
        </View>
        <View style={s.divider} />

        {/* Aviso datos incompletos */}
        {hoja.incompleto && (
          <View style={{ backgroundColor: 'rgba(193,127,36,0.10)', borderWidth: 1, borderColor: C.warn, borderRadius: 3, padding: 6, marginBottom: 7 }}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.warn }}>
              DATOS INCOMPLETOS — Esta hoja no ha sido llenada aún. Los campos en blanco deben completarse antes de aprobar el documento.
            </Text>
          </View>
        )}

        {/* Tag hero */}
        <View style={s.tagHero}>
          <Text style={s.tagNum}>{hoja.tag}</Text>
          <Text style={s.tagTipo}>{TIPO_LABEL[hoja.tipo_inst] ?? hoja.tipo_inst}</Text>
        </View>

        {/* Identificación */}
        <Sec title="Identificacion">
          <Row2 l1="Proyecto"     v1={proyecto.nombre}      l2="Cliente"       v2={proyecto.cliente} />
          <Row2 l1="Servicio"     v1={hoja.servicio}        l2="Linea / equipo" v2={hoja.linea_equipo} />
          <Row2 l1="No. de plano" v1="PER-PID-001"          l2="Revision"       v2={hoja.revision} last />
        </Sec>

        {/* Datos de proceso */}
        <Sec title="Datos de proceso">
          <Row2 l1="Fluido"              v1={hoja.fluido}           l2="Custodia fiscal"   v2={f1?.fiscal ? 'Si' : 'No'} />
          <Row2 l1="Presion operacion"   v1={hoja.presion_op_kgcm2 != null ? `${hoja.presion_op_kgcm2} kg/cm2` : null}
                l2="Presion diseno"      v2={hoja.presion_dis_kgcm2 != null ? `${hoja.presion_dis_kgcm2} kg/cm2` : null} />
          <Row2 l1="Temperatura oper."   v1={hoja.temp_op_c != null ? `${hoja.temp_op_c} C` : null}
                l2="Temperatura diseno"  v2={hoja.temp_dis_c != null ? `${hoja.temp_dis_c} C` : null} />
          <Row2 l1="Caudal min"          v1={hoja.caudal_min != null ? `${hoja.caudal_min} m3/h` : null}
                l2="Caudal max"          v2={hoja.caudal_max != null ? `${hoja.caudal_max} m3/h` : null} />
          <Row2 l1="Densidad"            v1={hoja.densidad_kgm3 != null ? `${hoja.densidad_kgm3} kg/m3` : null}
                l2="Viscosidad"          v2={hoja.viscosidad_cp != null ? `${hoja.viscosidad_cp} cP` : null} last />
        </Sec>

        {/* Especificación */}
        <Sec title="Especificacion del instrumento">
          <Row2 l1="Fabricante esp."   v1={hoja.fabricante_esp}   l2="Fabricante real"  v2={hoja.fabricante_real} />
          <Row2 l1="Modelo"            v1={hoja.modelo}           l2="No. serie"         v2={hoja.numero_serie} />
          <Row  label="Rango"          value={rango} />
          <Row2 l1="Exactitud"         v1={hoja.exactitud_pct != null ? `± ${hoja.exactitud_pct} %` : null}
                l2="Senal de salida"   v2={hoja.senal_salida} />
          <Row2 l1="Protocolo"         v1={hoja.protocolo_com}    l2="Alimentacion"      v2={hoja.fuente_alimentacion} last />
        </Sec>

        {/* Conexión y materiales */}
        <Sec title="Conexion de proceso y materiales">
          <Row2 l1="Tipo conexion"      v1={hoja.conexion_proceso}  l2="Tamano"           v2={hoja.tamano_conexion} />
          <Row2 l1="Rating / clase"     v1={hoja.rating_conexion}   l2="Material cuerpo"  v2={hoja.material_cuerpo} />
          <Row  label="Mat. p. mojadas" value={hoja.material_partes_mojadas} last />
        </Sec>

        {/* Eléctrico */}
        <Sec title="Electrico e instalacion">
          <Row2 l1="Clasificacion area"  v1={hoja.clasificacion_area}  l2="Cert. Ex"        v2={hoja.certificacion_ex} />
          <Row2 l1="Grado proteccion"    v1={hoja.grado_proteccion}    l2="Montaje"          v2={hoja.montaje} last />
        </Sec>

        {/* Firmas */}
        <View style={s.firmaRow}>
          {['ELABORO', 'REVISO', 'AUTORIZO'].map(rol => (
            <View key={rol} style={s.firmaBox}>
              <Text style={s.firmaTxt}>{rol}</Text>
              <Text style={[s.firmaTxt, { marginTop: 12 }]}>Nombre / Cedula</Text>
              <Text style={[s.firmaTxt, { marginTop: 2 }]}>{fecha}</Text>
            </View>
          ))}
        </View>

        {/* Nota legal */}
        <Text style={{ fontSize: 6, color: C.ink3, marginTop: 10, lineHeight: 1.4 }}>
          BORRADOR — No valido para construccion. Requiere firma de ingeniero responsable con cedula profesional.
          PEREGRIN no emite dictamen de UV ni certifica trazabilidad metrologica. Rev. {hoja.revision ?? '0'} / {fecha}
        </Text>

        <View style={s.footer} fixed>
          <Text>PEREGRIN — Hoja de datos {hoja.tag}  |  {proyecto.nombre}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
