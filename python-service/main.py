"""
Peregrinus — Servicio de cálculo AGA 8 DETAIL
Requiere: pip install fastapi uvicorn pyaga8

Despliegue recomendado: Railway.app
  - Procfile: web: uvicorn main:app --host 0.0.0.0 --port $PORT
  - Variable de entorno en Next.js: AGA8_SERVICE_URL=https://<tu-servicio>.railway.app
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
import io
import pyaga8
from dxf_generator import crear_dxf, DatosDXF

app = FastAPI(title="Peregrinus AGA8 Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ─── SG aire = 1 (base)
# Pesos moleculares de componentes AGA8 (g/mol)
_MW = {
    "methane": 16.0430, "nitrogen": 28.0134, "co2": 44.0100,
    "ethane": 30.0700, "propane": 44.0970, "isobutane": 58.1230,
    "n_butane": 58.1230, "isopentane": 72.1500, "n_pentane": 72.1500,
    "n_hexane": 86.1770, "n_heptane": 100.204, "n_octane": 114.231,
    "n_nonane": 128.258, "n_decane": 142.285,
    "hydrogen": 2.01588, "oxygen": 31.9988, "co": 28.0101,
    "water": 18.0153, "h2s": 34.0819, "helium": 4.00260, "argon": 39.9480,
}
MW_AIR = 28.9625  # g/mol


class AGA8Input(BaseModel):
    presion_kpa: float = Field(..., gt=0, description="Presión absoluta en kPa")
    temperatura_k: float = Field(..., gt=0, description="Temperatura en Kelvin")
    sg: float = Field(..., gt=0.4, lt=1.2, description="Gravedad específica (aire=1)")
    co2_pct: float = Field(0.0, ge=0, le=30, description="CO₂ en % mol")
    n2_pct: float = Field(0.0, ge=0, le=30, description="N₂ en % mol")


class AGA8Output(BaseModel):
    z: float
    densidad_kgm3: float
    metodo: str
    composicion: dict


def composicion_desde_sg(sg: float, co2_pct: float, n2_pct: float):
    """
    Aproxima la composición de gas natural a partir de SG, CO2 y N2.
    Retorna (Composition, dict_fracciones).
    """
    co2 = co2_pct / 100.0
    n2 = n2_pct / 100.0
    remainder = max(0.0, 1.0 - co2 - n2)

    sg_c1 = _MW["methane"] / MW_AIR
    sg_c2 = _MW["ethane"] / MW_AIR
    sg_co2 = _MW["co2"] / MW_AIR
    sg_n2 = _MW["nitrogen"] / MW_AIR

    sg_adj = sg - sg_co2 * co2 - sg_n2 * n2
    denom = sg_c1 - sg_c2
    x_c1 = (sg_adj - sg_c2 * remainder) / denom if abs(denom) > 1e-9 else remainder
    x_c1 = max(0.0, min(remainder, x_c1))
    x_c2 = remainder - x_c1

    fracs = {"methane": x_c1, "nitrogen": n2, "carbon_dioxide": co2, "ethane": x_c2}

    comp = pyaga8.Composition()
    comp.methane = x_c1
    comp.nitrogen = n2
    comp.carbon_dioxide = co2
    comp.ethane = x_c2
    return comp, fracs


@app.post("/aga8", response_model=AGA8Output)
async def calcular_aga8(inp: AGA8Input):
    comp = composicion_desde_sg(inp.sg, inp.co2_pct, inp.n2_pct)

    try:
        comp, fracs = composicion_desde_sg(inp.sg, inp.co2_pct, inp.n2_pct)
        detail = pyaga8.Detail()
        detail.set_composition(comp)
        detail.temperature = inp.temperatura_k
        detail.pressure = inp.presion_kpa
        detail.calc_density()
        detail.calc_properties()

        z = detail.z
        mw_mix = (fracs["methane"] * _MW["methane"] + fracs["nitrogen"] * _MW["nitrogen"] +
                  fracs["carbon_dioxide"] * _MW["co2"] + fracs["ethane"] * _MW["ethane"])
        densidad_kgm3 = detail.d * mw_mix

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error en pyaga8: {exc}")

    composicion_out = {k: round(v, 6) for k, v in fracs.items() if v > 0}

    return AGA8Output(
        z=round(z, 6),
        densidad_kgm3=round(densidad_kgm3, 4),
        metodo="AGA8-DETAIL",
        composicion=composicion_out,
    )


class DXFInput(BaseModel):
    nombre: str
    cliente: str = ""
    tipo_punto: str = ""
    tecnologia_nombre: str = ""
    tecnologia_referencia: str = ""
    fiscal: bool = False
    qmin: float = 0
    qnorm: float = 0
    qmax: float = 0
    presion_kgcm2: float = 0
    diametro_pulg: float = 2.0
    sg: Optional[float] = None
    co2_pct: Optional[float] = None
    n2_pct: Optional[float] = None
    fecha: str = ""
    revision: str = "0"


@app.post("/dxf")
async def generar_dxf(inp: DXFInput):
    try:
        datos = DatosDXF(**inp.model_dump())
        dxf_bytes = crear_dxf(datos)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error generando DXF: {exc}")

    slug = inp.nombre.lower().replace(" ", "-")[:30]
    filename = f"peregrin-{slug}-r{inp.revision}.dxf"

    return StreamingResponse(
        io.BytesIO(dxf_bytes),
        media_type="application/dxf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/pid-svg")
async def generar_pid_svg(inp: DXFInput):
    """Exporta el P&ID como SVG usando ezdxf SVGBackend (sin matplotlib)."""
    try:
        import ezdxf
        from ezdxf.addons.drawing import RenderContext, Frontend
        from ezdxf.addons.drawing.svg import SVGBackend
        from ezdxf.addons.drawing.layout import Page

        datos = DatosDXF(**inp.model_dump())
        dxf_bytes = crear_dxf(datos)

        stream = io.StringIO(dxf_bytes.decode("utf-8"))
        doc = ezdxf.read(stream)

        import re
        from ezdxf.addons.drawing.properties import LayoutProperties
        ctx = RenderContext(doc)
        msp = doc.modelspace()
        layout_props = LayoutProperties.from_layout(msp)
        layout_props.set_colors(bg='#ffffff')
        backend = SVGBackend()
        Frontend(ctx, backend).draw_layout(msp, layout_properties=layout_props)
        page = Page(0, 0)
        svg_string = backend.get_string(page)

        # Convertir todos los colores a negro (excepto blanco y none)
        svg_string = re.sub(r'stroke:\s*#(?![Ff]{6})[0-9a-fA-F]{3,6}', 'stroke: #000000', svg_string)
        svg_string = re.sub(r'fill:\s*#(?![Ff]{6})[0-9a-fA-F]{3,6}', 'fill: #000000', svg_string)
        svg_string = re.sub(r'color:\s*#(?![Ff]{6})[0-9a-fA-F]{3,6}', 'color: #000000', svg_string)
        svg_string = re.sub(r'stroke="(?!none|white|#[Ff]{6})#[0-9a-fA-F]{3,6}"', 'stroke="#000000"', svg_string)
        svg_string = re.sub(r'fill="(?!none|white|#[Ff]{6})#[0-9a-fA-F]{3,6}"', 'fill="#000000"', svg_string)

        # Expandir viewBox 8% para evitar recorte de texto en bordes
        vb_match = re.search(r'viewBox="([^"]+)"', svg_string)
        if vb_match:
            vx, vy, vw, vh = map(float, vb_match.group(1).split())
            pad_x, pad_y = vw * 0.08, vh * 0.08
            new_vb = f"{vx - pad_x} {vy - pad_y} {vw + 2*pad_x} {vh + 2*pad_y}"
            svg_string = svg_string.replace(vb_match.group(0), f'viewBox="{new_vb}"')

    except Exception as exc:
        import traceback
        print(f"ERROR /pid-svg: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generando SVG del P&ID: {exc}")

    return StreamingResponse(
        io.BytesIO(svg_string.encode("utf-8")),
        media_type="image/svg+xml",
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "peregrinus-aga8"}
