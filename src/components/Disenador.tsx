'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PID from './PID'
import dynamic from 'next/dynamic'
const Vista3D = dynamic(() => import('./Vista3D'), { ssr: false })
import { seleccionarTecnologia } from '@/lib/engine/seleccion-tecnologia'
import { calcularCondicionesFisicas, calcularAGA8, calcularAGA3, idRealMm, type ResultadoAGA3 } from '@/lib/engine/calculo-z'
import TarjetaAGA3 from './TarjetaAGA3'
import { getNormasAplicables, getActividadesBase } from '@/lib/engine/normativa'
import { guardarProyecto } from '@/lib/acciones/guardar-proyecto'
import { actualizarProyecto } from '@/lib/acciones/actualizar-proyecto'
import type {
  DatosProceso, VariablesAvanzadas, ResultadoTecnologia,
  ResultadoCalculo, Norma, Actividad,
} from '@/types/medicion'

export interface InitialData {
  proyectoId: string
  nombre: string
  cliente: string
  tipo_punto: string
  fase1: {
    fiscal: boolean; fluido: string
    qmin: number; qnorm: number; qmax: number
    presion_kgcm2: number; diametro_pulg: number; clase_localizacion: string
    sg?: number | null; co2_pct?: number | null; n2_pct?: number | null
    viscosidad_cp?: number | null; toma_diferencial?: string | null
    elevacion_msnm?: number | null; patm_kpa?: number | null; tamb_min_c?: number | null
    p_base_kpa?: number | null; t_base_c?: number | null
    dew_agua_c?: number | null; dew_hc_c?: number | null; dp_regulador_bar?: number | null
  }
}

// ─── valores por defecto ──────────────────────────────────────────────────────

const DEFAULT_PROCESO: DatosProceso = {
  tipo: 'city_gate', fiscal: true, fluido: 'gn',
  qmin: 150, qnorm: 800, qmax: 2500,
  presion_kgcm2: 21, diametro_pulg: 6, clase_localizacion: 'na',
}

const DEFAULT_ADV: VariablesAvanzadas = {
  sg: 0.65, co2_pct: 1.0, n2_pct: 0.5, viscosidad_cp: 0.011,
  toma_diferencial: 'brida', elevacion_msnm: 0, patm_kpa: 101.325,
  tamb_min_c: 5, p_base_kpa: 101.325, t_base_c: 15.6,
  dew_agua_c: -10, dew_hc_c: -5, dp_regulador_bar: 5,
}

// ─── helpers de estilo ────────────────────────────────────────────────────────

const field = 'w-full bg-[#f2f7f9] border border-[#cddde5] text-[#1b3044] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4a9ebb]'
const label = 'block text-xs text-[#8aaabb] mb-1 mt-3'

const alertColor = { info: '#4a9ebb', warn: '#c17f24', danger: '#b84030' }
const alertBg    = { info: 'rgba(74,158,187,0.08)', warn: 'rgba(193,127,36,0.08)', danger: 'rgba(184,64,48,0.08)' }

// ─── tipos resultado ──────────────────────────────────────────────────────────

interface Resultado {
  tech: ResultadoTecnologia
  calculo: ResultadoCalculo
  normas: Norma[]
  actividades: Actividad[]
  turndown: number
  aga3?: ResultadoAGA3 | null
}

// ─── componente ───────────────────────────────────────────────────────────────

export default function Disenador({ initialData }: { initialData?: InitialData | null }) {
  const f1 = initialData?.fase1

  const [datos, setDatos] = useState<DatosProceso>(f1 ? {
    tipo: initialData!.tipo_punto as DatosProceso['tipo'],
    fiscal: f1.fiscal,
    fluido: f1.fluido as DatosProceso['fluido'],
    qmin: Number(f1.qmin), qnorm: Number(f1.qnorm), qmax: Number(f1.qmax),
    presion_kgcm2: Number(f1.presion_kgcm2),
    diametro_pulg: Number(f1.diametro_pulg),
    clase_localizacion: f1.clase_localizacion as DatosProceso['clase_localizacion'],
  } : DEFAULT_PROCESO)

  const [adv, setAdv] = useState<VariablesAvanzadas>(f1 ? {
    sg: f1.sg ?? DEFAULT_ADV.sg,
    co2_pct: f1.co2_pct ?? DEFAULT_ADV.co2_pct,
    n2_pct: f1.n2_pct ?? DEFAULT_ADV.n2_pct,
    viscosidad_cp: f1.viscosidad_cp ?? DEFAULT_ADV.viscosidad_cp,
    toma_diferencial: (f1.toma_diferencial ?? DEFAULT_ADV.toma_diferencial) as VariablesAvanzadas['toma_diferencial'],
    elevacion_msnm: f1.elevacion_msnm ?? DEFAULT_ADV.elevacion_msnm,
    patm_kpa: f1.patm_kpa ?? DEFAULT_ADV.patm_kpa,
    tamb_min_c: f1.tamb_min_c ?? DEFAULT_ADV.tamb_min_c,
    p_base_kpa: f1.p_base_kpa ?? DEFAULT_ADV.p_base_kpa,
    t_base_c: f1.t_base_c ?? DEFAULT_ADV.t_base_c,
    dew_agua_c: f1.dew_agua_c ?? DEFAULT_ADV.dew_agua_c,
    dew_hc_c: f1.dew_hc_c ?? DEFAULT_ADV.dew_hc_c,
    dp_regulador_bar: f1.dp_regulador_bar ?? DEFAULT_ADV.dp_regulador_bar,
  } : DEFAULT_ADV)

  const [advOpen, setAdvOpen] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [tab, setTab] = useState<'pid' | '3d' | 'actividades'>('pid')
  const [modalOpen, setModalOpen] = useState(false)
  const [nombreProyecto, setNombreProyecto] = useState(initialData?.nombre ?? '')
  const [clienteProyecto, setClienteProyecto] = useState(initialData?.cliente ?? '')
  const [proyectoId] = useState<string | null>(initialData?.proyectoId ?? null)
  const [guardando, setGuardando] = useState(false)
  const [guardadoId, setGuardadoId] = useState<string | null>(null)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const [calculandoAGA8, setCalculandoAGA8] = useState(false)
  const [metodoOpen, setMetodoOpen] = useState(false)

  function num(val: string) { return parseFloat(val) || 0 }

  async function generar() {
    const tech = seleccionarTecnologia(datos)
    const calculo = calcularCondicionesFisicas(adv)
    const normas = getNormasAplicables(datos.tipo, datos.fiscal)
    const actividades = getActividadesBase(datos.tipo, datos.fiscal)
    const turndown = datos.qmax / Math.max(datos.qmin, 0.01)
    const aga3 = (tech.key === 'orificio' || tech.key === 'diafragma')
      ? calcularAGA3(
          datos.qmax, datos.qnorm, datos.qmin,
          datos.presion_kgcm2, adv.tamb_min_c,
          adv.sg, calculo.Z_papay,
          datos.diametro_pulg,
          adv.toma_diferencial,
          adv.viscosidad_cp,
          adv.p_base_kpa, adv.t_base_c,
        )
      : null
    setResultado({ tech, calculo, normas, actividades, turndown, aga3 })
    setTab('pid')
    setGuardadoId(null)
    setErrorGuardado(null)

    // enriquecer con AGA 8 en segundo plano
    setCalculandoAGA8(true)
    const presion_op_kpa = datos.presion_kgcm2 * 98.0665
    const aga8 = await calcularAGA8(adv, presion_op_kpa)
    setCalculandoAGA8(false)
    if (aga8) {
      setResultado(prev => {
        if (!prev) return prev
        const aga3Updated = (prev.tech.key === 'orificio' || prev.tech.key === 'diafragma')
          ? calcularAGA3(
              datos.qmax, datos.qnorm, datos.qmin,
              datos.presion_kgcm2, adv.tamb_min_c,
              adv.sg, aga8.z,
              datos.diametro_pulg, adv.toma_diferencial,
              adv.viscosidad_cp, adv.p_base_kpa, adv.t_base_c,
            )
          : prev.aga3
        return {
          ...prev,
          aga3: aga3Updated,
          calculo: {
            ...prev.calculo,
            Z_aga8: aga8.z,
            densidad_kgm3: aga8.densidad_kgm3,
            metodo: 'aga8-detail' as const,
          },
        }
      })
    }
  }

  // auto-generar al cargar un proyecto existente
  useEffect(() => {
    if (initialData) generar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function confirmarGuardado() {
    if (!resultado || !nombreProyecto.trim()) return
    setGuardando(true)
    setErrorGuardado(null)
    try {
      if (proyectoId) {
        await actualizarProyecto({
          id: proyectoId,
          nombre: nombreProyecto.trim(),
          cliente: clienteProyecto.trim(),
          datos, adv,
          tech: resultado.tech,
          actividades: resultado.actividades,
        })
        setGuardadoId(proyectoId)
      } else {
        const id = await guardarProyecto({
          nombre: nombreProyecto.trim(),
          cliente: clienteProyecto.trim(),
          datos, adv,
          tech: resultado.tech,
          actividades: resultado.actividades,
        })
        setGuardadoId(id)
      }
      setModalOpen(false)
    } catch (e) {
      setErrorGuardado(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setGuardando(false)
    }
  }

  const huecosBloqueantes = resultado?.actividades.filter(
    a => a.bloquea_exportacion_final && a.estado === 'falta'
  ) ?? []

  return (
    <>
    <div className="max-w-[1260px] mx-auto px-6 pb-20 pt-7">

      <h1 className="text-xl font-semibold mb-0.5">Diseñador de estación de medición de gas</h1>
      <p className="text-xs font-mono mb-5" style={{ color: 'var(--ink3)' }}>
        Fase 1 — condiciones de proceso · NOM-020-ASEA-2024
      </p>

      {/* ── Stepper de flujo ── */}
      <div className="rounded-lg border mb-6 px-5 py-4 overflow-x-auto"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div className="flex items-start min-w-[600px]">
          {[
            { n: '01', label: 'Fase 1', desc: 'Proceso y tecnología', active: true },
            { n: '02', label: 'Fase 2', desc: 'Datos de sitio' },
            { n: '03', label: 'Instrumentos', desc: 'Hojas de datos ISA' },
            { n: '04', label: 'Exportar', desc: 'P&ID · Reporte · Memoria' },
            { n: '05', label: 'Puesta en marcha', desc: 'UV · ASEA · CENAGAS' },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex items-start flex-1">
              <div className="flex flex-col items-center flex-1">
                {/* círculo + línea */}
                <div className="flex items-center w-full">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${s.active ? 'text-white' : ''}`}
                    style={{
                      background: s.active ? 'var(--accent)' : 'transparent',
                      border: `2px solid ${s.active ? 'var(--accent)' : 'var(--line)'}`,
                      color: s.active ? '#fff' : 'var(--ink3)',
                    }}>
                    {s.n}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex-1 h-px mx-2" style={{ background: 'var(--line)' }} />
                  )}
                </div>
                {/* texto */}
                <div className="mt-2 pr-4 w-full">
                  <div className="text-[11px] font-semibold"
                    style={{ color: s.active ? 'var(--accent)' : 'var(--ink2)' }}>
                    {s.label}
                  </div>
                  <div className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--ink3)' }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '320px 1fr' }}>

        {/* ── Panel izquierdo ── */}
        <div
          className="rounded-lg border p-5 sticky top-5 self-start"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <h2 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
            Datos del punto
          </h2>

          <label className={label} style={{ marginTop: 0 }}>Tipo de punto</label>
          <select className={field} value={datos.tipo}
            onChange={e => setDatos(d => ({ ...d, tipo: e.target.value as DatosProceso['tipo'] }))}>
            <option value="city_gate">City gate — SISTRANGAS/CENAGAS</option>
            <option value="industrial">Estación industrial</option>
            <option value="ducto">Punto en ducto regional</option>
            <option value="auditoria">Auditoría / diagnóstico</option>
          </select>

          <label className={label}>¿Transferencia de custodia fiscal?</label>
          <select className={field} value={datos.fiscal ? 'si' : 'no'}
            onChange={e => setDatos(d => ({ ...d, fiscal: e.target.value === 'si' }))}>
            <option value="si">Sí — custodia fiscal</option>
            <option value="no">No — control interno</option>
          </select>

          <label className={label}>Gas natural o GLP / líquido</label>
          <select className={field} value={datos.fluido}
            onChange={e => setDatos(d => ({ ...d, fluido: e.target.value as DatosProceso['fluido'] }))}>
            <option value="gn">Gas natural</option>
            <option value="glp">GLP / mezcla</option>
          </select>

          <label className={label}>Caudal mín / normal / máx (m³/h)</label>
          <div className="grid grid-cols-3 gap-2">
            {(['qmin','qnorm','qmax'] as const).map(k => (
              <input key={k} type="number" className={field} placeholder={k}
                value={datos[k]}
                onChange={e => setDatos(d => ({ ...d, [k]: num(e.target.value) }))} />
            ))}
          </div>
          <p className="text-[10.5px] mt-1" style={{ color: 'var(--ink3)' }}>
            Turndown = Qmax / Qmin — define la tecnología viable
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Presión (kg/cm²)</label>
              <input type="number" className={field} value={datos.presion_kgcm2}
                onChange={e => setDatos(d => ({ ...d, presion_kgcm2: num(e.target.value) }))} />
            </div>
            <div>
              <label className={label}>Diámetro nominal (pulg)</label>
              <input type="number" className={field} value={datos.diametro_pulg}
                onChange={e => setDatos(d => ({ ...d, diametro_pulg: num(e.target.value) }))} />
            </div>
          </div>

          <label className={label}>Clase de localización del ducto</label>
          <select className={field} value={datos.clase_localizacion}
            onChange={e => setDatos(d => ({ ...d, clase_localizacion: e.target.value as DatosProceso['clase_localizacion'] }))}>
            <option value="na">No aplica / no es ducto</option>
            <option value="1">Clase 1</option>
            <option value="2">Clase 2</option>
            <option value="3">Clase 3</option>
            <option value="4">Clase 4 — zona urbana densa</option>
          </select>

          {/* ── Variables avanzadas ── */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
            <button
              className="flex w-full items-center justify-between text-xs font-mono uppercase tracking-widest"
              style={{ color: 'var(--accent)' }}
              onClick={() => setAdvOpen(o => !o)}
            >
              <span>Variables avanzadas de proceso</span>
              <span style={{ fontSize: 16 }}>{advOpen ? '▴' : '▾'}</span>
            </button>

            {advOpen && (
              <div className="mt-3 space-y-0">
                <p className="text-[10px] mb-2" style={{ color: 'var(--ink3)' }}>
                  Variables universales — válidas en cualquier ubicación. No se asume clima ni país.
                </p>

                <label className={label}>Gravedad específica del gas (aire = 1)</label>
                <input type="number" step="0.001" className={field} value={adv.sg}
                  onChange={e => setAdv(a => ({ ...a, sg: num(e.target.value) }))} />

                <div className="grid grid-cols-2 gap-2">
                  <div><label className={label}>CO₂ (% mol)</label>
                    <input type="number" step="0.01" className={field} value={adv.co2_pct}
                      onChange={e => setAdv(a => ({ ...a, co2_pct: num(e.target.value) }))} /></div>
                  <div><label className={label}>N₂ (% mol)</label>
                    <input type="number" step="0.01" className={field} value={adv.n2_pct}
                      onChange={e => setAdv(a => ({ ...a, n2_pct: num(e.target.value) }))} /></div>
                </div>

                <label className={label}>Viscosidad dinámica (cP)</label>
                <input type="number" step="0.001" className={field} value={adv.viscosidad_cp}
                  onChange={e => setAdv(a => ({ ...a, viscosidad_cp: num(e.target.value) }))} />

                <label className={label}>Tipo de toma ΔP (solo orificio)</label>
                <select className={field} value={adv.toma_diferencial}
                  onChange={e => setAdv(a => ({ ...a, toma_diferencial: e.target.value as VariablesAvanzadas['toma_diferencial'] }))}>
                  <option value="brida">Brida (flange tap)</option>
                  <option value="esquina">Esquina (corner tap)</option>
                  <option value="ddmedio">D y D/2 (pipe tap)</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <div><label className={label}>Elevación (m s.n.m.)</label>
                    <input type="number" className={field} value={adv.elevacion_msnm}
                      onChange={e => setAdv(a => ({ ...a, elevacion_msnm: num(e.target.value) }))} /></div>
                  <div><label className={label}>P atm local (kPa)</label>
                    <input type="number" className={field} value={adv.patm_kpa}
                      onChange={e => setAdv(a => ({ ...a, patm_kpa: num(e.target.value) }))} /></div>
                </div>

                <label className={label}>T ambiente mínima de diseño (°C)</label>
                <input type="number" className={field} value={adv.tamb_min_c}
                  onChange={e => setAdv(a => ({ ...a, tamb_min_c: num(e.target.value) }))} />

                <div className="grid grid-cols-2 gap-2">
                  <div><label className={label}>P base contrato (kPa)</label>
                    <input type="number" className={field} value={adv.p_base_kpa}
                      onChange={e => setAdv(a => ({ ...a, p_base_kpa: num(e.target.value) }))} /></div>
                  <div><label className={label}>T base contrato (°C)</label>
                    <input type="number" className={field} value={adv.t_base_c}
                      onChange={e => setAdv(a => ({ ...a, t_base_c: num(e.target.value) }))} /></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div><label className={label}>Rocío agua (°C)</label>
                    <input type="number" className={field} value={adv.dew_agua_c}
                      onChange={e => setAdv(a => ({ ...a, dew_agua_c: num(e.target.value) }))} /></div>
                  <div><label className={label}>Rocío HC (°C)</label>
                    <input type="number" className={field} value={adv.dew_hc_c}
                      onChange={e => setAdv(a => ({ ...a, dew_hc_c: num(e.target.value) }))} /></div>
                </div>

                <label className={label}>ΔP en regulador / etapa de reducción (bar)</label>
                <input type="number" step="0.1" className={field} value={adv.dp_regulador_bar}
                  onChange={e => setAdv(a => ({ ...a, dp_regulador_bar: num(e.target.value) }))} />
              </div>
            )}
          </div>

          <button
            onClick={generar}
            className="mt-5 w-full rounded-md py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            Generar diseño
          </button>
          <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--ink3)' }}>
            Prototipo — sin guardado persistente aún
          </p>
        </div>

        {/* ── Panel derecho ── */}
        <div className="flex flex-col gap-4">
          {!resultado ? (
            <div className="rounded-lg border flex items-center justify-center py-20"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--ink3)', fontSize: 13 }}>
              Completa los datos y pulsa &ldquo;Generar diseño&rdquo;
            </div>
          ) : (
            <>
              {/* Tecnología recomendada */}
              <Card title="Tecnología recomendada" badge="motor de reglas">
                <div className="flex flex-wrap gap-4 items-start">
                  <div
                    className="rounded-md px-4 py-2.5 text-sm font-bold whitespace-nowrap"
                    style={{ background: 'rgba(74,158,187,0.10)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                  >
                    {resultado.tech.nombre}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--ink2)' }}>
                    Turndown calculado: <b style={{ color: 'var(--ink)' }}>{resultado.turndown.toFixed(1)}:1</b>
                    {' · '}Turndown típico: <b style={{ color: 'var(--ink)' }}>{resultado.tech.turndown_tipico}</b>
                    <br />
                    Exactitud: <b style={{ color: 'var(--ink)' }}>{resultado.tech.exactitud}</b>
                    {' · '}Referencia: <b style={{ color: 'var(--ink)' }}>{resultado.tech.referencia}</b>
                    <br />
                    <span className="mt-1 block">{resultado.tech.motivo}</span>
                  </div>
                </div>
              </Card>

              {/* AGA 3 — solo para orificio/diafragma */}
              {resultado.aga3 && (
                <TarjetaAGA3
                  aga3={resultado.aga3}
                  qmin={datos.qmin}
                  qnorm={datos.qnorm}
                  qmax={datos.qmax}
                />
              )}

              {/* Tabs P&ID / 3D / Actividades */}
              <Card title="">
                <div className="flex gap-1 border-b mb-4" style={{ borderColor: 'var(--line)' }}>
                  {([
                    ['pid',         'P&ID esquemático'],
                    ['3d',          'Referencia 3D'],
                    ['actividades', `Actividades (${resultado.actividades.length})`],
                  ] as [string, string][]).map(([t, lbl]) => (
                    <button key={t} onClick={() => setTab(t as typeof tab)}
                      className="px-3 py-2 text-xs font-mono cursor-pointer border-b-2 -mb-px transition-colors"
                      style={{
                        color: tab === t ? 'var(--accent)' : 'var(--ink3)',
                        borderColor: tab === t ? 'var(--accent)' : 'transparent',
                      }}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {tab === 'pid' && (
                  <PID
                    tech={resultado.tech}
                    diametro={datos.diametro_pulg}
                    presion={datos.presion_kgcm2}
                    qnorm={datos.qnorm}
                  />
                )}

                {tab === '3d' && (
                  <Vista3D
                    techKey={resultado.tech.key}
                    diametroPulg={datos.diametro_pulg}
                  />
                )}

                {tab === 'actividades' && (
                  <div className="space-y-1.5">
                    {huecosBloqueantes.length > 0 && (
                      <div className="mb-3 rounded-md px-3 py-2.5 text-xs"
                        style={{ background: 'rgba(214,96,77,0.10)', borderLeft: '3px solid var(--danger)', color: '#e9ecdf' }}>
                        <b style={{ color: 'var(--danger)' }}>{huecosBloqueantes.length} huecos bloqueantes</b> — el plano no puede exportarse como &ldquo;para firma&rdquo; hasta resolverlos.
                      </div>
                    )}
                    {resultado.actividades.map(act => (
                      <ActividadRow key={act.id} act={act} />
                    ))}
                  </div>
                )}
              </Card>

              {/* Advertencia clase 4 */}
              {datos.clase_localizacion === '4' && (
                <AlertBox nivel="warn">
                  Clase de localización 4 (zona urbana densa) — NOM-020-ASEA-2024 exige factor de diseño más conservador y mayor frecuencia de inspección. Verificar espesor de pared y profundidad de enterrado antes de fijar el diámetro final.
                </AlertBox>
              )}

              {/* Condiciones físicas estimadas */}
              <Card
                title="Condiciones físicas estimadas"
                badge={
                  calculandoAGA8
                    ? '⟳ calculando AGA8…'
                    : resultado.calculo.metodo === 'aga8-detail'
                    ? 'AGA 8 DETAIL ✓'
                    : 'Papay — screening, no fiscal'
                }
              >
                {/* resumen Z */}
                <div className="flex gap-3 mb-3 flex-wrap">
                  <div className="rounded px-3 py-1.5 text-xs"
                    style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--line)' }}>
                    <span style={{ color: 'var(--ink3)' }}>Z Papay </span>
                    <b style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>
                      {resultado.calculo.Z_papay.toFixed(4)}
                    </b>
                  </div>
                  {resultado.calculo.Z_aga8 != null && (
                    <div className="rounded px-3 py-1.5 text-xs"
                      style={{ background: 'rgba(74,158,187,0.08)', border: '1px solid rgba(74,158,187,0.3)' }}>
                      <span style={{ color: 'var(--ink3)' }}>Z AGA8 </span>
                      <b style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>
                        {resultado.calculo.Z_aga8.toFixed(4)}
                      </b>
                    </div>
                  )}
                  {resultado.calculo.densidad_kgm3 != null && (
                    <div className="rounded px-3 py-1.5 text-xs"
                      style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--line)' }}>
                      <span style={{ color: 'var(--ink3)' }}>ρ </span>
                      <b style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>
                        {resultado.calculo.densidad_kgm3.toFixed(2)} kg/m³
                      </b>
                    </div>
                  )}
                </div>
                {/* nota metodología */}
                <div className="mb-3">
                  <button
                    className="text-[10.5px] flex items-center gap-1 cursor-pointer"
                    style={{ color: 'var(--ink3)' }}
                    onClick={() => setMetodoOpen(o => !o)}
                  >
                    <span>{metodoOpen ? '▴' : '▾'}</span>
                    <span>¿Cómo se calculó este factor Z?</span>
                  </button>
                  {metodoOpen && (
                    <div className="mt-2 rounded-md px-3 py-2.5 text-xs leading-relaxed space-y-2"
                      style={{ background: 'rgba(74,158,187,0.06)', border: '1px solid rgba(74,158,187,0.2)', color: 'var(--ink2)' }}>
                      <p>
                        <b style={{ color: 'var(--ink)' }}>Z Papay</b> — correlación empírica basada en presión pseudoreducida
                        (Pr) y temperatura pseudoreducida (Tr). Rápida, válida para screening preliminar,
                        pero no apta para cómputo fiscal.
                      </p>
                      <p>
                        <b style={{ color: 'var(--accent)' }}>Z AGA 8 DETAIL</b> — ecuación de estado de referencia
                        internacional (GERG-2008 simplificada). Usa la composición molecular real (CH₄, C₂H₆, N₂, CO₂)
                        y 58 coeficientes de interacción. Es el método exigido por{' '}
                        <b style={{ color: 'var(--ink)' }}>NOM-020-ASEA-2024</b> para medición fiscal de gas natural.
                      </p>
                      {resultado.calculo.Z_aga8 != null && resultado.calculo.Z_papay && (
                        <p>
                          Diferencia en este cálculo:{' '}
                          <b style={{ color: 'var(--ink)' }}>
                            {Math.abs(resultado.calculo.Z_papay - resultado.calculo.Z_aga8).toFixed(4)}
                          </b>{' '}
                          ({(Math.abs(resultado.calculo.Z_papay - resultado.calculo.Z_aga8) / resultado.calculo.Z_papay * 100).toFixed(1)} %).
                          En medición fiscal, usar Papay en lugar de AGA8 generaría un error de volumen
                          equivalente en cada período de facturación.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {resultado.calculo.alertas.map((a, i) => (
                    <div key={i} className="rounded-sm pl-3 pr-3 py-2.5 text-xs leading-relaxed"
                      style={{
                        borderLeft: `3px solid ${alertColor[a.nivel]}`,
                        background: alertBg[a.nivel],
                        color: 'var(--ink2)',
                      }}
                      dangerouslySetInnerHTML={{ __html: a.texto }}
                    />
                  ))}
                </div>
              </Card>

              {/* Normativa */}
              <Card title="Normativa aplicable">
                <ul className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'transparent' } as React.CSSProperties}>
                  {resultado.normas.map(n => (
                    <li key={n.clave} className="py-2 text-xs" style={{ borderColor: 'var(--line)' }}>
                      <b className="block mb-0.5" style={{ color: 'var(--ink)' }}>{n.clave}</b>
                      <span style={{ color: 'var(--ink2)' }}>{n.descripcion}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Botón guardar / estado */}
              {guardadoId ? (
                <div className="rounded-md px-4 py-3 text-xs flex items-center gap-2"
                  style={{ background: 'rgba(74,158,187,0.10)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
                  <span>✓</span>
                  <span>
                    {proyectoId ? 'Proyecto actualizado' : 'Proyecto guardado'}
                    {' · '}
                    <Link href={`/proyectos/${guardadoId}`} className="font-mono underline">
                      Ver detalle →
                    </Link>
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full rounded-md py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ background: 'var(--accent2)', color: '#ffffff' }}
                >
                  {proyectoId ? 'Actualizar proyecto' : 'Guardar proyecto en base de datos'}
                </button>
              )}

              {/* Aviso legal */}
              <div className="rounded-md border px-4 py-3 text-xs"
                style={{ borderColor: 'var(--line)', color: 'var(--ink3)' }}>
                Este documento es un <b style={{ color: 'var(--ink2)' }}>borrador de ingeniería</b>.
                Requiere revisión y firma de ingeniero con cédula profesional antes de tener validez legal.
                El software no emite dictamen de Unidad de Verificación, ni certifica trazabilidad metrológica.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    {/* ── Modal guardar ── */}
    {modalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
      >
        <div className="w-full max-w-md rounded-xl border p-6 shadow-2xl"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>
            {proyectoId ? 'Actualizar proyecto' : 'Guardar proyecto'}
          </h3>

          <label className={label} style={{ marginTop: 0 }}>Nombre del proyecto *</label>
          <input
            className={field}
            placeholder="Ej. City Gate Monterrey Norte"
            value={nombreProyecto}
            onChange={e => setNombreProyecto(e.target.value)}
            autoFocus
          />

          <label className={label}>Cliente / empresa</label>
          <input
            className={field}
            placeholder="Ej. PEMEX TRI"
            value={clienteProyecto}
            onChange={e => setClienteProyecto(e.target.value)}
          />

          {errorGuardado && (
            <p className="mt-3 text-xs" style={{ color: 'var(--danger)' }}>{errorGuardado}</p>
          )}

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-md py-2 text-sm cursor-pointer border transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--line)', color: 'var(--ink2)', background: 'transparent' }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmarGuardado}
              disabled={!nombreProyecto.trim() || guardando}
              className="flex-1 rounded-md py-2 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >
              {guardando ? '…' : proyectoId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// ─── sub-componentes ──────────────────────────────────────────────────────────

function Card({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--ink)' }}>{title}</h3>
          {badge && <span className="text-[10px] font-mono" style={{ color: 'var(--ink3)' }}>{badge}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

function AlertBox({ nivel, children }: { nivel: 'info' | 'warn' | 'danger'; children: React.ReactNode }) {
  return (
    <div className="rounded-sm pl-3 pr-3 py-2.5 text-xs leading-relaxed"
      style={{
        borderLeft: `3px solid ${alertColor[nivel]}`,
        background: alertBg[nivel],
        color: 'var(--ink2)',
      }}>
      {children}
    </div>
  )
}

const estadoColor: Record<string, string> = {
  tienes: '#2e7d32', falta: '#b84030', en_proceso: '#c17f24',
}
const estadoLabel: Record<string, string> = {
  tienes: 'Listo', falta: 'Falta', en_proceso: 'En proceso',
}
const tipoLabel: Record<string, string> = {
  interno_energon: 'Energón', externo_obligatorio: 'Externo obligatorio', externo_opcional: 'Externo',
}

function ActividadRow({ act }: { act: Actividad }) {
  return (
    <div className="rounded-md border px-3 py-2.5 text-xs flex gap-3 items-start"
      style={{ borderColor: act.bloquea_exportacion_final ? 'rgba(184,64,48,0.35)' : 'var(--line)', background: act.bloquea_exportacion_final ? '#fff5f4' : 'var(--bg)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: 'var(--ink)' }} className="font-medium">{act.nombre}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--ink3)' }}>
            Etapa {act.etapa}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--ink3)' }}>
            {tipoLabel[act.responsable_tipo]}
          </span>
          {act.bloquea_exportacion_final && (
            <span className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(214,96,77,0.15)', color: 'var(--danger)' }}>
              Bloquea firma
            </span>
          )}
        </div>
        <p className="mt-1" style={{ color: 'var(--ink3)' }}>{act.accion_sugerida}</p>
      </div>
      <div className="text-[10px] font-mono shrink-0 mt-0.5 px-2 py-1 rounded"
        style={{ background: 'rgba(0,0,0,0.04)', color: estadoColor[act.estado] }}>
        {estadoLabel[act.estado]}
      </div>
    </div>
  )
}
