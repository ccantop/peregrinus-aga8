import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcularCondicionesFisicas, calcularAGA7, calcularAGA3 } from '@/lib/engine/calculo-z'
import type { ScheduleTuberia } from '@/lib/engine/calculo-z'
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, TableOfContents, Header, Footer,
  PageNumberElement, PageBreak, convertInchesToTwip, ImageRun,
} from 'docx'
import fs from 'fs'
import path from 'path'

const ACCENT = '4a9ebb'
const INK    = '1b3044'
const INK2   = '3a5a72'
const INK3   = '8aaabb'
const LINE   = 'd0e0e8'
const PANEL  = 'f7fbfd'

const BORDER = {
  top:    { style: BorderStyle.SINGLE, size: 1, color: LINE },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE },
  left:   { style: BorderStyle.SINGLE, size: 1, color: LINE },
  right:  { style: BorderStyle.SINGLE, size: 1, color: LINE },
}

function mkCell(text: string, bold = false, bg?: string, width?: number, color?: string): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: bg ? { type: ShadingType.CLEAR, color: 'auto', fill: bg } : undefined,
    borders: BORDER,
    children: [new Paragraph({ children: [new TextRun({ text, bold, color: color ?? (bold ? INK : INK3), size: 18 })] })],
  })
}

function dataRow(label: string, value: string | number | null | undefined): TableRow {
  const val = (value != null && value !== '') ? String(value) : '—'
  return new TableRow({ children: [mkCell(label, false, undefined, 3400), mkCell(val, true, undefined, 5600)] })
}

function h2(num: string, title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({ text: `${num}  `, color: ACCENT, bold: true, size: 22 }),
      new TextRun({ text: title, color: INK, bold: true, size: 22 }),
    ],
    spacing: { before: 300, after: 100 },
  })
}

function h1(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: title, color: INK, bold: true, size: 32 })],
    spacing: { before: 400, after: 120 },
  })
}

function body(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, color: INK2, size: 18 })],
    spacing: { after: 80 },
  })
}

const _aga8Raw = process.env.AGA8_SERVICE_URL
const AGA8_URL = _aga8Raw
  ? _aga8Raw.startsWith('http') ? _aga8Raw : `https://${_aga8Raw}`
  : undefined

const tipoLabel: Record<string, string> = {
  city_gate: 'City Gate (SISTRANGAS/CENAGAS)', industrial: 'Estacion industrial',
  ducto: 'Ducto regional', auditoria: 'Auditoria / diagnostico',
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = await createClient()
  const [{ data: proyecto }, { data: f1 }, { data: actsRaw }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('actividades').select('*').eq('proyecto_id', id).order('etapa').order('nombre'),
  ])

  if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  if (!f1)       return NextResponse.json({ error: 'Fase 1 no encontrada' }, { status: 404 })

  // AGA 8
  let aga8: { z: number; rho_kg_m3: number; metodo: string } | null = null
  if (AGA8_URL) {
    try {
      const res = await fetch(`${AGA8_URL}/aga8`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presion_kpa: Number(f1.presion_kgcm2) * 98.0665 + 101.325,
          temperatura_k: Number(f1.tamb_min_c ?? 20) + 273.15,
          sg: Number(f1.sg ?? 0.65), co2_pct: Number(f1.co2_pct ?? 2), n2_pct: Number(f1.n2_pct ?? 1),
        }),
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) aga8 = await res.json()
    } catch { /* Papay */ }
  }

  const vars = {
    sg: Number(f1.sg ?? 0.65), patm_kpa: Number(f1.presion_kgcm2) * 98.0665 + 101.325,
    tamb_min_c: Number(f1.tamb_min_c ?? 20), dp_regulador_bar: Number(f1.dp_regulador_bar ?? 5),
    dew_agua_c: Number(f1.dew_agua_c ?? -10), dew_hc_c: Number(f1.dew_hc_c ?? -20),
    co2_pct: Number(f1.co2_pct ?? 2), n2_pct: Number(f1.n2_pct ?? 1),
    viscosidad_cp: 0.012, toma_diferencial: 'brida' as const,
    elevacion_msnm: Number(f1.elevacion_msnm ?? 0),
    p_base_kpa: Number(f1.p_base_kpa ?? 101.325), t_base_c: Number(f1.t_base_c ?? 15.6),
  }
  const calculo = calcularCondicionesFisicas(vars)
  const Zf = aga8?.z ?? calculo.Z_papay
  const aga7 = calcularAGA7(
    Number(f1.qmin), Number(f1.qnorm), Number(f1.qmax),
    Number(f1.presion_kgcm2), Number(f1.tamb_min_c ?? 20),
    Number(f1.p_base_kpa ?? 101.325), Number(f1.t_base_c ?? 15.6), Zf,
  )
  const aga3 = (f1.tecnologia_key === 'orificio' || f1.tecnologia_key === 'diafragma')
    ? calcularAGA3(
        Number(f1.qmax), Number(f1.qnorm), Number(f1.qmin),
        Number(f1.presion_kgcm2), Number(f1.tamb_min_c ?? 20),
        Number(f1.sg ?? 0.65), Zf, Number(f1.diametro_pulg),
        (f1.toma_diferencial ?? 'brida') as 'brida' | 'esquina' | 'ddmedio',
        Number(f1.viscosidad_cp ?? 0.012),
        Number(f1.p_base_kpa ?? 101.325), Number(f1.t_base_c ?? 15.6),
        (f1.schedule_tuberia ?? 'sch40') as ScheduleTuberia,
      )
    : null

  const fecha = new Date(proyecto.creado_en).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  const turndown = (Number(f1.qmax) / Math.max(Number(f1.qmin), 0.01)).toFixed(1)
  const presionKPa = (Number(f1.presion_kgcm2) * 98.0665).toFixed(1)
  const dnMm = (Number(f1.diametro_pulg) * 25.4).toFixed(0)
  const Zeff = aga8?.z ?? calculo.Z_papay

  // Logo
  let logoImg: ImageRun | null = null
  try {
    const logoData = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'))
    logoImg = new ImageRun({ data: logoData, transformation: { width: 36, height: 36 }, type: 'png' })
  } catch { /* no logo */ }

  const headerContent = new Header({
    children: [new Paragraph({
      children: [
        ...(logoImg ? [logoImg] : []),
        new TextRun({ text: '  PEREGRIN  ', bold: true, color: ACCENT, size: 22, characterSpacing: 100 }),
        new TextRun({ text: 'Gas Engineering Experts', color: INK3, size: 16 }),
        new TextRun({ text: '   |   Informe Completo — Borrador Rev. 0', color: INK3, size: 16 }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE } },
      spacing: { after: 60 },
    })],
  })

  const footerContent = new Footer({
    children: [new Paragraph({
      children: [
        new TextRun({ text: 'PEREGRIN — Informe completo de ingenieria   |   Pag. ', color: INK3, size: 16 }),
        new PageNumberElement(),
      ],
      alignment: AlignmentType.RIGHT,
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: LINE } },
      spacing: { before: 60 },
    })],
  })

  const acts = actsRaw ?? []
  const ESTADO_LABEL: Record<string, string> = { tienes: 'Listo', falta: 'Falta', en_proceso: 'En proceso' }

  const normas: Array<[string, string]> = [
    ['NOM-020-ASEA-2024', 'Diseno, construccion, operacion y mantenimiento de sistemas de medicion de gas natural y gas LP.'],
    ['AGA 8 DETAIL', 'Factor Z por ecuacion de estado GERG-2008 simplificada.'],
    ['AGA 7 (2006)', 'Conversion de caudales a condiciones base.'],
    ...(aga3 ? [['AGA 3 / API 14.3 / ISO 5167', 'Medicion con placa de orificio o diafragma.']] as [string, string][] : []),
    ['ISA 5.1', 'Simbologia e identificacion de instrumentacion.'],
    ...(f1.fiscal ? [['RMF Anexo 21', 'Controles volumetricos para hidrocarburos (SAT).']] as [string, string][] : []),
  ]

  const doc = new Document({
    creator: 'Peregrin',
    title: `Informe completo — ${proyecto.nombre}`,
    sections: [{
      headers: { default: headerContent },
      footers: { default: footerContent },
      properties: {
        page: {
          size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
          margin: { top: convertInchesToTwip(1.1), bottom: convertInchesToTwip(1.0), left: convertInchesToTwip(0.9), right: convertInchesToTwip(0.9) },
        },
      },
      children: [
        // Portada
        new Paragraph({ children: [new TextRun({ text: 'Informe Completo de Ingenieria', bold: true, color: ACCENT, size: 48 })], heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: proyecto.nombre, bold: true, color: INK, size: 32 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: `${proyecto.cliente ? `${proyecto.cliente}  ·  ` : ''}${tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto}  ·  ${fecha}  ·  Rev. 0`, color: INK3, size: 18 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: `AGA 8 DETAIL / NOM-020-ASEA-2024${f1.fiscal ? '  ·  CUSTODIA FISCAL' : ''}`, color: INK2, size: 18 })], spacing: { after: 400 } }),
        new TableOfContents('Tabla de contenido', { hyperlink: true, headingStyleRange: '1-2' }),
        new Paragraph({ children: [], spacing: { after: 280 } }),

        // ══════════════════════════════════════════
        // PARTE 1 — REPORTE TÉCNICO
        // ══════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1('Parte 1 — Reporte Tecnico'),

        h2('1.1', 'Datos del punto de medicion'),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            dataRow('Tipo de punto',     tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto),
            dataRow('Fluido',            f1.fluido === 'gn' ? 'Gas natural' : 'GLP / mezcla'),
            dataRow('Custodia fiscal',   f1.fiscal ? 'Si' : 'No'),
            dataRow('Clase localizacion',f1.clase_localizacion === 'na' ? 'No aplica' : `Clase ${f1.clase_localizacion}`),
          ],
        }),

        h2('1.2', 'Condiciones de diseno y proceso'),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            dataRow('Caudal minimo Qmin (m3/h)', Number(f1.qmin).toLocaleString('es-MX')),
            dataRow('Caudal nominal Qnorm (m3/h)', Number(f1.qnorm).toLocaleString('es-MX')),
            dataRow('Caudal maximo Qmax (m3/h)', Number(f1.qmax).toLocaleString('es-MX')),
            dataRow('Rango de medicion (Qmax/Qmin)', `1 : ${turndown}`),
            dataRow('Presion de operacion (kg/cm2)', `${f1.presion_kgcm2}  →  ${presionKPa} kPa`),
            dataRow('Diametro nominal', `${f1.diametro_pulg}"  (DN${dnMm} mm)`),
            ...(f1.sg != null ? [dataRow('Gravedad especifica (SG)', f1.sg)] : []),
            ...(f1.co2_pct != null ? [dataRow('CO2 (% mol)', `${f1.co2_pct} %`)] : []),
            ...(f1.n2_pct != null  ? [dataRow('N2 (% mol)',  `${f1.n2_pct} %`)]  : []),
          ],
        }),

        h2('1.3', 'Tecnologia de medicion recomendada'),
        new Paragraph({ children: [new TextRun({ text: f1.tecnologia_nombre ?? 'Por definir', bold: true, color: ACCENT, size: 26 })], spacing: { after: 60 } }),
        ...(f1.tecnologia_referencia ? [body(`Norma de referencia: ${f1.tecnologia_referencia}`)] : []),
        ...(f1.tecnologia_motivo     ? [body(f1.tecnologia_motivo)] : []),

        h2('1.4', 'Marco normativo aplicable'),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: normas.map(([clave, desc]) => new TableRow({
            children: [mkCell(clave, true, undefined, 2800, ACCENT), mkCell(desc, false, undefined, 6200)],
          })),
        }),

        ...(acts.length > 0 ? [
          h2('1.5', 'Actividades y huecos del proyecto'),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ['ESTADO', 'ACTIVIDAD', 'ACCION SUGERIDA'].map(h =>
                  new TableCell({ shading: { type: ShadingType.CLEAR, color: 'auto', fill: PANEL }, borders: BORDER, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: INK3, size: 16 })] })] })
                ),
              }),
              ...acts.map(a => new TableRow({
                children: [
                  new TableCell({ width: { size: 1400, type: WidthType.DXA }, borders: BORDER, children: [new Paragraph({ children: [new TextRun({ text: ESTADO_LABEL[a.estado] ?? a.estado, bold: true, size: 16, color: a.estado === 'tienes' ? '2d8c4e' : a.estado === 'falta' ? 'b84030' : 'c17f24' })] })] }),
                  new TableCell({ borders: BORDER, children: [new Paragraph({ children: [new TextRun({ text: a.nombre, size: 16, color: INK })] })] }),
                  new TableCell({ borders: BORDER, children: [new Paragraph({ children: [new TextRun({ text: a.accion_sugerida || '—', size: 16, color: INK3 })] })] }),
                ],
              })),
            ],
          }),
        ] : []),

        // ══════════════════════════════════════════
        // PARTE 2 — MEMORIA DE CÁLCULO
        // ══════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1('Parte 2 — Memoria de Calculo'),

        h2('2.1', 'Datos de entrada'),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            dataRow('Elevacion (msnm)',      f1.elevacion_msnm ?? 0),
            dataRow('Presion base Pb (kPa)', f1.p_base_kpa ?? 101.325),
            dataRow('Temperatura base Tb (°C)', f1.t_base_c ?? 15.6),
            dataRow('Schedule tuberia',      f1.schedule_tuberia?.toUpperCase() ?? 'Sch 40'),
            dataRow('T min ambiente (°C)',   f1.tamb_min_c ?? 20),
            dataRow('dP regulador (bar)',    f1.dp_regulador_bar ?? 5),
            dataRow('Punto de rocio H2O (°C)', f1.dew_agua_c ?? -10),
            dataRow('Punto de rocio HC (°C)',  f1.dew_hc_c ?? -20),
          ],
        }),

        h2('2.2', 'Factor de compresibilidad Z — AGA 8 DETAIL'),
        body(`Metodo utilizado: ${aga8 ? 'AGA 8 DETAIL (servicio Python)' : 'Papay (correlacion empirica — fallback)'}`),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: aga8 ? [
            dataRow('Z (AGA 8 DETAIL)', aga8.z.toFixed(5)),
            dataRow('Densidad ρ (kg/m3)', aga8.rho_kg_m3?.toFixed(4)),
            dataRow('Z efectivo utilizado', Zeff.toFixed(5)),
          ] : [
            dataRow('Tr (temperatura reducida)', calculo.Tr.toFixed(4)),
            dataRow('Pr (presion reducida)', calculo.Pr.toFixed(4)),
            dataRow('Z (Papay)', calculo.Z_papay.toFixed(5)),
          ],
        }),

        h2('2.3', 'Efecto Joule-Thomson'),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            dataRow('Caida de temperatura JT (°C)', calculo.caida_jt_c.toFixed(2)),
            dataRow('T entrada regulador (°C)', f1.tamb_min_c ?? 20),
            dataRow('T salida regulador (°C)', calculo.t_salida_regulador_c.toFixed(2)),
          ],
        }),

        ...(aga7 ? [
          h2('2.4', 'Conversion a condiciones base — AGA 7'),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              dataRow('Pf (kPa)', aga7.Pf_kpa.toFixed(3)),
              dataRow('Tf (K)', aga7.Tf_k.toFixed(2)),
              dataRow('Zf', aga7.Zf.toFixed(5)),
              dataRow('Pb (kPa)', aga7.Pb_kpa.toFixed(3)),
              dataRow('Tb (K)', aga7.Tb_k.toFixed(2)),
              dataRow('Zb', aga7.Zb.toFixed(5)),
              dataRow('Fpv (supercompresibilidad)', aga7.Fpv.toFixed(5)),
              dataRow('Qmin base (m3/h)', aga7.qb_min.toFixed(2)),
              dataRow('Qnorm base (m3/h)', aga7.qb_norm.toFixed(2)),
              dataRow('Qmax base (m3/h)', aga7.qb_max.toFixed(2)),
            ],
          }),
        ] : []),

        ...(aga3 ? [
          h2('2.5', `AGA 3 / ISO 5167 — ${f1.tecnologia_key === 'diafragma' ? 'Diafragma' : 'Placa de orificio'}`),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              dataRow('Diametro tuberia D (mm)', aga3.D_mm.toFixed(2)),
              dataRow('Diametro orificio d (mm)', aga3.d_mm.toFixed(2)),
              dataRow('Beta (d/D)', aga3.beta.toFixed(5)),
              dataRow('Cd', aga3.Cd.toFixed(5)),
              dataRow('Ev', aga3.Ev.toFixed(5)),
              dataRow('dP max (mbar)', aga3.dp_max_mbar.toFixed(1)),
              dataRow('Re tuberia a Qmax', Math.round(aga3.Re_D_max).toLocaleString('es-MX')),
              dataRow('Beta valido', aga3.valido ? 'Si' : 'No — revisar diametro'),
            ],
          }),
        ] : []),

        // Aviso legal
        new Paragraph({ children: [], spacing: { before: 400 } }),
        new Paragraph({
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: PANEL },
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE }, left: { style: BorderStyle.SINGLE, size: 2, color: LINE }, right: { style: BorderStyle.SINGLE, size: 2, color: LINE } },
          children: [new TextRun({ text: 'AVISO LEGAL: Borrador de ingenieria generado automaticamente. Requiere revision y firma de ingeniero con cedula profesional. No sustituye la ingenieria de detalle.', color: INK3, size: 16, italics: true })],
          spacing: { before: 120, after: 120 },
        }),
      ],
    }],
  })

  const buf = await Packer.toBuffer(doc)
  const nombre = proyecto.nombre.replace(/[^a-zA-Z0-9_-]/g, '_')

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="informe-completo-${nombre}.docx"`,
    },
  })
}
