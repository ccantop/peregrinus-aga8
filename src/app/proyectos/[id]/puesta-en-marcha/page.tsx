import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Item {
  texto: string
  peregrin?: boolean   // Peregrin puede generarlo
  href?: string        // link de descarga si aplica
  nota?: string
}
interface Seccion {
  titulo: string
  color: string
  badge: string
  aplica: boolean
  items: Item[]
}

export default async function PuestaEnMarchaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proyecto }, { data: f1 }, { data: hojas }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('hojas_datos').select('*').eq('proyecto_id', id),
  ])

  if (!proyecto) notFound()

  const esFiscal   = !!f1?.fiscal
  const esCityGate = proyecto.tipo_punto === 'city_gate'
  const esDucto    = proyecto.tipo_punto === 'ducto'
  const hojasAprobadas = (hojas ?? []).filter(h => h.estado === 'aprobado').length
  const hojasTotal     = hojas?.length ?? 0

  const secciones: Seccion[] = [
    {
      titulo: 'Documentación técnica generada por Peregrin',
      color: '#2d8c4e',
      badge: 'PEREGRIN',
      aplica: true,
      items: [
        {
          texto: 'Plano P&ID (borrador, Rev. 0)',
          peregrin: true,
          href: `/api/exportar-dxf?id=${id}`,
        },
        {
          texto: 'Reporte de ingeniería',
          peregrin: true,
          href: `/api/exportar-pdf?id=${id}`,
        },
        {
          texto: 'Memoria de cálculo AGA 8',
          peregrin: true,
          href: `/api/exportar-memoria?id=${id}`,
        },
        {
          texto: `Hojas de datos de instrumentos (${hojasAprobadas}/${hojasTotal} aprobadas)`,
          peregrin: true,
          href: `/api/exportar-hojas?id=${id}`,
          nota: hojasAprobadas < hojasTotal ? 'Completa todas las hojas antes de presentar a UV' : undefined,
        },
        {
          texto: 'Paquete completo de ingeniería (PDF unificado)',
          peregrin: true,
          href: `/api/exportar-paquete?id=${id}`,
        },
      ],
    },
    {
      titulo: 'Unidad de Verificación (UV)',
      color: '#4a9ebb',
      badge: 'UV',
      aplica: esFiscal,
      items: [
        {
          texto: 'Plano P&ID aprobado y firmado por DRO',
          nota: 'Peregrin genera el borrador; firma la UV o el DRO responsable',
        },
        {
          texto: 'Certificado de calibración del medidor primario (vigente)',
          nota: 'Emitido por laboratorio acreditado EMA — trazabilidad CENAM',
        },
        {
          texto: 'Certificado de calibración del computador de flujo (FC)',
        },
        {
          texto: 'Certificado de tipo / aprobación del patrón de medición',
          nota: 'Requerido por NOM-020-ASEA-2024 art. 18',
        },
        {
          texto: 'Protocolo de pruebas FAT (Factory Acceptance Test)',
        },
        {
          texto: 'Protocolo de pruebas SAT (Site Acceptance Test)',
        },
        {
          texto: 'Dictamen de verificación emitido por la UV',
          nota: 'Solo la UV acreditada puede emitir este documento — Peregrin NO lo genera',
        },
      ],
    },
    {
      titulo: 'ASEA — Agencia de Seguridad, Energía y Ambiente',
      color: '#c17f24',
      badge: 'ASEA',
      aplica: esFiscal || esCityGate || esDucto,
      items: [
        {
          texto: 'Registro de instalación de infraestructura de gas ante ASEA',
          nota: 'Portal SIAR — requiere RFC del operador',
        },
        {
          texto: 'Análisis de riesgo (si capacidad > umbral NOM-020)',
        },
        {
          texto: 'Plan de Respuesta a Emergencias (PRE)',
        },
        {
          texto: 'Comprobante de pago de derechos (Art. 2 LFD)',
        },
      ],
    },
    {
      titulo: 'CENAGAS — Interconexión SISTRANGAS',
      color: '#b84030',
      badge: 'CENAGAS',
      aplica: esCityGate,
      items: [
        {
          texto: 'Contrato de interconexión vigente con CENAGAS',
        },
        {
          texto: 'Especificaciones técnicas del punto aprobadas por CENAGAS',
          nota: 'Incluye calidad mínima del gas (PCS, H₂S, CO₂, presión de rocío)',
        },
        {
          texto: 'Protocolo de Aceptación del Punto (PAP) firmado',
        },
        {
          texto: 'Certificado de trazabilidad metrológica del sistema de medición',
        },
        {
          texto: 'Prueba de hermeticidad documentada (≥ 1.5× presión de operación)',
        },
        {
          texto: 'Integración al sistema SCADA de CENAGAS',
          nota: 'Protocolo Modbus TCP o DNP3 — coordinar con CENAGAS',
        },
      ],
    },
  ]

  const seccionesActivas = secciones.filter(s => s.aplica)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-5" style={{ color: 'var(--ink3)' }}>
        <Link href="/proyectos" style={{ color: 'var(--accent)' }} className="hover:underline">Mis proyectos</Link>
        <span>/</span>
        <Link href={`/proyectos/${id}`} style={{ color: 'var(--accent)' }} className="hover:underline">{proyecto.nombre}</Link>
        <span>/</span>
        <span>Puesta en marcha</span>
      </div>

      {/* encabezado */}
      <div className="mb-7">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>
          Puesta en marcha
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--ink3)' }}>
          {proyecto.nombre}
          {esFiscal && ' · Custodia fiscal'}
          {esCityGate && ' · City Gate SISTRANGAS/CENAGAS'}
          {' — '}Requisitos para entrada en operación según NOM-020-ASEA-2024
        </p>
      </div>

      {/* aviso legal */}
      <div className="rounded-md px-4 py-3 mb-6 text-xs"
        style={{ background: 'rgba(184,64,48,0.07)', borderLeft: '3px solid var(--danger)', color: 'var(--ink2)' }}>
        <b style={{ color: 'var(--danger)' }}>Aviso legal:</b> Peregrin genera borradores de ingeniería. El software no emite dictámenes de UV,
        no valida interconexiones CENAGAS, ni certifica trazabilidad metrológica. Todos los documentos deben ser
        revisados y aprobados por profesionales responsables antes de presentarse ante autoridades.
      </div>

      {/* secciones */}
      <div className="space-y-5">
        {seccionesActivas.map(sec => (
          <div key={sec.titulo} className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--line)' }}>

            {/* header sección */}
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                style={{ background: `${sec.color}18`, color: sec.color, border: `1px solid ${sec.color}40` }}>
                {sec.badge}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {sec.titulo}
              </span>
            </div>

            {/* items */}
            <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {sec.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 w-4 h-4 rounded border shrink-0"
                    style={{ borderColor: 'var(--line)', background: 'var(--panel)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm" style={{ color: 'var(--ink2)' }}>
                        {item.texto}
                      </span>
                      {item.peregrin && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(45,140,78,0.10)', color: '#2d8c4e', border: '1px solid rgba(45,140,78,0.25)' }}>
                          PEREGRIN
                        </span>
                      )}
                    </div>
                    {item.nota && (
                      <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--ink3)' }}>
                        {item.nota}
                      </p>
                    )}
                    {item.href && (
                      <a href={item.href} download
                        className="inline-block text-[10.5px] mt-1 hover:underline"
                        style={{ color: 'var(--accent)' }}>
                        Descargar ↓
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10.5px] mt-5" style={{ color: 'var(--ink3)' }}>
        Los requisitos mostrados corresponden a {esCityGate ? 'city gate SISTRANGAS' : proyecto.tipo_punto}
        {esFiscal ? ' con custodia fiscal' : ''} según NOM-020-ASEA-2024 y RMF Anexo 21.
        Verifica con la UV y ASEA los requisitos vigentes al momento de la puesta en marcha.
      </p>
    </div>
  )
}
