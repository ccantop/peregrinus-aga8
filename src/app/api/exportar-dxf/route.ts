import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarDXF } from '@/lib/dxf/generar-dxf'

const tipoLabel: Record<string, string> = {
  city_gate:  'City Gate SISTRANGAS/CENAGAS',
  industrial: 'Estacion Industrial',
  ducto:      'Ducto Regional',
  auditoria:  'Auditoria / Diagnostico',
}

const AGA8_URL = process.env.AGA8_SERVICE_URL

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = await createClient()
  const [{ data: proyecto }, { data: f1 }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
  ])

  if (!proyecto || !f1) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  const fecha = new Date(proyecto.creado_en).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  const payload = {
    nombre:                proyecto.nombre,
    cliente:               proyecto.cliente ?? '',
    tipo_punto:            tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto,
    tecnologia_nombre:     f1.tecnologia_nombre ?? 'Por definir',
    tecnologia_referencia: f1.tecnologia_referencia ?? '',
    fiscal:                f1.fiscal ?? false,
    qmin:                  Number(f1.qmin),
    qnorm:                 Number(f1.qnorm),
    qmax:                  Number(f1.qmax),
    presion_kgcm2:         Number(f1.presion_kgcm2),
    diametro_pulg:         Number(f1.diametro_pulg),
    sg:                    f1.sg ?? null,
    co2_pct:               f1.co2_pct ?? null,
    n2_pct:                f1.n2_pct ?? null,
    fecha,
    revision:              '0',
  }

  const slug = proyecto.nombre
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)

  const filename = `peregrin-${slug}-r0.dxf`

  // Intentar servicio Python (ezdxf R2010) — fallback a generador JS (R12)
  if (AGA8_URL) {
    try {
      const res = await fetch(`${AGA8_URL}/dxf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      })
      if (res.ok) {
        const buf = await res.arrayBuffer()
        return new NextResponse(buf, {
          headers: {
            'Content-Type': 'application/dxf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-DXF-Engine': 'ezdxf-R2010',
          },
        })
      }
    } catch {
      // servicio Python no disponible — continua con fallback JS
    }
  }

  const dxf = generarDXF(payload)
  return new NextResponse(dxf, {
    headers: {
      'Content-Type': 'application/dxf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-DXF-Engine': 'js-R12',
    },
  })
}
