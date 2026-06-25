/**
 * Generador DXF R12 ASCII — simbología ISA 5.1, tag list, cotas, cajetín completo.
 */

export interface DatosDXF {
  nombre: string
  cliente: string
  tipo_punto: string
  tecnologia_nombre: string
  tecnologia_referencia: string
  fiscal: boolean
  qmin: number
  qnorm: number
  qmax: number
  presion_kgcm2: number
  diametro_pulg: number
  sg?: number | null
  co2_pct?: number | null
  n2_pct?: number | null
  fecha: string
  revision?: string
}

// ─── builder de registros DXF ─────────────────────────────────────────────────

type Rec = string[]

function r(code: number, value: string | number): Rec {
  return [String(code).padStart(3, ' '), String(value)]
}

function f(n: number) { return n.toFixed(4) }

// ─── primitivas ───────────────────────────────────────────────────────────────

function dxfLine(layer: string, x1: number, y1: number, x2: number, y2: number): Rec[] {
  return [
    r(0,'LINE'), r(8,layer),
    r(10,f(x1)), r(20,f(y1)), r(30,'0.0'),
    r(11,f(x2)), r(21,f(y2)), r(31,'0.0'),
  ]
}

function dxfCircle(layer: string, cx: number, cy: number, rad: number): Rec[] {
  return [r(0,'CIRCLE'), r(8,layer), r(10,f(cx)), r(20,f(cy)), r(30,'0.0'), r(40,f(rad))]
}

function dxfArc(layer: string, cx: number, cy: number, rad: number, startDeg: number, endDeg: number): Rec[] {
  return [r(0,'ARC'), r(8,layer), r(10,f(cx)), r(20,f(cy)), r(30,'0.0'), r(40,f(rad)), r(50,f(startDeg)), r(51,f(endDeg))]
}

function dxfText(layer: string, x: number, y: number, h: number, txt: string, halign = 0, valign = 0): Rec[] {
  const safe = txt.replace(/[\r\n]/g, ' ').slice(0, 255)
  const base: Rec[] = [r(0,'TEXT'), r(8,layer), r(7,'STANDARD'), r(10,f(x)), r(20,f(y)), r(30,'0.0'), r(40,f(h)), r(1,safe)]
  if (halign || valign) {
    base.push(r(72,halign), r(11,f(x)), r(21,f(y)), r(31,'0.0'), r(73,valign))
  }
  return base
}

function dxfRect(layer: string, x: number, y: number, w: number, h: number): Rec[] {
  return [
    ...dxfLine(layer, x, y, x+w, y),
    ...dxfLine(layer, x+w, y, x+w, y+h),
    ...dxfLine(layer, x+w, y+h, x, y+h),
    ...dxfLine(layer, x, y+h, x, y),
  ]
}

// ─── header ───────────────────────────────────────────────────────────────────

function makeHeader(W: number, H: number): Rec[] {
  return [
    r(0,'SECTION'), r(2,'HEADER'),
    r(9,'$ACADVER'), r(1,'AC1009'),
    r(9,'$EXTMIN'), r(10,'0.0'), r(20,'0.0'), r(30,'0.0'),
    r(9,'$EXTMAX'), r(10,String(W)), r(20,String(H)), r(30,'0.0'),
    r(9,'$LIMMIN'), r(10,'0.0'), r(20,'0.0'),
    r(9,'$LIMMAX'), r(10,String(W)), r(20,String(H)),
    r(0,'ENDSEC'),
  ]
}

// ─── tables ───────────────────────────────────────────────────────────────────

const LAYERS = [
  { name: '0',            color: 7 },
  { name: 'BORDE',        color: 7 },
  { name: 'TITULO',       color: 7 },
  { name: 'PROCESO',      color: 5 },  // azul
  { name: 'VALVULAS',     color: 2 },  // amarillo
  { name: 'INSTRUMENTOS', color: 3 },  // verde
  { name: 'ANOTACIONES',  color: 8 },  // gris
  { name: 'DATOS',        color: 7 },
  { name: 'COTAS',        color: 1 },  // rojo
  { name: 'TAGLIST',      color: 7 },
]

function makeTables(): Rec[] {
  return [
    r(0,'SECTION'), r(2,'TABLES'),
    r(0,'TABLE'), r(2,'LTYPE'), r(70,2),
    r(0,'LTYPE'), r(2,'CONTINUOUS'), r(70,0), r(3,'Solid line'), r(72,65), r(73,0), r(40,'0.0'),
    r(0,'LTYPE'), r(2,'DASHED'), r(70,0), r(3,'Dashed'), r(72,65), r(73,2), r(40,'9.0'),
    r(74,1), r(49,'6.0'), r(74,1), r(49,'-3.0'),
    r(0,'ENDTAB'),
    r(0,'TABLE'), r(2,'STYLE'), r(70,1),
    r(0,'STYLE'), r(2,'STANDARD'), r(70,0), r(40,'0.0'), r(41,'1.0'), r(50,'0.0'), r(71,0), r(42,'0.2'), r(3,'txt'), r(4,''),
    r(0,'ENDTAB'),
    r(0,'TABLE'), r(2,'LAYER'), r(70,LAYERS.length),
    ...LAYERS.flatMap(l => [r(0,'LAYER'), r(2,l.name), r(70,0), r(62,l.color), r(6,'CONTINUOUS')]),
    r(0,'ENDTAB'),
    r(0,'ENDSEC'),
  ]
}

// ─── simbología ISA 5.1 ───────────────────────────────────────────────────────

/** Válvula de compuerta (isolación) — dos triángulos con vértices al centro */
function isaGateValve(cx: number, cy: number, r = 7): Rec[] {
  return [
    ...dxfLine('VALVULAS', cx-r, cy-r, cx, cy),
    ...dxfLine('VALVULAS', cx-r, cy+r, cx, cy),
    ...dxfLine('VALVULAS', cx-r, cy-r, cx-r, cy+r),
    ...dxfLine('VALVULAS', cx+r, cy-r, cx, cy),
    ...dxfLine('VALVULAS', cx+r, cy+r, cx, cy),
    ...dxfLine('VALVULAS', cx+r, cy-r, cx+r, cy+r),
  ]
}

/** Válvula de control (globo) — lazo de mariposa + actuador circular */
function isaControlValve(cx: number, cy: number, r = 7): Rec[] {
  return [
    ...dxfLine('VALVULAS', cx-r, cy-r, cx, cy),
    ...dxfLine('VALVULAS', cx-r, cy+r, cx, cy),
    ...dxfLine('VALVULAS', cx-r, cy-r, cx-r, cy+r),
    ...dxfLine('VALVULAS', cx+r, cy-r, cx, cy),
    ...dxfLine('VALVULAS', cx+r, cy+r, cx, cy),
    ...dxfLine('VALVULAS', cx+r, cy-r, cx+r, cy+r),
    // vástago hacia arriba
    ...dxfLine('VALVULAS', cx, cy, cx, cy + r + 5),
    // actuador (círculo)
    ...dxfCircle('VALVULAS', cx, cy + r + 5 + 4, 4),
    // letra A dentro del actuador
    ...dxfText('VALVULAS', cx, cy + r + 5 + 2, 2.5, 'A', 1, 2),
  ]
}

/** Placa de orificio — dos líneas paralelas cruzando el tubo */
function isaOrificePlate(cx: number, cy: number, pipeR = 4): Rec[] {
  return [
    ...dxfLine('VALVULAS', cx - 2, cy - pipeR - 6, cx - 2, cy + pipeR + 6),
    ...dxfLine('VALVULAS', cx + 2, cy - pipeR - 6, cx + 2, cy + pipeR + 6),
  ]
}

/** Medidor ultrasónico — rectángulo con líneas diagonales de transductores */
function isaUltrasonicMeter(cx: number, cy: number, w = 30, h = 18): Rec[] {
  return [
    ...dxfRect('PROCESO', cx - w/2, cy - h/2, w, h),
    ...dxfLine('PROCESO', cx - w/2 + 4, cy - h/2, cx + w/2 - 4, cy + h/2),
    ...dxfLine('PROCESO', cx - w/2 + 4, cy + h/2, cx + w/2 - 4, cy - h/2),
    ...dxfText('PROCESO', cx, cy + 1, 3, 'US', 1, 2),
  ]
}

/** Medidor de turbina — círculo con aspas */
function isaTurbineMeter(cx: number, cy: number, r = 10): Rec[] {
  return [
    ...dxfCircle('PROCESO', cx, cy, r),
    ...dxfLine('PROCESO', cx - r + 2, cy, cx + r - 2, cy),
    ...dxfLine('PROCESO', cx, cy - r + 2, cx, cy + r - 2),
    ...dxfArc('PROCESO', cx - 3, cy, 5, 0, 180),
    ...dxfArc('PROCESO', cx + 3, cy, 5, 180, 360),
    ...dxfText('PROCESO', cx, cy + 1, 2.5, 'T', 1, 2),
  ]
}

/** Medidor Coriolis — figura de 8 */
function isaCoriolisMeter(cx: number, cy: number, r = 9): Rec[] {
  return [
    ...dxfCircle('PROCESO', cx, cy + r/2, r/2),
    ...dxfCircle('PROCESO', cx, cy - r/2, r/2),
    ...dxfText('PROCESO', cx, cy + 1, 2.5, 'CO', 1, 2),
  ]
}

/** Rectángulo con aspa — filtro/separador */
function isaStrainer(cx: number, cy: number, w = 28, h = 16): Rec[] {
  return [
    ...dxfRect('VALVULAS', cx - w/2, cy - h/2, w, h),
    ...dxfLine('VALVULAS', cx - w/2, cy - h/2, cx + w/2, cy + h/2),
    ...dxfLine('VALVULAS', cx - w/2, cy + h/2, cx + w/2, cy - h/2),
    ...dxfText('ANOTACIONES', cx, cy + 1, 2.5, 'F', 1, 2),
  ]
}

/**
 * Burbuja de instrumento ISA 5.1:
 * - Círculo con línea horizontal que divide tag superior e inferior
 * - Línea de conexión al proceso
 */
function isaBubble(tagTop: string, tagBot: string, cx: number, cy: number, r = 8, pipeY?: number): Rec[] {
  const out: Rec[] = [
    ...dxfCircle('INSTRUMENTOS', cx, cy, r),
    ...dxfLine('INSTRUMENTOS', cx - r, cy, cx + r, cy),   // divisor horizontal
    ...dxfText('INSTRUMENTOS', cx, cy + r * 0.25, 2.5, tagTop, 1, 2),
    ...dxfText('INSTRUMENTOS', cx, cy - r * 0.65, 2, tagBot, 1, 2),
  ]
  if (pipeY !== undefined) {
    out.push(...dxfLine('INSTRUMENTOS', cx, pipeY < cy ? cy - r : cy + r, cx, pipeY))
  }
  return out
}

/** Flecha de dirección de flujo */
function flowArrow(cx: number, cy: number, size = 5): Rec[] {
  return [
    ...dxfLine('PROCESO', cx - size, cy + size/2, cx, cy),
    ...dxfLine('PROCESO', cx - size, cy - size/2, cx, cy),
    ...dxfLine('PROCESO', cx - size, cy - size/2, cx - size, cy + size/2),
  ]
}

// ─── línea de cota ────────────────────────────────────────────────────────────

function dimLinear(
  x1: number, y1: number, x2: number, y2: number,
  offset: number, label: string, vertical = false,
): Rec[] {
  const out: Rec[] = []
  const arrowSize = 3

  if (!vertical) {
    // cota horizontal
    const dy = y1 + offset
    out.push(...dxfLine('COTAS', x1, y1, x1, dy))
    out.push(...dxfLine('COTAS', x2, y2, x2, dy))
    out.push(...dxfLine('COTAS', x1, dy, x2, dy))
    // flechas
    out.push(...dxfLine('COTAS', x1, dy, x1 + arrowSize, dy + arrowSize/2))
    out.push(...dxfLine('COTAS', x1, dy, x1 + arrowSize, dy - arrowSize/2))
    out.push(...dxfLine('COTAS', x2, dy, x2 - arrowSize, dy + arrowSize/2))
    out.push(...dxfLine('COTAS', x2, dy, x2 - arrowSize, dy - arrowSize/2))
    out.push(...dxfText('COTAS', (x1 + x2) / 2, dy + 2, 2.5, label, 1, 0))
  } else {
    // cota vertical
    const dx = x1 + offset
    out.push(...dxfLine('COTAS', x1, y1, dx, y1))
    out.push(...dxfLine('COTAS', x2, y2, dx, y2))
    out.push(...dxfLine('COTAS', dx, y1, dx, y2))
    out.push(...dxfLine('COTAS', dx, y1, dx - arrowSize/2, y1 + arrowSize))
    out.push(...dxfLine('COTAS', dx, y1, dx + arrowSize/2, y1 + arrowSize))
    out.push(...dxfLine('COTAS', dx, y2, dx - arrowSize/2, y2 - arrowSize))
    out.push(...dxfLine('COTAS', dx, y2, dx + arrowSize/2, y2 - arrowSize))
    out.push(...dxfText('COTAS', dx + 2, (y1 + y2) / 2, 2.5, label, 0, 2))
  }
  return out
}

// ─── silueta vectorial halcón ─────────────────────────────────────────────────

function falconLogo(cx: number, cy: number, sc = 1.0): Rec[] {
  const L = 'TITULO'
  const out: Rec[] = []
  const x = (n: number) => cx + n * sc
  const y = (n: number) => cy + n * sc
  const ln = (x1: number, y1: number, x2: number, y2: number) =>
    dxfLine(L, x(x1), y(y1), x(x2), y(y2))
  const ar = (cx2: number, cy2: number, r: number, a1: number, a2: number) =>
    dxfArc(L, x(cx2), y(cy2), r * sc, a1, a2)
  const ci = (cx2: number, cy2: number, r: number) =>
    dxfCircle(L, x(cx2), y(cy2), r * sc)

  // Cabeza
  out.push(...ci(2, 6, 2.5))
  // Pico
  out.push(...ln(4, 5.5, 6.5, 3.8))
  out.push(...ln(6.5, 3.8, 5, 3.8))
  out.push(...ln(5, 3.8, 4, 4.8))

  // Cuerpo — dos arcos formando óvalo
  out.push(...ar(0, 1, 4.2, 20, 160))   // arco superior cuerpo
  out.push(...ar(0, -1, 4, 200, 340))   // arco inferior cuerpo

  // Ala derecha (barrida hacia arriba-derecha)
  out.push(...ln(2.5, 3.5, 7, 7))
  out.push(...ln(7, 7, 13, 9))
  out.push(...ln(13, 9, 16, 7))
  out.push(...ln(16, 7, 12, 4.5))
  out.push(...ln(12, 4.5, 6, 1))

  // Ala izquierda (espejo)
  out.push(...ln(-2, 3.5, -7, 7))
  out.push(...ln(-7, 7, -13, 9))
  out.push(...ln(-13, 9, -16, 7))
  out.push(...ln(-16, 7, -12, 4.5))
  out.push(...ln(-12, 4.5, -5, 1))

  // Marcas de plumas ala derecha
  out.push(...ln(9, 8.5, 8, 5.5))
  out.push(...ln(12, 8.5, 10, 5))

  // Marcas de plumas ala izquierda
  out.push(...ln(-9, 8.5, -8, 5.5))
  out.push(...ln(-12, 8.5, -10, 5))

  // Cola
  out.push(...ln(-2, -3.5, -3.5, -8.5))
  out.push(...ln(-3.5, -8.5, 2.5, -8.5))
  out.push(...ln(2.5, -8.5, 1.5, -3.5))

  // Patas (retractadas, apenas visibles)
  out.push(...ln(1, -3, 0.5, -5.5))
  out.push(...ln(0.5, -5.5, 2, -6.5))
  out.push(...ln(-1, -3, -1.5, -5.5))
  out.push(...ln(-1.5, -5.5, -3, -6.5))

  return out
}

// ─── cajetín de título ────────────────────────────────────────────────────────

/** Limpia caracteres no-ASCII para DXF R12 */
function ascii(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, c => {
    const map: Record<string, string> = {
      '—': '-', '–': '-', '·': '.', '±': '+/-', '°': ' grados',
      'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','ñ':'n',
      'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','Ü':'U','Ñ':'N',
    }
    return map[c] ?? '?'
  })
}

function makeCajetin(d: DatosDXF, x0 = 641, W = 195, H = 584, yBase = 5): Rec[] {
  const out: Rec[] = []
  const T = 'TITULO'
  const A = 'ANOTACIONES'
  const lx = x0 + 5
  const cx = x0 + W / 2

  // Secciones: [y_base, altura] — de abajo hacia arriba
  // Total debe sumar H=594
  const secs = [
    { h: 55 },   // 0: pie nota       y=0
    { h: 65 },   // 1: firmas         y=55
    { h: 30 },   // 2: formato        y=120
    { h: 30 },   // 3: escala         y=150
    { h: 30 },   // 4: fecha          y=180
    { h: 50 },   // 5: revision       y=210
    { h: 40 },   // 6: num plano      y=260
    { h: 40 },   // 7: fiscal         y=300
    { h: 40 },   // 8: norma          y=340
    { h: 50 },   // 9: tecnologia     y=380
    { h: 40 },   // 10: tipo punto    y=430
    { h: 40 },   // 11: cliente       y=470
    { h: 40 },   // 12: proyecto      y=510
    { h: 34 },   // 13: logo          y=550
  ]
  // calcular y acumulado desde yBase
  let yAcc = yBase
  const secY: number[] = []
  secs.forEach(s => { secY.push(yAcc); yAcc += s.h })

  // borde exterior (alineado con el borde del plano)
  out.push(...dxfRect(T, x0, yBase, W, H))

  // separadores internos (el fondo y techo vienen del rect exterior)
  secY.slice(1).forEach(y => out.push(...dxfLine(T, x0, y, x0+W, y)))

  // helper: etiqueta pequeña + valor grande, alineados a izquierda
  const s = (idx: number, label: string, val: string, valH: number, extraLine?: string) => {
    const y = secY[idx]
    const h = secs[idx].h
    out.push(...dxfText(A, lx, y + h - 6,  2.5, label))
    out.push(...dxfText(T, lx, y + h - 18, valH, ascii(val).slice(0, 34)))
    if (extraLine) out.push(...dxfText(A, lx, y + h - 30, 2.5, ascii(extraLine).slice(0, 38)))
  }

  // 13: logo
  out.push(...dxfText(T, cx, secY[13] + secs[13].h / 2 - 3, 7, 'PEREGRIN', 1, 2))

  // 12: proyecto
  s(12, 'PROYECTO', d.nombre.toUpperCase(), 3.5)

  // 11: cliente
  s(11, 'CLIENTE', d.cliente || 'SIN CLIENTE', 3.5)

  // 10: tipo de punto
  s(10, 'TIPO DE PUNTO', d.tipo_punto, 3)

  // 9: tecnología
  s(9, 'TECNOLOGIA DE MEDICION', d.tecnologia_nombre,  3,
    `Ref: ${ascii(d.tecnologia_referencia || 'N/D')}`)

  // 8: norma
  s(8, 'NORMA PRINCIPAL', 'NOM-020-ASEA-2024', 3.5)

  // 7: fiscal
  s(7, 'CUSTODIA FISCAL', d.fiscal ? 'SI' : 'NO', 5)

  // 6: número de plano
  s(6, 'NUM. DE PLANO', 'PER-PID-001', 3)

  // 5: revisión
  s(5, 'REVISION', d.revision ?? '0', 6)

  // 4: fecha
  s(4, 'FECHA', d.fecha, 3)

  // 3: escala
  s(3, 'ESCALA', 'SIN ESCALA', 3)

  // 2: formato
  s(2, 'FORMATO', 'A1 HORIZONTAL', 3)

  // 1: firmas — solo divisores verticales (top/bottom vienen de separadores)
  const fW = W / 3
  const yFirmas = secY[1]
  const hFirmas = secs[1].h
  out.push(...dxfLine(T, x0+fW,   yFirmas, x0+fW,   yFirmas+hFirmas))
  out.push(...dxfLine(T, x0+fW*2, yFirmas, x0+fW*2, yFirmas+hFirmas))
  ;['ELABORO','REVISO','AUTORIZO'].forEach((rol, i) => {
    const fx = x0 + fW * i + fW / 2
    out.push(...dxfText(A, fx, yFirmas+hFirmas-6, 2.5, rol, 1, 2))
    out.push(...dxfLine(A, x0+fW*i+5, yFirmas+20, x0+fW*(i+1)-5, yFirmas+20))
    out.push(...dxfText(A, fx, yFirmas+12, 2, 'Nombre / Cedula', 1, 2))
  })

  // 0: nota al pie
  out.push(...dxfText(A, lx, secY[0]+46, 2, 'BORRADOR - NO VALIDO PARA CONSTRUCCION'))
  out.push(...dxfText(A, lx, secY[0]+36, 2, 'Requiere firma de ing. responsable.'))
  out.push(...dxfText(A, lx, secY[0]+26, 2, 'No emite dictamen de UV.'))
  out.push(...dxfText(A, lx, secY[0]+16, 2, `PEREGRIN Prototipo / ${d.fecha}`))

  return out
}

// ─── tabla de instrumentos (tag list) ────────────────────────────────────────

interface TagEntry {
  tag: string
  tipo: string
  servicio: string
  rango: string
  norma: string
}

function makeTagList(tags: TagEntry[], x0 = 10, y0 = 10, W = 620, H = 120): Rec[] {
  const out: Rec[] = []
  const L = 'TAGLIST'
  const A = 'ANOTACIONES'

  out.push(...dxfRect(L, x0, y0, W, H))

  const titleH = 12
  out.push(...dxfLine(L, x0, y0+H-titleH, x0+W, y0+H-titleH))
  out.push(...dxfText(L, x0+5, y0+H-9, 4, 'LISTA DE INSTRUMENTOS (TAG LIST)'))

  const cols = [0.12, 0.22, 0.32, 0.22, 0.12]  // fracciones de W
  const xCols: number[] = [x0]
  cols.forEach((c, i) => { xCols.push(xCols[i] + c * W) })

  const headers = ['TAG', 'TIPO', 'SERVICIO', 'RANGO / ESCALA', 'NORMA']
  const rowH = 12
  const headerY = y0 + H - titleH - rowH

  out.push(...dxfLine(L, x0, headerY, x0+W, headerY))
  xCols.slice(1,-1).forEach(cx => out.push(...dxfLine(L, cx, y0, cx, y0+H-titleH)))

  headers.forEach((h, i) => {
    out.push(...dxfText(A, xCols[i]+2, headerY+3, 2.5, h))
  })

  tags.forEach((tag, row) => {
    const y = headerY - rowH * (row + 1)
    if (y < y0) return
    out.push(...dxfLine(L, x0, y+rowH, x0+W, y+rowH))
    const cells = [tag.tag, tag.tipo, tag.servicio, tag.rango, tag.norma]
    cells.forEach((val, i) => {
      out.push(...dxfText(A, xCols[i]+2, y+3, 2.5, val))
    })
  })

  return out
}

// ─── tabla de condiciones de proceso ─────────────────────────────────────────

function makeTabla(d: DatosDXF, x0 = 10, y0 = 135, W = 620, H = 100): Rec[] {
  const out: Rec[] = []
  const L = 'DATOS'
  const A = 'ANOTACIONES'

  out.push(...dxfRect(L, x0, y0, W, H))
  out.push(...dxfLine(L, x0, y0+H-12, x0+W, y0+H-12))
  out.push(...dxfText(L, x0+5, y0+H-9, 4, 'CONDICIONES DE DISENO Y PROCESO'))

  const cW = W / 4
  for (let i = 1; i < 4; i++) out.push(...dxfLine(L, x0+cW*i, y0, x0+cW*i, y0+H-12))

  const td = (d.qmax / Math.max(d.qmin, 0.01)).toFixed(1)
  const presionKpa = (d.presion_kgcm2 * 98.0665).toFixed(0)
  const rows = [
    ['Qmin',            `${d.qmin} m3/h`,     'Presion operacion',    `${d.presion_kgcm2} kg/cm2 (${presionKpa} kPa)`],
    ['Qnorm',           `${d.qnorm} m3/h`,    'Diametro nominal',     `${d.diametro_pulg}" (DN${Math.round(d.diametro_pulg*25.4)} mm)`],
    ['Qmax',            `${d.qmax} m3/h`,     'Grav. especifica (SG)',d.sg != null ? String(d.sg) : 'N/D'],
    ['Turndown',        `${td}:1`,            'CO2 / N2 (% mol)',     `${d.co2_pct ?? 'N/D'} / ${d.n2_pct ?? 'N/D'}`],
  ]

  rows.forEach((row, i) => {
    const y = y0 + H - 24 - i * 14
    if (i > 0) out.push(...dxfLine(L, x0, y+14, x0+W, y+14))
    out.push(...dxfText(A, x0+cW*0+3, y+3, 2.5, row[0]))
    out.push(...dxfText(L, x0+cW*1-3, y+3, 2.5, row[1], 2))
    out.push(...dxfText(A, x0+cW*2+3, y+3, 2.5, row[2]))
    out.push(...dxfText(L, x0+cW*4-3, y+3, 2.5, row[3], 2))
  })

  return out
}

// ─── diagrama P&ID con simbología ISA ────────────────────────────────────────

function makePID(d: DatosDXF, x0 = 10, y0 = 240, W = 620, H = 345): Rec[] {
  const out: Rec[] = []
  const P = 'PROCESO'
  const A = 'ANOTACIONES'

  const pY  = y0 + H * 0.52   // eje de tubería
  const pipeHalfH = Math.min(Math.max(d.diametro_pulg * 0.5, 2), 6)

  // posiciones X de componentes
  const xEnt  = x0 + 25
  const xV1   = x0 + 75
  const xFilt = x0 + 135
  const xMed  = x0 + 230
  const xV2   = x0 + 330
  const xReg  = x0 + 420
  const xV3   = x0 + 500
  const xSal  = x0 + W - 20

  // tubería doble línea (representación DN)
  const segs: [number, number][] = [
    [xEnt,    xV1-8],   [xV1+8,   xFilt-15], [xFilt+15, xMed-16],
    [xMed+16, xV2-8],   [xV2+8,   xReg-16],  [xReg+16,  xV3-8],
    [xV3+8,   xSal],
  ]
  segs.forEach(([x1,x2]) => {
    out.push(...dxfLine(P, x1, pY + pipeHalfH, x2, pY + pipeHalfH))
    out.push(...dxfLine(P, x1, pY - pipeHalfH, x2, pY - pipeHalfH))
  })

  // flechas de flujo
  ;[xEnt+30, xMed+55, xV3+25].forEach(xa => out.push(...flowArrow(xa, pY)))

  // etiquetas de línea
  out.push(...dxfText(A, xEnt-5, pY+pipeHalfH+6, 3, 'ENTRADA', 0, 0))
  out.push(...dxfText(A, xSal+3, pY+pipeHalfH+6, 3, 'SALIDA', 0, 0))

  // válvulas
  out.push(...isaGateValve(xV1, pY, 7))
  out.push(...dxfText(A, xV1, pY-20, 2.5, 'V-100', 1, 2))

  out.push(...isaGateValve(xV2, pY, 7))
  out.push(...dxfText(A, xV2, pY-20, 2.5, 'V-101', 1, 2))

  out.push(...isaGateValve(xV3, pY, 7))
  out.push(...dxfText(A, xV3, pY-20, 2.5, 'V-102', 1, 2))

  // filtro / separador
  out.push(...isaStrainer(xFilt, pY, 28, 16))
  out.push(...dxfText(A, xFilt, pY-22, 2.5, 'SEP-100', 1, 2))
  out.push(...dxfText(A, xFilt, pY-30, 2, 'SEPARADOR/FILTRO', 1, 2))

  // medidor — símbolo según tecnología
  const tech = d.tecnologia_nombre.toLowerCase()
  if (tech.includes('ultrason')) {
    out.push(...isaUltrasonicMeter(xMed, pY, 32, 20))
  } else if (tech.includes('turbina')) {
    out.push(...isaTurbineMeter(xMed, pY, 11))
  } else if (tech.includes('coriolis')) {
    out.push(...isaCoriolisMeter(xMed, pY, 11))
  } else if (tech.includes('orificio')) {
    out.push(...isaOrificePlate(xMed, pY, pipeHalfH))
  } else {
    out.push(...dxfRect(P, xMed-16, pY-10, 32, 20))
    out.push(...dxfText(P, xMed, pY+1, 3.5, 'M', 1, 2))
  }
  out.push(...dxfText(A, xMed, pY-25, 2.5, 'FE-100', 1, 2))
  out.push(...dxfText(A, xMed, pY-33, 2.5, d.tecnologia_nombre.slice(0,22), 1, 2))

  // válvula de control de presión
  out.push(...isaControlValve(xReg, pY, 7))
  out.push(...dxfText(A, xReg, pY-30, 2.5, 'PCV-100', 1, 2))
  out.push(...dxfText(A, xReg, pY-38, 2, 'REG. PRESION', 1, 2))

  // burbujas ISA — instrumentos colgando ABAJO de la tubería
  const bY = pY - 55
  out.push(...isaBubble('PT', '101', xMed-65, bY, 8, pY - pipeHalfH))
  out.push(...dxfText(A, xMed-65, bY-14, 2, 'TRANS. PRESION', 1, 2))

  out.push(...isaBubble('TT', '101', xMed-35, bY, 8, pY - pipeHalfH))
  out.push(...dxfText(A, xMed-35, bY-14, 2, 'TRANS. TEMPERATURA', 1, 2))

  out.push(...isaBubble('FT', '100', xMed, bY, 8, pY - pipeHalfH))
  out.push(...dxfText(A, xMed, bY-14, 2, 'TRANS. FLUJO', 1, 2))

  out.push(...isaBubble('PT', '102', xReg, bY, 8, pY - pipeHalfH))
  out.push(...dxfText(A, xReg, bY-14, 2, 'TRANS. PRESION BAJA', 1, 2))

  // computador de flujo (cuadrado = función en panel)
  const xFC = xMed + 95
  out.push(...dxfRect('INSTRUMENTOS', xFC-10, bY-10, 20, 20))
  out.push(...dxfLine('INSTRUMENTOS', xFC-10, bY, xFC+10, bY))
  out.push(...dxfText('INSTRUMENTOS', xFC, bY+4, 2.5, 'FQI', 1, 2))
  out.push(...dxfText('INSTRUMENTOS', xFC, bY-6, 2, '100', 1, 2))
  out.push(...dxfText(A, xFC, bY-22, 2.5, 'COMP. FLUJO', 1, 2))
  // bus de señal (línea discontinua)
  out.push(...dxfLine('INSTRUMENTOS', xMed, bY, xFC-10, bY))

  // cotas del tramo de medición
  const xCotaIni = xFilt + 15
  const xCotaFin = xV2 - 8
  out.push(...dimLinear(xCotaIni, pY+pipeHalfH, xCotaFin, pY+pipeHalfH, 18, 'TRAMO MEDICION'))

  // cota del diámetro de tubería
  out.push(...dimLinear(xSal-10, pY-pipeHalfH, xSal-10, pY+pipeHalfH, 20, `DN${d.diametro_pulg}"`, true))

  // título
  out.push(...dxfText(P, x0+W/2, y0+H-5, 5,
    'DIAGRAMA ESQUEMATICO P&ID - ESTACION DE MEDICION DE GAS NATURAL', 1, 3))
  out.push(...dxfText(A, x0+W/2, y0+H-18, 3,
    `${ascii(d.tipo_punto)}  /  ${ascii(d.tecnologia_nombre)}  /  ${d.fiscal ? 'FISCAL' : 'CONTROL INTERNO'}`, 1, 3))

  // notas
  const notas = [
    'NOTAS DE DISENO:',
    `1. Diagrama esquematico segun ISA 5.1. No representa ubicacion fisica.`,
    `2. Tecnologia de medicion: ${d.tecnologia_nombre} (${d.tecnologia_referencia}).`,
    `3. Instrumentacion de referencia normativa AGA / NOM-020-ASEA-2024.`,
    d.fiscal
      ? '4. Punto de transferencia de custodia fiscal — aplica NOM-020-ASEA-2024.'
      : '4. Medicion de control interno — no requiere aprobacion ASEA.',
    `5. Z calculado con AGA 8 DETAIL (ecuacion de estado GERG-2008 simplificada).`,
  ]
  notas.forEach((n, i) => out.push(...dxfText(A, x0+8, y0+85-i*12, 2.5, n)))

  return out
}

// ─── función principal ────────────────────────────────────────────────────────

export function generarDXF(d: DatosDXF): string {
  const W = 841
  const H = 594

  // tag list dinámica según tecnología
  const tech = d.tecnologia_nombre.toLowerCase()
  const feNorma = tech.includes('ultrason') ? 'AGA 9'
    : tech.includes('orificio') ? 'AGA 3 / API 14.3'
    : tech.includes('turbina')  ? 'AGA 7'
    : tech.includes('coriolis') ? 'AGA 11'
    : 'AGA / API'

  const tags: TagEntry[] = [
    { tag:'PT-101', tipo:'Transmisor de presion',      servicio:'Presion entrada',          rango:`0-${Math.ceil(d.presion_kgcm2*1.25)} kg/cm2`, norma:'ANSI/ISA 51.1' },
    { tag:'TT-101', tipo:'Transmisor de temperatura',  servicio:'Temperatura entrada',      rango:'-20 a +60 C',     norma:'ISA TR20.00.01' },
    { tag:'FE-100', tipo:`Elem. primario (${ascii(d.tecnologia_nombre).slice(0,12)})`, servicio:'Medicion de caudal', rango:`${d.qmin}-${d.qmax} m3/h`, norma:feNorma },
    { tag:'FT-100', tipo:'Transmisor de flujo',        servicio:'Seal de elemento primario',rango:`${d.qmin}-${d.qmax} m3/h`, norma:feNorma },
    { tag:'PCV-100',tipo:'Valvula reguladora presion', servicio:'Control presion salida',   rango:`0-${d.presion_kgcm2} kg/cm2`, norma:'ANSI B16.34' },
    { tag:'PT-102', tipo:'Transmisor de presion',      servicio:'Presion salida / baja',    rango:`0-${Math.ceil(d.presion_kgcm2*0.6)} kg/cm2`, norma:'ANSI/ISA 51.1' },
    { tag:'FQI-100',tipo:'Computador de flujo',        servicio:'Calculo volumetrico/masa', rango:'N/D',             norma:'AGA 7/9/11 + AGA 8' },
    { tag:'SEP-100',tipo:'Separador / filtro',         servicio:'Remocion particulas/liq.', rango:`DN${d.diametro_pulg}" / ASME`, norma:'ASME VIII' },
  ]

  const allRecs: Rec[] = [
    ...makeHeader(W, H),
    ...makeTables(),
    r(0,'SECTION'), r(2,'ENTITIES'),
    ...dxfRect('BORDE', 5, 5, 831, 584),           // 5→836, 5→589
    ...makeCajetin(d, 641, 195, 584, 5),            // x=641→836, y=5→589
    ...dxfLine('BORDE', 641, 5, 641, 589),          // línea divisoria cajetín/plano
    ...makeTagList(tags,  10, 10,  626, 110),
    ...makeTabla(d,       10, 125, 626, 100),
    ...makePID(d,         10, 230, 626, 354),
    r(0,'ENDSEC'),
    r(0,'EOF'),
  ]

  return allRecs.flat().join('\r\n') + '\r\n'
}
