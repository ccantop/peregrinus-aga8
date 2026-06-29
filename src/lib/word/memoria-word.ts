import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, TableOfContents, Header, Footer,
  PageNumberElement, convertInchesToTwip, ImageRun,
} from 'docx'
import fs from 'fs'
import path from 'path'
import type { ResultadoAGA7, ResultadoAGA3 } from '@/lib/engine/calculo-z'

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
    children: [new Paragraph({
      children: [new TextRun({ text, bold, color: color ?? (bold ? INK : INK3), size: 18 })],
    })],
  })
}

function dataRow(label: string, value: string | number | null | undefined): TableRow {
  const val = (value != null && value !== '') ? String(value) : '—'
  return new TableRow({
    children: [
      mkCell(label, false, undefined, 3400),
      mkCell(val,   true,  undefined, 5600),
    ],
  })
}

function sec(num: string, title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({ text: `${num}  `, color: ACCENT, bold: true, size: 22 }),
      new TextRun({ text: title, color: INK, bold: true, size: 22 }),
    ],
    spacing: { before: 300, after: 100 },
  })
}

function body(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, color: INK2, size: 18 })],
    spacing: { after: 80 },
  })
}

export interface MemoriaWordData {
  proyecto: { id: string; nombre: string; cliente: string | null; tipo_punto: string; creado_en: string }
  f1: {
    fiscal: boolean; fluido: string
    qmin: number; qnorm: number; qmax: number
    presion_kgcm2: number; diametro_pulg: number
    tamb_min_c?: number | null; tamb_max_c?: number | null
    sg?: number | null; co2_pct?: number | null; n2_pct?: number | null
    elevacion_msnm?: number | null; p_base_kpa?: number | null; t_base_c?: number | null
    dp_regulador_bar?: number | null; dew_agua_c?: number | null; dew_hc_c?: number | null
    tecnologia_nombre?: string | null; tecnologia_referencia?: string | null
    toma_diferencial?: string | null; viscosidad_cp?: number | null
    schedule_tuberia?: string | null
    tecnologia_key?: string | null
  }
  aga8: { z: number; rho_kg_m3: number; metodo: string } | null
  aga7: ResultadoAGA7 | null
  aga3: ResultadoAGA3 | null
  calculo: {
    Z_papay: number; Tr: number; Pr: number
    caida_jt_c: number; t_salida_regulador_c: number
    alertas: Array<{ nivel: string; texto: string }>
  }
}

export async function generarMemoriaWord(d: MemoriaWordData): Promise<Buffer> {
  const { proyecto, f1, aga8, aga7, aga3, calculo } = d
  const fecha = new Date(proyecto.creado_en).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const turndown = (Number(f1.qmax) / Math.max(Number(f1.qmin), 0.01)).toFixed(1)
  const presionKPa = (Number(f1.presion_kgcm2) * 98.0665).toFixed(1)
  const dnMm = (Number(f1.diametro_pulg) * 25.4).toFixed(0)
  const Zeff = aga8?.z ?? calculo.Z_papay
  const tipoLabel: Record<string, string> = {
    city_gate: 'City Gate (SISTRANGAS/CENAGAS)', industrial: 'Estacion industrial',
    ducto: 'Ducto regional', auditoria: 'Auditoria / diagnostico',
  }

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
        new TextRun({ text: '   |   Memoria de Calculo — Borrador Rev. 0', color: INK3, size: 16 }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE } },
      spacing: { after: 60 },
    })],
  })

  const footerContent = new Footer({
    children: [new Paragraph({
      children: [
        new TextRun({ text: 'PEREGRIN — Memoria de Calculo   |   Pag. ', color: INK3, size: 16 }),
        new PageNumberElement(),
      ],
      alignment: AlignmentType.RIGHT,
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: LINE } },
      spacing: { before: 60 },
    })],
  })

  const children: (Paragraph | Table)[] = [
    // Portada
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Memoria de Calculo', color: INK, bold: true, size: 40 })],
      spacing: { before: 200, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: proyecto.nombre, bold: true, color: ACCENT, size: 28 })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `${proyecto.cliente ? `${proyecto.cliente}  ·  ` : ''}${tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto}  ·  ${fecha}  ·  Rev. 0`,
        color: INK3, size: 18,
      })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Metodologia: AGA 8 DETAIL / NOM-020-ASEA-2024${f1.fiscal ? '  ·  CUSTODIA FISCAL' : ''}`,
        color: INK2, size: 18,
      })],
      spacing: { after: 240 },
    }),

    // TOC
    new TableOfContents('Tabla de contenido', {
      hyperlink: true,
      headingStyleRange: '1-2',
    }),
    new Paragraph({ children: [], spacing: { after: 280 } }),

    // 1. Datos de entrada
    sec('1.', 'Datos de entrada'),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: [
        dataRow('Proyecto',             proyecto.nombre),
        dataRow('Cliente',              proyecto.cliente ?? '—'),
        dataRow('Tipo de punto',        tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto),
        dataRow('Custodia fiscal',      f1.fiscal ? 'Si' : 'No'),
        dataRow('Fluido',               f1.fluido === 'gn' ? 'Gas natural' : 'GLP / mezcla'),
        dataRow('Elevacion (msnm)',     f1.elevacion_msnm ?? 0),
        dataRow('Presion base Pb (kPa)',f1.p_base_kpa ?? 101.325),
        dataRow('Temperatura base Tb (°C)', f1.t_base_c ?? 15.6),
      ],
    }),

    // 2. Condiciones de proceso
    sec('2.', 'Condiciones de proceso y caudales'),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: [
        dataRow('Caudal minimo Qmin (m3/h)', Number(f1.qmin).toLocaleString('es-MX')),
        dataRow('Caudal nominal Qnorm (m3/h)', Number(f1.qnorm).toLocaleString('es-MX')),
        dataRow('Caudal maximo Qmax (m3/h)', Number(f1.qmax).toLocaleString('es-MX')),
        dataRow('Rango de medicion (Qmax/Qmin)', `1 : ${turndown}`),
        dataRow('Presion de operacion (kg/cm2)', `${f1.presion_kgcm2}  →  ${presionKPa} kPa`),
        dataRow('Diametro nominal (pulg)', `${f1.diametro_pulg}"  (DN${dnMm} mm)`),
        dataRow('Schedule tuberia', f1.schedule_tuberia?.toUpperCase() ?? 'Sch 40'),
        dataRow('Temperatura min ambiente (°C)', f1.tamb_min_c ?? 20),
        dataRow('Temperatura max ambiente (°C)', f1.tamb_max_c ?? 40),
        dataRow('Gravedad especifica (SG)', f1.sg ?? 0.65),
        dataRow('CO2 (% mol)', f1.co2_pct ?? 2),
        dataRow('N2 (% mol)', f1.n2_pct ?? 1),
        dataRow('Viscosidad (cP)', f1.viscosidad_cp ?? 0.012),
        dataRow('dP regulador (bar)', f1.dp_regulador_bar ?? 5),
        dataRow('Punto de rocio H2O (°C)', f1.dew_agua_c ?? -10),
        dataRow('Punto de rocio HC (°C)', f1.dew_hc_c ?? -20),
      ],
    }),

    // 3. AGA 8
    sec('3.', 'Factor de compresibilidad Z — AGA 8 DETAIL'),
    body('Norma: AGA 8 DETAIL (GERG-2008 simplificada). Unico metodo aceptado por NOM-020-ASEA-2024 para medicion fiscal.'),
    body(`Metodo utilizado: ${aga8 ? 'AGA 8 DETAIL (servicio Python)' : 'Papay (correlacion empirica — fallback)'}${aga8 ? `  ·  Densidad: ${aga8.rho_kg_m3?.toFixed(3)} kg/m3` : ''}`),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: [
        ...(aga8 ? [
          dataRow('Z (AGA 8 DETAIL)', aga8.z.toFixed(5)),
          dataRow('Densidad ρ (kg/m3)', aga8.rho_kg_m3?.toFixed(4)),
          dataRow('Metodo', aga8.metodo ?? 'AGA 8'),
        ] : [
          dataRow('Tr (temperatura reducida)', calculo.Tr.toFixed(4)),
          dataRow('Pr (presion reducida)', calculo.Pr.toFixed(4)),
          dataRow('Z (Papay)', calculo.Z_papay.toFixed(5)),
        ]),
        dataRow('Z efectivo utilizado', Zeff.toFixed(5)),
      ],
    }),

    // 4. Efecto Joule-Thomson
    sec('4.', 'Efecto Joule-Thomson — Temperatura de salida'),
    body('La expansion a traves del regulador produce un enfriamiento que puede causar condensacion o hidratacion.'),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: [
        dataRow('dP a traves del regulador (bar)', f1.dp_regulador_bar ?? 5),
        dataRow('Caida de temperatura JT (°C)', calculo.caida_jt_c.toFixed(2)),
        dataRow('T entrada regulador (°C)', f1.tamb_min_c ?? 20),
        dataRow('T salida regulador (°C)', calculo.t_salida_regulador_c.toFixed(2)),
        dataRow('Punto de rocio H2O (°C)', f1.dew_agua_c ?? -10),
        dataRow('Punto de rocio HC (°C)', f1.dew_hc_c ?? -20),
      ],
    }),

    // Alertas JT
    ...(calculo.alertas?.length > 0 ? [
      new Paragraph({ children: [], spacing: { after: 80 } }),
      body('Alertas termodinamicas:'),
      new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: calculo.alertas.map(a => new TableRow({
          children: [
            mkCell(a.nivel.toUpperCase(), true, undefined, 1400,
              a.nivel === 'danger' ? 'b84030' : a.nivel === 'warn' ? 'c17f24' : ACCENT),
            mkCell(a.texto, false, undefined, 7600),
          ],
        })),
      }),
    ] : []),

    // 5. AGA 7 — Conversión a condiciones base
    ...(aga7 ? [
      sec('5.', 'Conversion a condiciones base — AGA 7'),
      body('Calculo de caudales en condiciones base (Pb, Tb) usando el metodo AGA 7.'),
      new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [
          dataRow('Presion operacion Pf (kPa)',   aga7.Pf_kpa.toFixed(3)),
          dataRow('Temperatura operacion Tf (K)', aga7.Tf_k.toFixed(2)),
          dataRow('Z flujo Zf',                   aga7.Zf.toFixed(5)),
          dataRow('Presion base Pb (kPa)',         aga7.Pb_kpa.toFixed(3)),
          dataRow('Temperatura base Tb (K)',       aga7.Tb_k.toFixed(2)),
          dataRow('Z base Zb',                    aga7.Zb.toFixed(5)),
          dataRow('Factor Fpv (supercompresibilidad)', aga7.Fpv.toFixed(5)),
          dataRow('Qmin base (m3/h)',              aga7.qb_min.toFixed(2)),
          dataRow('Qnorm base (m3/h)',             aga7.qb_norm.toFixed(2)),
          dataRow('Qmax base (m3/h)',              aga7.qb_max.toFixed(2)),
        ],
      }),
    ] : []),

    // 6. AGA 3 — Placa de orificio (si aplica)
    ...(aga3 ? [
      sec('6.', `AGA 3 / ISO 5167 — ${f1.tecnologia_key === 'diafragma' ? 'Diafragma' : 'Placa de orificio'}`),
      body('Dimensionamiento iterativo de la placa de orificio segun AGA 3 Part 2 / ISO 5167.'),
      new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [
          dataRow('Diametro interno tuberia D (mm)', aga3.D_mm.toFixed(2)),
          dataRow('Diametro orificio d (mm)',        aga3.d_mm.toFixed(2)),
          dataRow('Beta (d/D)',                      aga3.beta.toFixed(5)),
          dataRow('Cd (coef. descarga)',             aga3.Cd.toFixed(5)),
          dataRow('Ev (coef. velocidad)',            aga3.Ev.toFixed(5)),
          dataRow('dP maximo (mbar)',                aga3.dp_max_mbar.toFixed(1)),
          dataRow('dP nominal (mbar)',               aga3.dp_norm_mbar.toFixed(1)),
          dataRow('dP minimo (mbar)',                aga3.dp_min_mbar.toFixed(1)),
          dataRow('Densidad gas ρ (kg/m3)',          aga3.rho_kgm3.toFixed(4)),
          dataRow('Re tuberia a Qmax',               Math.round(aga3.Re_D_max).toLocaleString('es-MX')),
          dataRow('Schedule tuberia',                aga3.schedule.toUpperCase()),
          dataRow('Beta valido (AGA 3: 0.20–0.75)', aga3.valido ? 'Si' : 'No — revisar diametro'),
          ...(aga3.alerta ? [dataRow('Alerta', aga3.alerta)] : []),
        ],
      }),
    ] : []),

    // 7. Tecnología seleccionada
    sec(aga3 ? '7.' : '6.', 'Tecnologia de medicion seleccionada'),
    new Paragraph({
      children: [new TextRun({ text: f1.tecnologia_nombre ?? 'Por definir', bold: true, color: ACCENT, size: 26 })],
      spacing: { after: 80 },
    }),
    body(`Norma de referencia: ${f1.tecnologia_referencia ?? '—'}`),

    // Normas
    sec(aga3 ? '8.' : '7.', 'Marco normativo aplicable'),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: [
        ['NOM-020-ASEA-2024', 'Diseno, construccion, operacion y mantenimiento de sistemas de medicion de gas natural y gas LP.'],
        ['AGA 8 DETAIL', 'Factor Z por ecuacion de estado GERG-2008 simplificada.'],
        ['AGA 7 (2006)', 'Conversion de caudales a condiciones base.'],
        ...(aga3 ? [['AGA 3 / API 14.3 / ISO 5167', 'Medicion con placa de orificio o diafragma.']] : []),
        ['ISA 5.1', 'Simbologia e identificacion de instrumentacion.'],
        ...(f1.fiscal ? [['RMF Anexo 21', 'Controles volumetricos para hidrocarburos (SAT).']] : []),
      ].map(([clave, desc]) => new TableRow({
        children: [
          mkCell(clave, true, undefined, 2800, ACCENT),
          mkCell(desc, false, undefined, 6200),
        ],
      })),
    }),

    // Aviso legal
    new Paragraph({ children: [], spacing: { before: 400 } }),
    new Paragraph({
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: PANEL },
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE }, left: { style: BorderStyle.SINGLE, size: 2, color: LINE }, right: { style: BorderStyle.SINGLE, size: 2, color: LINE } },
      children: [new TextRun({
        text: 'AVISO LEGAL: Este documento es un borrador de ingenieria generado automaticamente. Requiere revision y firma de ingeniero con cedula profesional antes de tener validez legal. Los calculos presentados son referenciales y deben ser verificados por un especialista en medicion de gas antes de su uso en diseno de detalle o tramites regulatorios.',
        color: INK3, size: 16, italics: true,
      })],
      spacing: { before: 120, after: 120 },
    }),
  ]

  const doc = new Document({
    creator: 'Peregrin',
    title: `Memoria de Calculo — ${proyecto.nombre}`,
    description: 'Memoria de calculo AGA 8/7/3 para punto de medicion de gas natural',
    styles: {
      paragraphStyles: [{
        id: 'Normal', name: 'Normal',
        run: { size: 20, color: INK, font: 'Calibri' },
        paragraph: { spacing: { line: 276 } },
      }],
    },
    sections: [{
      headers: { default: headerContent },
      footers: { default: footerContent },
      properties: {
        page: {
          size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
          margin: { top: convertInchesToTwip(1.1), bottom: convertInchesToTwip(1.0), left: convertInchesToTwip(0.9), right: convertInchesToTwip(0.9) },
        },
      },
      children,
    }],
  })

  return Packer.toBuffer(doc)
}
