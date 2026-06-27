import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toggleItem } from '@/lib/acciones/puesta-en-marcha'

interface Item {
  key: string
  texto: string
  peregrin?: boolean
  href?: string
  nota?: string
}
interface Seccion {
  titulo: string
  color: string
  badge: string
  aplica: boolean
  items: Item[]
}

function buildSecciones(id: string, esFiscal: boolean, esCityGate: boolean, hojasAprobadas: number, hojasTotal: number): Seccion[] {
  return [
    {
      titulo: 'Documentación técnica generada por Peregrin',
      color: '#2d8c4e',
      badge: 'PEREGRIN',
      aplica: true,
      items: [
        { key: 'pid',       texto: 'Plano P&ID (borrador, Rev. 0)',             peregrin: true, href: `/api/exportar-dxf?id=${id}` },
        { key: 'reporte',   texto: 'Reporte de ingeniería',                     peregrin: true, href: `/api/exportar-pdf?id=${id}` },
        { key: 'memoria',   texto: 'Memoria de cálculo AGA 8',                  peregrin: true, href: `/api/exportar-memoria?id=${id}` },
        { key: 'hojas',     texto: `Hojas de datos de instrumentos (${hojasAprobadas}/${hojasTotal} aprobadas)`, peregrin: true, href: `/api/exportar-hojas?id=${id}`,
          nota: hojasAprobadas < hojasTotal ? 'Completa todas las hojas antes de presentar a UV' : undefined },
        { key: 'paquete',   texto: 'Paquete completo de ingeniería (PDF unificado)', peregrin: true, href: `/api/exportar-paquete?id=${id}` },
      ],
    },
    {
      titulo: 'Unidad de Verificación (UV)',
      color: '#4a9ebb',
      badge: 'UV',
      aplica: esFiscal,
      items: [
        { key: 'uv_pid',        texto: 'Plano P&ID aprobado y firmado por DRO',                       nota: 'Peregrin genera el borrador; firma la UV o el DRO responsable' },
        { key: 'uv_cal_med',    texto: 'Certificado de calibración del medidor primario (vigente)',    nota: 'Emitido por laboratorio acreditado EMA — trazabilidad CENAM' },
        { key: 'uv_cal_fc',     texto: 'Certificado de calibración del computador de flujo (FC)' },
        { key: 'uv_tipo',       texto: 'Certificado de tipo / aprobación del patrón de medición',     nota: 'Requerido por NOM-020-ASEA-2024 art. 18' },
        { key: 'uv_fat',        texto: 'Protocolo de pruebas FAT (Factory Acceptance Test)' },
        { key: 'uv_sat',        texto: 'Protocolo de pruebas SAT (Site Acceptance Test)' },
        { key: 'uv_dictamen',   texto: 'Dictamen de verificación emitido por la UV',                  nota: 'Solo la UV acreditada puede emitir este documento — Peregrin NO lo genera' },
      ],
    },
    {
      titulo: 'ASEA — Agencia de Seguridad, Energía y Ambiente',
      color: '#c17f24',
      badge: 'ASEA',
      aplica: esFiscal || esCityGate,
      items: [
        { key: 'asea_registro', texto: 'Registro de instalación de infraestructura de gas ante ASEA', nota: 'Portal SIAR — requiere RFC del operador' },
        { key: 'asea_riesgo',   texto: 'Análisis de riesgo (si capacidad > umbral NOM-020)' },
        { key: 'asea_pre',      texto: 'Plan de Respuesta a Emergencias (PRE)' },
        { key: 'asea_derechos', texto: 'Comprobante de pago de derechos (Art. 2 LFD)' },
      ],
    },
    {
      titulo: 'CENAGAS — Interconexión SISTRANGAS',
      color: '#b84030',
      badge: 'CENAGAS',
      aplica: esCityGate,
      items: [
        { key: 'cen_contrato',  texto: 'Contrato de interconexión vigente con CENAGAS' },
        { key: 'cen_specs',     texto: 'Especificaciones técnicas del punto aprobadas por CENAGAS',   nota: 'Incluye calidad mínima del gas (PCS, H₂S, CO₂, presión de rocío)' },
        { key: 'cen_pap',       texto: 'Protocolo de Aceptación del Punto (PAP) firmado' },
        { key: 'cen_traz',      texto: 'Certificado de trazabilidad metrológica del sistema de medición' },
        { key: 'cen_herm',      texto: 'Prueba de hermeticidad documentada (≥ 1.5× presión de operación)' },
        { key: 'cen_scada',     texto: 'Integración al sistema SCADA de CENAGAS',                     nota: 'Protocolo Modbus TCP o DNP3 — coordinar con CENAGAS' },
      ],
    },
  ]
}

export default async function PuestaEnMarchaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proyecto }, { data: f1 }, { data: hojas }, { data: checks }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('hojas_datos').select('estado').eq('proyecto_id', id),
    supabase.from('puesta_en_marcha').select('item_key,completado').eq('proyecto_id', id),
  ])

  if (!proyecto) notFound()

  const esFiscal   = !!f1?.fiscal
  const esCityGate = proyecto.tipo_punto === 'city_gate'
  const hojasAprobadas = (hojas ?? []).filter(h => h.estado === 'aprobado').length
  const hojasTotal     = hojas?.length ?? 0

  const checkMap = new Map((checks ?? []).map(c => [c.item_key, c.completado]))

  const secciones = buildSecciones(id, esFiscal, esCityGate, hojasAprobadas, hojasTotal)
  const seccionesActivas = secciones.filter(s => s.aplica)

  const totalItems = seccionesActivas.flatMap(s => s.items).length
  const completados = seccionesActivas.flatMap(s => s.items).filter(i => checkMap.get(i.key)).length
  const pct = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0

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

      {/* encabezado + progreso */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>Puesta en marcha</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--ink3)' }}>
            {proyecto.nombre}
            {esFiscal && ' · Custodia fiscal'}
            {esCityGate && ' · City Gate SISTRANGAS/CENAGAS'}
            {' — '}NOM-020-ASEA-2024
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold font-mono" style={{ color: pct === 100 ? '#2d8c4e' : 'var(--accent)' }}>
            {pct}%
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink3)' }}>
            {completados} / {totalItems} ítems
          </div>
          <div className="mt-2 h-1.5 w-28 rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct === 100 ? '#2d8c4e' : 'var(--accent)' }} />
          </div>
        </div>
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
        {seccionesActivas.map(sec => {
          const itemsDone = sec.items.filter(i => checkMap.get(i.key)).length
          return (
            <div key={sec.titulo} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>

              {/* header sección */}
              <div className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: `${sec.color}18`, color: sec.color, border: `1px solid ${sec.color}40` }}>
                    {sec.badge}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{sec.titulo}</span>
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: itemsDone === sec.items.length ? '#2d8c4e' : 'var(--ink3)' }}>
                  {itemsDone}/{sec.items.length}
                </span>
              </div>

              {/* items */}
              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {sec.items.map(item => {
                  const done = !!checkMap.get(item.key)
                  return (
                    <div key={item.key} className="flex items-start gap-3 px-4 py-3">
                      <form action={toggleItem.bind(null, id, item.key, !done)}>
                        <button type="submit"
                          className="mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: done ? sec.color : 'var(--line)',
                            background: done ? `${sec.color}20` : 'var(--panel)',
                            cursor: 'pointer',
                          }}>
                          {done && <span style={{ color: sec.color, fontSize: 10, lineHeight: 1 }}>✓</span>}
                        </button>
                      </form>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm" style={{ color: done ? 'var(--ink3)' : 'var(--ink2)', textDecoration: done ? 'line-through' : 'none' }}>
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
                          <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--ink3)' }}>{item.nota}</p>
                        )}
                        {item.href && (
                          <a href={item.href} download className="inline-block text-[10.5px] mt-1 hover:underline" style={{ color: 'var(--accent)' }}>
                            Descargar ↓
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[10.5px] mt-5" style={{ color: 'var(--ink3)' }}>
        Requisitos para {esCityGate ? 'city gate SISTRANGAS' : proyecto.tipo_punto}
        {esFiscal ? ' con custodia fiscal' : ''} según NOM-020-ASEA-2024 y RMF Anexo 21.
      </p>
    </div>
  )
}
