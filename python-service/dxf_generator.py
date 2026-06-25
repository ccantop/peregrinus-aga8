"""
Generador DXF R2010 con ezdxf — simbología ISA 5.1 real.
Formato A1 horizontal (841 x 594 mm).
"""

import ezdxf
from ezdxf.enums import TextEntityAlignment
import io
from dataclasses import dataclass
from typing import Optional

# ─── colores DXF ──────────────────────────────────────────────────────────────
BLUE   = 5
YELLOW = 2
GREEN  = 3
GRAY   = 8
RED    = 1
WHITE  = 7
CYAN   = 4

# ─── datos de entrada ─────────────────────────────────────────────────────────

@dataclass
class DatosDXF:
    nombre: str
    cliente: str
    tipo_punto: str
    tecnologia_nombre: str
    tecnologia_referencia: str
    fiscal: bool
    qmin: float
    qnorm: float
    qmax: float
    presion_kgcm2: float
    diametro_pulg: float
    sg: Optional[float] = None
    co2_pct: Optional[float] = None
    n2_pct: Optional[float] = None
    fecha: str = ""
    revision: str = "0"


# ─── helpers ──────────────────────────────────────────────────────────────────

def _txt(msp, x, y, texto, h=3.0, layer="ANOTACIONES", halign="LEFT"):
    """Agrega texto con alineación."""
    align_map = {
        "LEFT":   TextEntityAlignment.LEFT,
        "CENTER": TextEntityAlignment.MIDDLE_CENTER,
        "RIGHT":  TextEntityAlignment.MIDDLE_RIGHT,
    }
    attribs = {"layer": layer, "height": h}
    t = msp.add_text(str(texto)[:60], dxfattribs=attribs)
    t.set_placement((x, y), align=align_map.get(halign, TextEntityAlignment.LEFT))
    return t


def _rect(msp, x, y, w, h, layer="DATOS"):
    msp.add_line((x, y),     (x+w, y),   dxfattribs={"layer": layer})
    msp.add_line((x+w, y),   (x+w, y+h), dxfattribs={"layer": layer})
    msp.add_line((x+w, y+h), (x, y+h),   dxfattribs={"layer": layer})
    msp.add_line((x, y+h),   (x, y),     dxfattribs={"layer": layer})


# ─── bloques ISA 5.1 ──────────────────────────────────────────────────────────

def _crear_bloques(doc):
    """Crea bloques reutilizables de simbología ISA 5.1."""

    # Válvula de compuerta (isolación) — dos triángulos vértices al centro
    b = doc.blocks.new("ISA_GATE_VALVE")
    b.add_line((-7, -7), (0, 0))
    b.add_line((-7,  7), (0, 0))
    b.add_line((-7, -7), (-7, 7))
    b.add_line(( 7, -7), (0, 0))
    b.add_line(( 7,  7), (0, 0))
    b.add_line(( 7, -7), ( 7, 7))

    # Válvula de control (globo) — bowtie + vástago + actuador
    b = doc.blocks.new("ISA_CONTROL_VALVE")
    b.add_line((-7, -7), (0, 0))
    b.add_line((-7,  7), (0, 0))
    b.add_line((-7, -7), (-7, 7))
    b.add_line(( 7, -7), (0, 0))
    b.add_line(( 7,  7), (0, 0))
    b.add_line(( 7, -7), ( 7, 7))
    b.add_line((0, 0), (0, 13))     # vástago
    b.add_circle((0, 17), 4)        # actuador
    t = b.add_text("A", dxfattribs={"height": 3, "layer": "0"})
    t.set_placement((0, 16), align=TextEntityAlignment.MIDDLE_CENTER)

    # Placa de orificio — dos líneas paralelas
    b = doc.blocks.new("ISA_ORIFICE")
    b.add_line((-2, -10), (-2, 10))
    b.add_line(( 2, -10), ( 2, 10))

    # Filtro / separador — rectángulo con aspa
    b = doc.blocks.new("ISA_STRAINER")
    b.add_line((-14, -8), ( 14, -8))
    b.add_line(( 14, -8), ( 14,  8))
    b.add_line(( 14,  8), (-14,  8))
    b.add_line((-14,  8), (-14, -8))
    b.add_line((-14, -8), (14,  8))
    b.add_line((-14,  8), (14, -8))

    # Medidor ultrasónico — rectángulo con transductores diagonales
    b = doc.blocks.new("ISA_ULTRASONIC")
    b.add_line((-16, -10), ( 16, -10))
    b.add_line(( 16, -10), ( 16,  10))
    b.add_line(( 16,  10), (-16,  10))
    b.add_line((-16,  10), (-16, -10))
    b.add_line((-12,  -8), ( 4,   8))
    b.add_line((-4,   -8), ( 12,  8))
    t = b.add_text("US", dxfattribs={"height": 5, "layer": "0"})
    t.set_placement((0, 0), align=TextEntityAlignment.MIDDLE_CENTER)

    # Medidor de turbina — círculo con aspas internas
    b = doc.blocks.new("ISA_TURBINE")
    b.add_circle((0, 0), 11)
    b.add_arc((0, 0), 6, 45, 135)
    b.add_arc((0, 0), 6, 225, 315)
    b.add_line((-11, 0), (11, 0))
    t = b.add_text("T", dxfattribs={"height": 5, "layer": "0"})
    t.set_placement((0, -1), align=TextEntityAlignment.MIDDLE_CENTER)

    # Medidor Coriolis — figura 8 (dos círculos)
    b = doc.blocks.new("ISA_CORIOLIS")
    b.add_circle((0, 5), 5)
    b.add_circle((0, -5), 5)
    t = b.add_text("CO", dxfattribs={"height": 3.5, "layer": "0"})
    t.set_placement((0, 0), align=TextEntityAlignment.MIDDLE_CENTER)

    # Burbuja de instrumento ISA — círculo + línea divisoria horizontal
    b = doc.blocks.new("ISA_BUBBLE")
    b.add_circle((0, 0), 8)
    b.add_line((-8, 0), (8, 0))
    # Atributos de texto (tag superior e inferior)
    b.add_attdef("TAG_TOP", (0, 3.5), dxfattribs={
        "height": 2.5, "tag": "TAG_TOP", "prompt": "Tag superior",
    }).set_placement((0, 3.5), align=TextEntityAlignment.MIDDLE_CENTER)
    b.add_attdef("TAG_BOT", (0, -3), dxfattribs={
        "height": 2, "tag": "TAG_BOT", "prompt": "Tag inferior",
    }).set_placement((0, -3), align=TextEntityAlignment.MIDDLE_CENTER)


# ─── cajetín de título ────────────────────────────────────────────────────────

def _cajetin(msp, d: DatosDXF, x0=641, W=195, y0=5, H=584):
    """Genera el cajetín de título (franja derecha)."""
    T  = "TITULO"
    A  = "ANOTACIONES"
    cx = x0 + W / 2

    _rect(msp, x0, y0, W, H, T)

    # Secciones de abajo hacia arriba [altura]
    secs = [55, 65, 30, 30, 30, 50, 40, 40, 40, 50, 40, 40, 40, 34]
    sec_y = []
    acc = y0
    for h in secs:
        sec_y.append(acc)
        acc += h

    # Separadores
    for y in sec_y[1:]:
        msp.add_line((x0, y), (x0 + W, y), dxfattribs={"layer": T})

    def sec(idx, label, valor, valH=3.5, extra=None):
        y  = sec_y[idx]
        h  = secs[idx]
        _txt(msp, x0+5, y+h-6,  label, 2.5, A)
        _txt(msp, x0+5, y+h-18, str(valor)[:34], valH, T)
        if extra:
            _txt(msp, x0+5, y+h-30, str(extra)[:38], 2.5, A)

    # 13: logo
    _txt(msp, cx, sec_y[13] + secs[13]/2 - 3, "PEREGRIN", 7, T, "CENTER")

    # 12–0: campos
    sec(12, "PROYECTO",              d.nombre.upper()[:34])
    sec(11, "CLIENTE",               (d.cliente or "SIN CLIENTE")[:34])
    sec(10, "TIPO DE PUNTO",         d.tipo_punto[:34], 3)
    sec( 9, "TECNOLOGIA DE MEDICION",d.tecnologia_nombre[:34], 3,
             f"Ref: {d.tecnologia_referencia or 'N/D'}")
    sec( 8, "NORMA PRINCIPAL",       "NOM-020-ASEA-2024", 3.5)
    sec( 7, "CUSTODIA FISCAL",       "SI" if d.fiscal else "NO", 5)
    sec( 6, "NUM. DE PLANO",         "PER-PID-001", 3)
    sec( 5, "REVISION",              d.revision or "0", 6)
    sec( 4, "FECHA",                 d.fecha, 3)
    sec( 3, "ESCALA",                "SIN ESCALA", 3)
    sec( 2, "FORMATO",               "A1 HORIZONTAL", 3)

    # 1: firmas
    yF = sec_y[1]
    hF = secs[1]
    fW = W / 3
    msp.add_line((x0+fW,   yF), (x0+fW,   yF+hF), dxfattribs={"layer": T})
    msp.add_line((x0+fW*2, yF), (x0+fW*2, yF+hF), dxfattribs={"layer": T})
    for i, rol in enumerate(["ELABORO", "REVISO", "AUTORIZO"]):
        fx = x0 + fW * i + fW / 2
        _txt(msp, fx, yF+hF-6,  rol,              2.5, A, "CENTER")
        msp.add_line((x0+fW*i+5, yF+20), (x0+fW*(i+1)-5, yF+20), dxfattribs={"layer": A})
        _txt(msp, fx, yF+12, "Nombre / Cedula", 2, A, "CENTER")

    # 0: nota al pie
    for i, linea in enumerate([
        "BORRADOR - NO VALIDO PARA CONSTRUCCION",
        "Requiere firma de ing. responsable.",
        "No emite dictamen de UV.",
        f"PEREGRIN Prototipo / {d.fecha}",
    ]):
        _txt(msp, x0+5, sec_y[0] + 46 - i*10, linea, 2, A)


# ─── tabla de instrumentos ────────────────────────────────────────────────────

def _tag_list(msp, d: DatosDXF, x0=10, y0=10, W=626, H=110):
    L = "TAGLIST"
    A = "ANOTACIONES"

    _rect(msp, x0, y0, W, H, L)
    msp.add_line((x0, y0+H-12), (x0+W, y0+H-12), dxfattribs={"layer": L})
    _txt(msp, x0+5, y0+H-9, "LISTA DE INSTRUMENTOS (TAG LIST)", 4, L)

    tech = d.tecnologia_nombre.lower()
    fe_norma = (
        "AGA 9"         if "ultrason" in tech else
        "AGA 3/API 14.3"if "orificio" in tech else
        "AGA 7"         if "turbina"  in tech else
        "AGA 11"        if "coriolis" in tech else
        "AGA/API"
    )
    p_max = round(d.presion_kgcm2 * 1.25)
    p_sal = round(d.presion_kgcm2 * 0.6)

    tags = [
        ("PT-101",  "Transmisor presion",    "Presion entrada",         f"0-{p_max} kg/cm2",       "ANSI/ISA 51.1"),
        ("TT-101",  "Transmisor temperatura","Temperatura entrada",      "-20 a +60 C",             "ISA TR20.00.01"),
        ("FE-100",  f"Elem.primario ({d.tecnologia_nombre[:10]})", "Medicion caudal", f"{d.qmin}-{d.qmax} m3/h", fe_norma),
        ("FT-100",  "Transmisor flujo",      "Seal elemento primario",  f"{d.qmin}-{d.qmax} m3/h", fe_norma),
        ("PCV-100", "Valvula reg. presion",  "Control presion salida",  f"0-{d.presion_kgcm2} kg/cm2", "ANSI B16.34"),
        ("PT-102",  "Transmisor presion",    "Presion salida/baja",     f"0-{p_sal} kg/cm2",       "ANSI/ISA 51.1"),
        ("FQI-100", "Computador de flujo",   "Calculo volumetrico",     "N/D",                     "AGA 8 DETAIL"),
        ("SEP-100", "Separador/filtro",      "Remocion particulas",     f"DN{d.diametro_pulg} ASME","ASME VIII"),
    ]

    cols = [0.10, 0.20, 0.30, 0.25, 0.15]  # fracciones de W
    x_cols = [x0]
    for c in cols:
        x_cols.append(x_cols[-1] + c * W)

    for cx in x_cols[1:-1]:
        msp.add_line((cx, y0), (cx, y0+H-12), dxfattribs={"layer": L})

    row_h = 10
    header_y = y0 + H - 12 - row_h
    msp.add_line((x0, header_y), (x0+W, header_y), dxfattribs={"layer": L})

    for i, hdr in enumerate(["TAG", "TIPO", "SERVICIO", "RANGO/ESCALA", "NORMA"]):
        _txt(msp, x_cols[i]+2, header_y+3, hdr, 3, L)

    for row, tag in enumerate(tags):
        ry = header_y - row_h * (row + 1)
        if ry < y0:
            break
        msp.add_line((x0, ry+row_h), (x0+W, ry+row_h), dxfattribs={"layer": A})
        for i, val in enumerate(tag):
            _txt(msp, x_cols[i]+2, ry+2, str(val)[:30], 2.5, A)


# ─── tabla de condiciones de proceso ─────────────────────────────────────────

def _tabla_condiciones(msp, d: DatosDXF, x0=10, y0=125, W=626, H=100):
    L = "DATOS"
    A = "ANOTACIONES"

    _rect(msp, x0, y0, W, H, L)
    msp.add_line((x0, y0+H-12), (x0+W, y0+H-12), dxfattribs={"layer": L})
    _txt(msp, x0+5, y0+H-9, "CONDICIONES DE DISENO Y PROCESO", 4, L)

    cW  = W / 4
    p_kpa = round(d.presion_kgcm2 * 98.0665)
    dn_mm = round(d.diametro_pulg * 25.4)
    td    = d.qmax / max(d.qmin, 0.01)

    rows = [
        ("Qmin",            f"{d.qmin} m3/h",             "Presion operacion",    f"{d.presion_kgcm2} kg/cm2 ({p_kpa} kPa)"),
        ("Qnorm",           f"{d.qnorm} m3/h",            "Diametro nominal",     f'{d.diametro_pulg}" (DN{dn_mm} mm)'),
        ("Qmax",            f"{d.qmax} m3/h",             "Grav. especifica (SG)",str(d.sg) if d.sg else "N/D"),
        ("Turndown",        f"{td:.1f}:1",                "CO2 / N2 (% mol)",    f"{d.co2_pct or 'N/D'} / {d.n2_pct or 'N/D'}"),
    ]

    for cx in [cW, cW*2, cW*3]:
        msp.add_line((x0+cx, y0), (x0+cx, y0+H-12), dxfattribs={"layer": L})

    for i, row in enumerate(rows):
        ry = y0 + H - 24 - i * 14
        if i > 0:
            msp.add_line((x0, ry+14), (x0+W, ry+14), dxfattribs={"layer": A})
        _txt(msp, x0+cW*0+3, ry+3, row[0], 2.5, A)
        _txt(msp, x0+cW*1-3, ry+3, row[1], 2.5, L, "RIGHT")
        _txt(msp, x0+cW*2+3, ry+3, row[2], 2.5, A)
        _txt(msp, x0+cW*4-3, ry+3, row[3], 2.5, L, "RIGHT")


# ─── diagrama P&ID ────────────────────────────────────────────────────────────

def _pid(msp, d: DatosDXF, x0=10, y0=230, W=626, H=354):
    P = "PROCESO"
    V = "VALVULAS"
    I = "INSTRUMENTOS"
    A = "ANOTACIONES"

    pY = y0 + H * 0.50
    pipe_r = min(max(d.diametro_pulg * 0.5, 2), 6)

    # Posiciones X
    xEnt  = x0 + 25
    xV1   = x0 + 80
    xFilt = x0 + 145
    xMed  = x0 + 245
    xV2   = x0 + 345
    xReg  = x0 + 435
    xV3   = x0 + 510
    xSal  = x0 + W - 20

    # Tubería doble línea
    segs = [
        (xEnt, xV1-8), (xV1+8, xFilt-16), (xFilt+16, xMed-17),
        (xMed+17, xV2-8), (xV2+8, xReg-16), (xReg+16, xV3-8),
        (xV3+8, xSal),
    ]
    for x1, x2 in segs:
        msp.add_line((x1, pY+pipe_r), (x2, pY+pipe_r), dxfattribs={"layer": P})
        msp.add_line((x1, pY-pipe_r), (x2, pY-pipe_r), dxfattribs={"layer": P})

    # Flechas de flujo
    for xa in [xEnt+30, xMed+60, xV3+28]:
        msp.add_line((xa-6, pY+4), (xa, pY), dxfattribs={"layer": P})
        msp.add_line((xa-6, pY-4), (xa, pY), dxfattribs={"layer": P})
        msp.add_line((xa-6, pY-4), (xa-6, pY+4), dxfattribs={"layer": P})

    # Etiquetas
    _txt(msp, xEnt-5, pY+pipe_r+7, "ENTRADA", 3, A)
    _txt(msp, xSal+3, pY+pipe_r+7, "SALIDA",  3, A)
    _txt(msp, xEnt,   pY-pipe_r-12, f'DN{d.diametro_pulg}" / {d.presion_kgcm2} kg/cm2', 2.5, A)

    # Válvulas de aislamiento
    for xv, tag in [(xV1,"V-100"), (xV2,"V-101"), (xV3,"V-102")]:
        msp.add_blockref("ISA_GATE_VALVE", (xv, pY), dxfattribs={"layer": V, "xscale": 1, "yscale": 1})
        _txt(msp, xv, pY+20, tag, 2.5, A, "CENTER")

    # Filtro / separador
    msp.add_blockref("ISA_STRAINER", (xFilt, pY), dxfattribs={"layer": V})
    _txt(msp, xFilt, pY+20, "SEP-100",         2.5, A, "CENTER")
    _txt(msp, xFilt, pY+28, "SEPARADOR/FILTRO", 2,  A, "CENTER")

    # Medidor — bloque según tecnología
    tech = d.tecnologia_nombre.lower()
    bloque_med = (
        "ISA_ULTRASONIC" if "ultrason" in tech else
        "ISA_TURBINE"    if "turbina"  in tech else
        "ISA_CORIOLIS"   if "coriolis" in tech else
        "ISA_ORIFICE"    if "orificio" in tech else
        "ISA_TURBINE"
    )
    msp.add_blockref(bloque_med, (xMed, pY), dxfattribs={"layer": P})
    _txt(msp, xMed, pY+28, "FE-100",                       2.5, A, "CENTER")
    _txt(msp, xMed, pY+36, d.tecnologia_nombre[:22],        2.5, A, "CENTER")

    # Válvula de control de presión
    msp.add_blockref("ISA_CONTROL_VALVE", (xReg, pY), dxfattribs={"layer": V})
    _txt(msp, xReg, pY+38, "PCV-100",      2.5, A, "CENTER")
    _txt(msp, xReg, pY+46, "REG. PRESION", 2,   A, "CENTER")

    # Burbujas ISA con atributos reales
    bY = pY - 60
    for (tag_t, tag_b, bx, srv) in [
        ("PT", "101", xMed-70, "TRANS.PRESION"),
        ("TT", "101", xMed-38, "TRANS.TEMP"),
        ("FT", "100", xMed,    "TRANS.FLUJO"),
        ("PT", "102", xReg,    "TRANS.P.BAJA"),
    ]:
        ref = msp.add_auto_blockref("ISA_BUBBLE", (bx, bY), {
            "TAG_TOP": tag_t,
            "TAG_BOT": tag_b,
        }, dxfattribs={"layer": I})
        msp.add_line((bx, bY+8), (bx, pY-pipe_r), dxfattribs={"layer": I})
        _txt(msp, bx, bY-16, srv, 2, A, "CENTER")

    # Computador de flujo (cuadrado = función en panel)
    xFC = xMed + 100
    _rect(msp, xFC-10, bY-10, 20, 20, I)
    msp.add_line((xFC-10, bY), (xFC+10, bY), dxfattribs={"layer": I})
    _txt(msp, xFC, bY+3,  "FQI", 2.5, I, "CENTER")
    _txt(msp, xFC, bY-6,  "100", 2,   I, "CENTER")
    msp.add_line((xMed, bY), (xFC-10, bY), dxfattribs={"layer": I})
    _txt(msp, xFC, bY-22, "COMP.FLUJO", 2.5, A, "CENTER")

    # Cotas con ezdxf (dimensiones reales)
    dim_style = "EZDXF"
    # Cota horizontal tramo de medición
    try:
        dim = msp.add_linear_dim(
            base=(xMed, pY + pipe_r + 22),
            p1=(xFilt+16, pY), p2=(xV2-8, pY),
            angle=0, dimstyle=dim_style,
            override={"dimtxt": 2.5, "dimasz": 3}
        )
        dim.render()
        _txt(msp, (xFilt+16+xV2-8)/2, pY+pipe_r+28, "TRAMO MEDICION", 2, "COTAS", "CENTER")
    except Exception:
        pass  # falla silenciosa si dimstyle no existe

    # Título del diagrama
    _txt(msp, x0+W/2, y0+H-5,
         "DIAGRAMA ESQUEMATICO P&ID - ESTACION DE MEDICION DE GAS NATURAL",
         5, P, "CENTER")
    _txt(msp, x0+W/2, y0+H-18,
         f"{d.tipo_punto} / {d.tecnologia_nombre} / {'FISCAL' if d.fiscal else 'CONTROL INTERNO'}",
         3, A, "CENTER")

    # Notas
    notas = [
        "NOTAS DE DISENO:",
        "1. Diagrama esquematico segun ISA 5.1. No representa ubicacion fisica.",
        f"2. Tecnologia: {d.tecnologia_nombre} ({d.tecnologia_referencia}).",
        "3. Instrumentacion de referencia normativa AGA / NOM-020-ASEA-2024.",
        "4. Z calculado con AGA 8 DETAIL (GERG-2008 simplificada).",
        "5. Punto fiscal." if d.fiscal else "5. Medicion de control interno.",
    ]
    for i, n in enumerate(notas):
        _txt(msp, x0+8, y0+90-i*12, n, 2.5, A)


# ─── función principal ────────────────────────────────────────────────────────

def crear_dxf(d: DatosDXF) -> bytes:
    doc = ezdxf.new("R2010")

    # Capas
    for nombre, color in [
        ("BORDE", WHITE), ("TITULO", WHITE), ("PROCESO", BLUE),
        ("VALVULAS", YELLOW), ("INSTRUMENTOS", GREEN),
        ("ANOTACIONES", GRAY), ("DATOS", WHITE),
        ("COTAS", RED), ("TAGLIST", WHITE),
    ]:
        doc.layers.add(nombre, color=color)

    # Estilo de texto
    doc.styles.add("STANDARD", font="txt.shx")

    # Bloques ISA
    _crear_bloques(doc)

    msp = doc.modelspace()

    # Borde del plano
    _rect(msp, 5, 5, 831, 584, "BORDE")
    msp.add_line((641, 5), (641, 589), dxfattribs={"layer": "BORDE"})

    # Contenido
    _cajetin(msp, d)
    _tag_list(msp, d)
    _tabla_condiciones(msp, d)
    _pid(msp, d)

    # Serializar a bytes (ezdxf.write espera stream de texto)
    buf = io.StringIO()
    doc.write(buf)
    return buf.getvalue().encode("utf-8")
