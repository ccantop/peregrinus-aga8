import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, TableOfContents, Header, Footer,
  PageNumberElement, convertInchesToTwip, ImageRun,
} from 'docx'
import fs from 'fs'
import path from 'path'

const ACCENT = '4a9ebb'
const INK    = '1b3044'
const INK3   = '8aaabb'
const LINE   = 'd0e0e8'
const PANEL  = 'f7fbfd'

const tipoLabel: Record<string, string> = {
  city_gate: 'City Gate (SISTRANGAS/CENAGAS)',
  industrial: 'Estacion industrial',
  ducto: 'Ducto regional',
  auditoria: 'Auditoria / diagnostico',
}

function cell(text: string, bold = false, bg?: string, width?: number): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: bg ? { type: ShadingType.CLEAR, color: 'auto', fill: bg } : undefined,
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 1, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE },
      left:   { style: BorderStyle.SINGLE, size: 1, color: LINE },
      right:  { style: BorderStyle.SINGLE, size: 1, color: LINE },
    },
    children: [new Paragraph({
      children: [new TextRun({ text, bold, color: bold ? INK : INK3, size: 18 })],
    })],
  })
}

function dataRow(label: string, value: string, last = false): TableRow {
  return new TableRow({
    children: [
      cell(label, false, undefined, 3600),
      cell(value, true, undefined, 5400),
    ],
  })
}

function sectionHeading(num: string, title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({ text: `${num}  `, color: ACCENT, bold: true, size: 22 }),
      new TextRun({ text: title, color: INK, bold: true, size: 22 }),
    ],
    spacing: { before: 280, after: 80 },
  })
}

export interface ReporteWordData {
  proyecto: {
    id: string
    nombre: string
    cliente: string | null
    tipo_punto: string
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

export async function generarReporteWord(d: ReporteWordData): Promise<Buffer> {
  const { proyecto, f1, actividades } = d
  const fecha = new Date(proyecto.creado_en).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const turndown = (Number(f1.qmax) / Math.max(Number(f1.qmin), 0.01)).toFixed(1)
  const presionKPa = (Number(f1.presion_kgcm2) * 98.0665).toFixed(1)
  const dnMm = (Number(f1.diametro_pulg) * 25.4).toFixed(0)

  // Logo
  let logoImg: ImageRun | null = null
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    const logoData = fs.readFileSync(logoPath)
    logoImg = new ImageRun({ data: logoData, transformation: { width: 36, height: 36 }, type: 'png' })
  } catch { /* no logo */ }

  const tech = (f1.tecnologia_nombre ?? '').toLowerCase()

  // Normas
  const normas: Array<[string, string]> = [
    ['NOM-020-ASEA-2024', 'Diseno, construccion, operacion y mantenimiento de sistemas de medicion de gas natural y gas LP.'],
  ]
  if (tech.includes('ultrason')) normas.push(['AGA 9 (2017)', 'Medicion de gas natural por medidores ultrasonicos.'])
  if (tech.includes('orificio') || tech.includes('aga 3')) normas.push(['AGA 3 / API 14.3', 'Medicion de flujo de gas con placa de orificio.'])
  if (tech.includes('turbina')) normas.push(['AGA 7 (2006)', 'Medicion de gas natural con medidores de turbina.'])
  if (tech.includes('coriolis')) normas.push(['AGA 11 (2013)', 'Medicion de gas natural con medidores de efecto Coriolis.'])
  normas.push(['AGA 8 DETAIL', 'Factor Z por ecuacion de estado GERG-2008 simplificada. Requerido por NOM-020-ASEA-2024 para medicion fiscal.'])
  normas.push(['ISA 5.1', 'Simbologia e identificacion de instrumentacion.'])
  if (f1.fiscal) normas.push(['RMF Anexo 21', 'Controles volumetricos para hidrocarburos (SAT).'])

  // Tag list
  const pMax = (Number(f1.presion_kgcm2) * 1.25).toFixed(0)
  const feNorma = tech.includes('ultrason') ? 'AGA 9' : tech.includes('orificio') ? 'AGA 3/API 14.3' : tech.includes('turbina') ? 'AGA 7' : 'AGA/API'
  const tags: string[][] = [
    ['PT-101', 'Transmisor presion',    `0-${pMax} kg/cm2`,               'ANSI/ISA 51.1', 'Entrada'],
    ['TT-101', 'Transmisor temperatura','-20 a +60 C',                    'ISA TR20.00.01','Entrada'],
    ['FE-100', 'Elemento primario',     `${f1.qmin}-${f1.qmax} m3/h`,     feNorma,          'Medicion'],
    ['FT-100', 'Transmisor flujo',      `${f1.qmin}-${f1.qmax} m3/h`,     feNorma,          'Medicion'],
    ['PCV-100','Valvula reg. presion',  `0-${f1.presion_kgcm2} kg/cm2`,   'ANSI B16.34',   'Control'],
    ['PT-102', 'Transmisor presion',    `0-${(Number(f1.presion_kgcm2)*.6).toFixed(0)} kg/cm2`, 'ANSI/ISA 51.1', 'Salida'],
    ['FQI-100','Computador de flujo',   'N/D',                            'AGA 8 DETAIL',  'Calculo'],
    ['SEP-100','Separador / filtro',    `DN${f1.diametro_pulg} ASME`,     'ASME VIII',     'Acondic.'],
  ]

  const ESTADO_LABEL: Record<string, string> = { tienes: 'Listo', falta: 'Falta', en_proceso: 'En proceso' }

  const headerContent = new Header({
    children: [new Paragraph({
      children: [
        ...(logoImg ? [logoImg] : []),
        new TextRun({ text: '  PEREGRIN  ', bold: true, color: ACCENT, size: 22, characterSpacing: 100 }),
        new TextRun({ text: 'Gas Engineering Experts', color: INK3, size: 16 }),
        new TextRun({ text: '   |   Reporte Tecnico — Borrador Rev. 0', color: INK3, size: 16 }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE } },
      spacing: { after: 60 },
    })],
  })

  const footerContent = new Footer({
    children: [new Paragraph({
      children: [
        new TextRun({ text: 'PEREGRIN — Diseno de puntos de medicion   |   Pag. ', color: INK3, size: 16 }),
        new PageNumberElement(),
      ],
      alignment: AlignmentType.RIGHT,
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: LINE } },
      spacing: { before: 60 },
    })],
  })

  const doc = new Document({
    creator: 'Peregrin',
    title: `Reporte Tecnico — ${proyecto.nombre}`,
    description: 'Reporte tecnico de diseno de punto de medicion de gas natural',
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { size: 20, color: INK, font: 'Calibri' },
          paragraph: { spacing: { line: 276 } },
        },
      ],
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
      children: [
        // Título
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: proyecto.nombre, color: INK, bold: true, size: 36 })],
          spacing: { before: 200, after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({
            text: `${proyecto.cliente ? `${proyecto.cliente}  ·  ` : ''}${tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto}  ·  ${fecha}  ·  Rev. 0`,
            color: INK3, size: 18,
          })],
          spacing: { after: 200 },
        }),

        // TOC
        new TableOfContents('Tabla de contenido', {
          hyperlink: true,
          headingStyleRange: '1-2',
        }),
        new Paragraph({ children: [], spacing: { after: 240 } }),

        // 1. Datos del punto
        sectionHeading('1.', 'Datos del punto de medicion'),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            dataRow('Tipo de punto',     tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto),
            dataRow('Fluido',            f1.fluido === 'gn' ? 'Gas natural' : 'GLP / mezcla'),
            dataRow('Custodia fiscal',   f1.fiscal ? 'Si' : 'No'),
            dataRow('Clase localizacion',f1.clase_localizacion === 'na' ? 'No aplica' : `Clase ${f1.clase_localizacion}`),
          ],
        }),

        // 2. Condiciones de proceso
        sectionHeading('2.', 'Condiciones de diseno y proceso'),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            dataRow('Caudal minimo (Qmin)',   `${Number(f1.qmin).toLocaleString('es-MX')} m3/h`),
            dataRow('Caudal nominal (Qnorm)', `${Number(f1.qnorm).toLocaleString('es-MX')} m3/h`),
            dataRow('Caudal maximo (Qmax)',   `${Number(f1.qmax).toLocaleString('es-MX')} m3/h`),
            dataRow('Rango de medicion',      `1 : ${turndown}`),
            dataRow('Presion de operacion',   `${f1.presion_kgcm2} kg/cm2  (${presionKPa} kPa)`),
            dataRow('Diametro nominal',       `${f1.diametro_pulg}"  (DN${dnMm} mm)`),
            ...(f1.sg     != null ? [dataRow('Gravedad especifica (SG)', String(f1.sg))] : []),
            ...(f1.co2_pct != null ? [dataRow('CO2 (% mol)', `${f1.co2_pct} %`)] : []),
            ...(f1.n2_pct  != null ? [dataRow('N2 (% mol)',  `${f1.n2_pct} %`)]  : []),
          ],
        }),

        // 3. Tecnología
        sectionHeading('3.', 'Tecnologia de medicion recomendada'),
        new Paragraph({
          children: [new TextRun({ text: f1.tecnologia_nombre ?? 'Por definir', bold: true, color: ACCENT, size: 26 })],
          spacing: { after: 60 },
        }),
        ...(f1.tecnologia_referencia ? [new Paragraph({
          children: [new TextRun({ text: `Norma de referencia: ${f1.tecnologia_referencia}`, color: INK3, size: 18 })],
          spacing: { after: 60 },
        })] : []),
        ...(f1.tecnologia_motivo ? [new Paragraph({
          children: [new TextRun({ text: f1.tecnologia_motivo, color: INK3, size: 18 })],
          spacing: { after: 120 },
        })] : []),

        // 4. Metodología AGA 8
        sectionHeading('4.', 'Metodologia de calculo — Factor Z'),
        new Paragraph({
          children: [new TextRun({ text: 'AGA 8 DETAIL  —  GERG-2008 simplificada', bold: true, color: ACCENT, size: 20 })],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({
            text: 'El factor de compresibilidad Z se calcula con la ecuacion de estado AGA 8 DETAIL, derivando la composicion molecular (CH4, C2H6, N2, CO2) de los parametros SG / CO2 / N2. Este es el unico metodo aceptado por NOM-020-ASEA-2024 para medicion fiscal.',
            color: INK3, size: 18,
          })],
          spacing: { after: 120 },
        }),

        // 5. Tag list
        sectionHeading('5.', 'Lista de instrumentos (Tag List)'),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            new TableRow({
              tableHeader: true,
              children: ['TAG', 'TIPO', 'RANGO / ESCALA', 'NORMA', 'SERVICIO'].map(h =>
                new TableCell({
                  shading: { type: ShadingType.CLEAR, color: 'auto', fill: PANEL },
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } },
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: INK3, size: 16 })] })],
                })
              ),
            }),
            ...tags.map(([tag, tipo, rango, norma, svc]) => new TableRow({
              children: [tag, tipo, rango, norma, svc].map(v =>
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } },
                  children: [new Paragraph({ children: [new TextRun({ text: v, size: 16, color: INK })] })],
                })
              ),
            })),
          ],
        }),

        // 6. Normas
        sectionHeading('6.', 'Marco normativo aplicable'),
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: normas.map(([clave, desc]) => new TableRow({
            children: [
              new TableCell({
                width: { size: 2800, type: WidthType.DXA },
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } },
                children: [new Paragraph({ children: [new TextRun({ text: clave, bold: true, color: ACCENT, size: 17 })] })],
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } },
                children: [new Paragraph({ children: [new TextRun({ text: desc, color: INK3, size: 16 })] })],
              }),
            ],
          })),
        }),

        // 7. Actividades
        ...(actividades.length > 0 ? [
          sectionHeading('7.', 'Actividades y huecos del proyecto'),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ['ESTADO', 'ACTIVIDAD', 'ACCION SUGERIDA'].map(h =>
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, color: 'auto', fill: PANEL },
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } },
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: INK3, size: 16 })] })],
                  })
                ),
              }),
              ...actividades.map(a => new TableRow({
                children: [
                  new TableCell({
                    width: { size: 1400, type: WidthType.DXA },
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } },
                    children: [new Paragraph({ children: [new TextRun({ text: ESTADO_LABEL[a.estado] ?? a.estado, bold: true, size: 16, color: a.estado === 'tienes' ? '2d8c4e' : a.estado === 'falta' ? 'b84030' : 'c17f24' })] })],
                  }),
                  new TableCell({
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } },
                    children: [new Paragraph({ children: [new TextRun({ text: a.nombre, size: 16, color: INK })] })],
                  }),
                  new TableCell({
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } },
                    children: [new Paragraph({ children: [new TextRun({ text: a.accion_sugerida || '—', size: 16, color: INK3 })] })],
                  }),
                ],
              })),
            ],
          }),
        ] : []),

        // Aviso legal
        new Paragraph({ children: [], spacing: { before: 400 } }),
        new Paragraph({
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: PANEL },
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE }, left: { style: BorderStyle.SINGLE, size: 2, color: LINE }, right: { style: BorderStyle.SINGLE, size: 2, color: LINE } },
          children: [new TextRun({
            text: 'AVISO LEGAL: Este documento es un borrador de ingenieria generado automaticamente. Requiere revision y firma de ingeniero con cedula profesional antes de tener validez legal. PEREGRIN no emite dictamen de Unidad de Verificacion (UV), no valida interconexion ante CENAGAS/SISTRANGAS, ni certifica trazabilidad metrologica. No sustituye la ingenieria de detalle.',
            color: INK3, size: 16, italics: true,
          })],
          spacing: { before: 120, after: 120 },
        }),
      ],
    }],
  })

  return Packer.toBuffer(doc)
}
