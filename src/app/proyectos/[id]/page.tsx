import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ActividadesEditor from '@/components/ActividadesEditor'
import TarjetaAGA3 from '@/components/TarjetaAGA3'
import TarjetaAGA7 from '@/components/TarjetaAGA7'
import TarjetaCoriolis from '@/components/TarjetaCoriolis'
import { calcularAGA3, calcularAGA7, calcularCondicionesFisicas, type ScheduleTuberia } from '@/lib/engine/calculo-z'

const tipoLabel: Record<string, string> = {
  city_gate: 'City Gate (SISTRANGAS/CENAGAS)',
  industrial: 'Estación industrial',
  ducto: 'Ducto regional',
  auditoria: 'Auditoría / diagnóstico',
}

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: proyecto, error },
    { data: f1 },
    { data: acts },
    { data: f2 },
    { data: hojas },
  ] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', id).single(),
    supabase.from('fase1_datos').select('*').eq('proyecto_id', id).single(),
    supabase.from('actividades').select('*').eq('proyecto_id', id).order('etapa').order('nombre'),
    supabase.from('fase2_datos').select('*').eq('proyecto_id', id).maybeSingle(),
    supabase.from('hojas_datos').select('estado').eq('proyecto_id', id),
  ])

  if (error || !proyecto) notFound()

  const Zf_page = f1
    ? calcularCondicionesFisicas({
        sg: Number(f1.sg ?? 0.65), co2_pct: Number(f1.co2_pct ?? 2),
        n2_pct: Number(f1.n2_pct ?? 1), viscosidad_cp: Number(f1.viscosidad_cp ?? 0.012),
        toma_diferencial: (f1.toma_diferencial ?? 'brida') as 'brida' | 'esquina' | 'ddmedio',
        elevacion_msnm: Number(f1.elevacion_msnm ?? 0),
        patm_kpa: Number(f1.presion_kgcm2) * 98.0665 + 101.325,
        tamb_min_c: Number(f1.tamb_min_c ?? 20),
        p_base_kpa: Number(f1.p_base_kpa ?? 101.325), t_base_c: Number(f1.t_base_c ?? 15.6),
        dew_agua_c: Number(f1.dew_agua_c ?? -10), dew_hc_c: Number(f1.dew_hc_c ?? -20),
        dp_regulador_bar: Number(f1.dp_regulador_bar ?? 5),
      }).Z_papay
    : 1

  const aga3 = f1 && (f1.tecnologia_key === 'orificio' || f1.tecnologia_key === 'diafragma')
    ? calcularAGA3(
        Number(f1.qmax), Number(f1.qnorm), Number(f1.qmin),
        Number(f1.presion_kgcm2), Number(f1.tamb_min_c ?? 20),
        Number(f1.sg ?? 0.65), Zf_page,
        Number(f1.diametro_pulg),
        (f1.toma_diferencial ?? 'brida') as 'brida' | 'esquina' | 'ddmedio',
        Number(f1.viscosidad_cp ?? 0.012),
        Number(f1.p_base_kpa ?? 101.325), Number(f1.t_base_c ?? 15.6),
        (f1.schedule_tuberia ?? 'sch40') as ScheduleTuberia,
      )
    : null

  const aga7 = f1 && (f1.tecnologia_key === 'turbina' || f1.tecnologia_key === 'ultrasonico')
    ? calcularAGA7(
        Number(f1.qmin), Number(f1.qnorm), Number(f1.qmax),
        Number(f1.presion_kgcm2), Number(f1.tamb_min_c ?? 20),
        Number(f1.p_base_kpa ?? 101.325), Number(f1.t_base_c ?? 15.6),
        Zf_page,
      )
    : null

  const fecha = new Date(proyecto.creado_en).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-[1260px] mx-auto px-6 py-8">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-5" style={{ color: 'var(--ink3)' }}>
        <Link href="/proyectos" className="hover:underline" style={{ color: 'var(--accent)' }}>
          Mis proyectos
        </Link>
        <span>/</span>
        <span>{proyecto.nombre}</span>
      </div>

      {/* encabezado */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>
              {proyecto.nombre}
            </h1>
            {f1?.fiscal && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ background: 'rgba(74,158,187,0.10)', color: 'var(--accent)', border: '1px solid rgba(74,158,187,0.3)' }}>
                FISCAL
              </span>
            )}
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--ink3)', border: '1px solid var(--line)' }}>
              {proyecto.fase_actual}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--ink3)' }}>
            {proyecto.cliente && <>{proyecto.cliente} · </>}{fecha}
          </p>
        </div>
        {/* Una sola fila — navegación + exportar */}
        <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
          <Link href={`/?proyecto=${proyecto.id}`}
            className="rounded px-2.5 py-1.5 text-[11px] whitespace-nowrap transition-colors hover:bg-[#eef4f7]"
            style={{ border: '1px solid var(--line)', color: 'var(--ink2)' }}>
            Fase 1
          </Link>
          <Link href={`/proyectos/${proyecto.id}/fase2`}
            className="rounded px-2.5 py-1.5 text-[11px] whitespace-nowrap transition-colors hover:bg-[#eef4f7]"
            style={{ border: '1px solid var(--line)', color: 'var(--ink2)' }}>
            Fase 2
          </Link>
          <Link href={`/proyectos/${proyecto.id}/instrumentos`}
            className="rounded px-2.5 py-1.5 text-[11px] whitespace-nowrap transition-colors hover:bg-[#eef4f7]"
            style={{ border: '1px solid var(--line)', color: 'var(--ink2)' }}>
            Instrumentos
          </Link>
          <Link href={`/proyectos/${proyecto.id}/puesta-en-marcha`}
            className="rounded px-2.5 py-1.5 text-[11px] whitespace-nowrap transition-colors hover:bg-[#eef4f7]"
            style={{ border: '1px solid var(--line)', color: 'var(--ink2)' }}>
            Puesta en marcha
          </Link>
          <Link href="/"
            className="rounded px-2.5 py-1.5 text-[11px] whitespace-nowrap transition-colors hover:bg-[#eef4f7]"
            style={{ border: '1px solid var(--line)', color: 'var(--ink2)' }}>
            + Nuevo
          </Link>

          <span className="w-px h-5 mx-0.5 shrink-0" style={{ background: 'var(--line)' }} />

          <a href={`/api/exportar-dxf?id=${proyecto.id}`} download
            className="rounded px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent2)', color: '#ffffff' }}>
            P&ID ↓
          </a>
          <a href={`/api/exportar-pdf?id=${proyecto.id}`} download
            className="rounded px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent2)', color: '#ffffff' }}>
            Reporte ↓
          </a>
          <a href={`/api/exportar-memoria?id=${proyecto.id}`} download
            className="rounded px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent2)', color: '#ffffff' }}>
            Memoria ↓
          </a>
          <a href={`/api/exportar-paquete?id=${proyecto.id}`} download
            className="rounded px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ background: 'var(--ink)', color: '#ffffff' }}>
            Paquete ↓
          </a>
        </div>
      </div>

      {/* ── Stepper de progreso ── */}
      {(() => {
        const tipoTxt = tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto
        const fasesNum: Record<string, number> = { fase1: 1, fase2: 2 }
        const faseIdx = fasesNum[proyecto.fase_actual] ?? 1

        const pasos = [
          {
            n: '01', label: 'Fase 1', desc: 'Proceso y tecnología',
            done: !!f1, active: faseIdx === 1,
            href: `/?proyecto=${proyecto.id}`,
          },
          {
            n: '02', label: 'Fase 2', desc: 'Datos de sitio',
            done: !!f2, active: faseIdx === 2,
            href: `/proyectos/${proyecto.id}/fase2`,
          },
          {
            n: '03', label: 'Instrumentos', desc: 'Hojas de datos ISA',
            done: (hojas ?? []).length > 0 && (hojas ?? []).every(h => h.estado === 'aprobado'),
            active: false,
            href: `/proyectos/${proyecto.id}/instrumentos`,
          },
          {
            n: '04', label: 'Exportar', desc: 'P&ID · Reporte · Memoria',
            done: !!f2, active: false,
            href: undefined,
          },
          {
            n: '05', label: 'Puesta en marcha', desc: 'UV · ASEA · CENAGAS',
            done: false, active: false,
            href: `/proyectos/${proyecto.id}/puesta-en-marcha`,
          },
        ]

        return (
          <div className="rounded-lg border mb-6 px-5 py-4 overflow-x-auto"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-mono uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>
                {tipoTxt}
              </span>
              {f1?.tecnologia_nombre && (
                <span className="text-[10.5px]" style={{ color: 'var(--ink3)' }}>
                  {f1.tecnologia_nombre}
                </span>
              )}
            </div>
            <div className="flex items-start min-w-[560px]">
              {pasos.map((p, i) => (
                <div key={p.n} className="flex items-start flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
                        style={{
                          background: p.done ? 'var(--accent)' : p.active ? 'var(--accent)' : 'transparent',
                          border: `2px solid ${p.done || p.active ? 'var(--accent)' : 'var(--line)'}`,
                          color: p.done || p.active ? '#fff' : 'var(--ink3)',
                        }}
                      >
                        {p.done ? '✓' : p.n}
                      </div>
                      {i < pasos.length - 1 && (
                        <div className="flex-1 h-px mx-2"
                          style={{ background: p.done ? 'var(--accent)' : 'var(--line)' }} />
                      )}
                    </div>
                    <div className="mt-2 pr-3 w-full">
                      {p.href ? (
                        <Link href={p.href}
                          className="text-[11px] font-semibold hover:underline"
                          style={{ color: p.active ? 'var(--accent)' : p.done ? 'var(--accent)' : 'var(--ink2)' }}>
                          {p.label}
                        </Link>
                      ) : (
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--ink3)' }}>
                          {p.label}
                        </span>
                      )}
                      <div className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--ink3)' }}>
                        {p.desc}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="grid gap-5" style={{ gridTemplateColumns: '340px 1fr' }}>

        {/* columna izquierda — datos fijos */}
        <div className="flex flex-col gap-4">

          <Section title="Datos del punto">
            <Row label="Tipo" value={tipoLabel[proyecto.tipo_punto] ?? proyecto.tipo_punto} />
            {f1 && <>
              <Row label="Fluido" value={f1.fluido === 'gn' ? 'Gas natural' : 'GLP / mezcla'} />
              <Row label="Custodia fiscal" value={f1.fiscal ? 'Sí' : 'No'} />
              <Row label="Clase localización"
                value={f1.clase_localizacion === 'na' ? 'No aplica' : `Clase ${f1.clase_localizacion}`} />
            </>}
          </Section>

          {f1 && (
            <Section title="Condiciones de operación">
              <Row label="Qmín" value={`${Number(f1.qmin).toLocaleString('es-MX')} m³/h`} />
              <Row label="Qnorm" value={`${Number(f1.qnorm).toLocaleString('es-MX')} m³/h`} />
              <Row label="Qmáx" value={`${Number(f1.qmax).toLocaleString('es-MX')} m³/h`} />
              <Row label="Rango de medición"
                value={`1 : ${(Number(f1.qmax) / Math.max(Number(f1.qmin), 0.01)).toFixed(1)}`} />
              <Row label="Presión" value={`${f1.presion_kgcm2} kg/cm²`} />
              <Row label="Diámetro" value={`${f1.diametro_pulg}"`} />
              {f1.sg != null && <Row label="Gravedad específica" value={String(f1.sg)} />}
              {f1.co2_pct != null && <Row label="CO₂" value={`${f1.co2_pct} % mol`} />}
            </Section>
          )}

          {f1 && (
            <Section title="Metodología de cálculo">
              <div className="rounded-md px-3 py-2 mb-3 text-xs"
                style={{ background: 'rgba(74,158,187,0.07)', border: '1px solid rgba(74,158,187,0.25)' }}>
                <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>AGA 8 DETAIL</span>
                <span style={{ color: 'var(--ink2)' }}> — ecuación de estado GERG-2008 simplificada</span>
              </div>
              <div className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>
                <p>
                  El factor de compresibilidad Z se calcula con la ecuación de estado
                  <b style={{ color: 'var(--ink)' }}> AGA 8 DETAIL</b>, que usa la composición
                  molecular del gas (CH₄, C₂H₆, N₂, CO₂) derivada de los parámetros de proceso.
                </p>
                {f1.sg != null && (
                  <div className="rounded px-2 py-1.5 font-mono text-[10.5px]"
                    style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--line)', color: 'var(--ink3)' }}>
                    SG {f1.sg}
                    {f1.co2_pct != null && <> · CO₂ {f1.co2_pct} %</>}
                    {f1.n2_pct != null && <> · N₂ {f1.n2_pct} %</>}
                  </div>
                )}
                <p>
                  Para medición fiscal, este es el único método aceptado por{' '}
                  <b style={{ color: 'var(--ink)' }}>NOM-020-ASEA-2024</b>. El valor Z Papay
                  mostrado durante el diseño es solo referencia de screening.
                </p>
              </div>
            </Section>
          )}

          {f1?.tecnologia_nombre && (
            <Section title="Tecnología recomendada">
              <div className="rounded-md px-3 py-2.5 text-sm font-semibold mb-2"
                style={{ background: 'rgba(74,158,187,0.10)', border: '1px solid rgba(74,158,187,0.3)', color: 'var(--accent)' }}>
                {f1.tecnologia_nombre}
              </div>
              {f1.tecnologia_motivo && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>
                  {f1.tecnologia_motivo}
                </p>
              )}
            </Section>
          )}
          {aga3 && f1 && (
            <TarjetaAGA3
              aga3={aga3}
              qmin={Number(f1.qmin)} qnorm={Number(f1.qnorm)} qmax={Number(f1.qmax)}
            />
          )}
          {aga7 && f1 && (
            <TarjetaAGA7
              aga7={aga7}
              qmin={Number(f1.qmin)} qnorm={Number(f1.qnorm)} qmax={Number(f1.qmax)}
              metodoZ="papay"
            />
          )}
          {f1?.tecnologia_key === 'coriolis' && f1 && (
            <TarjetaCoriolis
              qmin={Number(f1.qmin)} qnorm={Number(f1.qnorm)} qmax={Number(f1.qmax)}
              sg={Number(f1.sg ?? 0.65)}
            />
          )}
        </div>

          {/* Fase 2 si existe */}
          {f2 && (
            <Section title="Datos de sitio — Fase 2">
              {f2.orientacion_instalacion && <Row label="Orientación" value={f2.orientacion_instalacion} />}
              {f2.tramos_rectos_disponibles != null && <Row label="Tramos rectos" value={`${f2.tramos_rectos_disponibles} D`} />}
              {f2.clasificacion_area && <Row label="Clasificación área" value={f2.clasificacion_area} />}
              {f2.zona_sismica && <Row label="Zona sísmica" value={`Zona ${f2.zona_sismica}`} />}
              {f2.tipo_suelo && <Row label="Tipo de suelo" value={f2.tipo_suelo} />}
              {f2.fabricante && <Row label="Fabricante" value={f2.fabricante} />}
              {f2.modelo && <Row label="Modelo" value={f2.modelo} />}
              {f2.numero_serie && <Row label="No. serie" value={f2.numero_serie} />}
            </Section>
          )}

        {/* columna derecha — actividades editables */}
        <div>
          <div className="rounded-lg border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>
                Actividades y huecos
              </h3>
              <span className="text-[10px] font-mono" style={{ color: 'var(--ink3)' }}>
                {acts?.length ?? 0} actividades · clic en estado para cambiar
              </span>
            </div>
            {acts && acts.length > 0 ? (
              <ActividadesEditor actividades={acts} proyectoId={proyecto.id} />
            ) : (
              <p className="text-xs" style={{ color: 'var(--ink3)' }}>Sin actividades registradas.</p>
            )}
          </div>
        </div>
      </div>

      {/* aviso legal */}
      <div className="mt-6 rounded-md border px-4 py-3 text-xs"
        style={{ borderColor: 'var(--line)', color: 'var(--ink3)' }}>
        Este documento es un <b style={{ color: 'var(--ink2)' }}>borrador de ingeniería</b>.
        Requiere revisión y firma de ingeniero con cédula profesional antes de tener validez legal.
        El software no emite dictamen de Unidad de Verificación, ni certifica trazabilidad metrológica.
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <h3 className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--ink3)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b last:border-0 text-xs gap-4"
      style={{ borderColor: 'var(--line)' }}>
      <span style={{ color: 'var(--ink3)' }}>{label}</span>
      <span className="font-medium text-right" style={{ color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}
