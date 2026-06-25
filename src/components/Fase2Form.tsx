'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { guardarFase2, type Fase2Input } from '@/lib/acciones/guardar-fase2'

const field = 'w-full bg-[#f2f7f9] border border-[#cddde5] text-[#1b3044] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4a9ebb]'
const lbl   = 'block text-xs text-[#8aaabb] mb-1 mt-4'
const sel   = field + ' appearance-none cursor-pointer'

interface Props {
  proyectoId: string
  f1: { tecnologia_nombre?: string | null; diametro_pulg?: number | null }
  initial?: Partial<Fase2Input> | null
}

const ZONAS_SISMICAS = ['A', 'B', 'C', 'D']
const TIPOS_SUELO    = ['Tipo I — Roca', 'Tipo II — Suelo compacto', 'Tipo III — Suelo blando', 'Tipo IV — Lago / arcilla blanda']
const CLASES_AREA    = ['No clasificada', 'Clase I División 1', 'Clase I División 2', 'Zona 0 (IEC)', 'Zona 1 (IEC)', 'Zona 2 (IEC)']
const ORIENTACIONES  = ['Horizontal — brida frontal', 'Horizontal — brida lateral', 'Vertical — flujo ascendente', 'Vertical — flujo descendente']

export default function Fase2Form({ proyectoId, f1, initial }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [ok, setOk]         = useState(false)
  const [err, setErr]       = useState('')

  const [interferencias, setInterferencias] = useState(initial?.interferencias_descripcion ?? '')
  const [tramos,         setTramos]         = useState<string>(String(initial?.tramos_rectos_disponibles ?? ''))
  const [orientacion,    setOrientacion]    = useState(initial?.orientacion_instalacion ?? '')
  const [vibracion,      setVibracion]      = useState(initial?.vibracion_notas ?? '')
  const [espacio,        setEspacio]        = useState<string>(String(initial?.espacio_fisico_cm2 ?? ''))
  const [tipoSuelo,      setTipoSuelo]      = useState(initial?.tipo_suelo ?? '')
  const [zonaSis,        setZonaSis]        = useState(initial?.zona_sismica ?? '')
  const [profundidad,    setProfundidad]    = useState<string>(String(initial?.profundidad_enterrado_m ?? ''))
  const [clasArea,       setClasArea]       = useState(initial?.clasificacion_area ?? '')
  const [clasDiv,        setClasDiv]        = useState(initial?.clase_division_zona ?? '')
  const [fabricante,     setFabricante]     = useState(initial?.fabricante ?? '')
  const [modelo,         setModelo]         = useState(initial?.modelo ?? '')
  const [serie,          setSerie]          = useState(initial?.numero_serie ?? '')
  const dim0 = (initial?.dimensiones_json as Record<string, number | null> | undefined) ?? {}
  const [largo,  setLargo]  = useState<string>(String(dim0.largo_mm  ?? ''))
  const [ancho,  setAncho]  = useState<string>(String(dim0.ancho_mm  ?? ''))
  const [alto,   setAlto]   = useState<string>(String(dim0.alto_mm   ?? ''))
  const [f2f,    setF2f]    = useState<string>(String(dim0.face_to_face_mm ?? ''))
  const [peso,   setPeso]   = useState<string>(String(dim0.peso_kg   ?? ''))

  const num = (s: string) => s === '' || s === 'null' ? null : Number(s)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr('')
    const payload: Fase2Input = {
      proyecto_id:                  proyectoId,
      interferencias_descripcion:   interferencias,
      tramos_rectos_disponibles:    num(tramos),
      orientacion_instalacion:      orientacion,
      vibracion_notas:              vibracion,
      espacio_fisico_cm2:           num(espacio),
      tipo_suelo:                   tipoSuelo,
      zona_sismica:                 zonaSis,
      profundidad_enterrado_m:      num(profundidad),
      clasificacion_area:           clasArea,
      clase_division_zona:          clasDiv,
      fabricante,
      modelo,
      numero_serie:                 serie,
      dimensiones_json: {
        largo_mm:        num(largo),
        ancho_mm:        num(ancho),
        alto_mm:         num(alto),
        face_to_face_mm: num(f2f),
        peso_kg:         num(peso),
      },
    }
    const res = await guardarFase2(payload)
    setSaving(false)
    if (res.ok) {
      setOk(true)
      router.push(`/proyectos/${proyectoId}`)
    } else {
      setErr(res.error ?? 'Error desconocido')
    }
  }

  const dnMm = f1.diametro_pulg ? (Number(f1.diametro_pulg) * 25.4).toFixed(0) : '?'

  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto flex flex-col gap-0">

      {/* ── Levantamiento físico ── */}
      <Seccion title="Levantamiento físico en sitio">
        <label className={lbl}>
          Interferencias identificadas
          <span className="text-[10px] ml-1" style={{ color: 'var(--ink3)' }}>(codos, válvulas, reducciones en zona de medición)</span>
        </label>
        <textarea
          className={field + ' resize-none'}
          rows={3}
          value={interferencias}
          onChange={e => setInterferencias(e.target.value)}
          placeholder="Ej: Codo 90° a 4D aguas arriba, reducción 6→4 a 8D"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>
              Tramos rectos disponibles
              <span className="text-[10px] ml-1" style={{ color: 'var(--ink3)' }}>(en diámetros)</span>
            </label>
            <input type="number" min={0} step={0.5} className={field} value={tramos}
              onChange={e => setTramos(e.target.value)}
              placeholder={`Recomendado ≥ 10D (DN${dnMm})`} />
            <p className="text-[10.5px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink3)' }}>
              Longitud de tubo recto antes del medidor, sin codos ni válvulas, expresada en múltiplos del diámetro nominal.
              Ej: 10D con DN{dnMm} mm = {f1.diametro_pulg ? (Number(f1.diametro_pulg) * 25.4 * 10 / 1000).toFixed(2) : '?'} m.
              AGA 9 exige ≥ 10D; AGA 3 hasta 44D según perturbación.
            </p>
          </div>
          <div>
            <label className={lbl}>Espacio físico disponible (cm²)</label>
            <input type="number" min={0} className={field} value={espacio}
              onChange={e => setEspacio(e.target.value)} placeholder="Ej: 3600" />
          </div>
        </div>

        <label className={lbl}>Orientación de instalación</label>
        <select className={sel} value={orientacion} onChange={e => setOrientacion(e.target.value)}>
          <option value="">— Seleccionar —</option>
          {ORIENTACIONES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        <label className={lbl}>Notas de vibración / condiciones mecánicas</label>
        <input type="text" className={field} value={vibracion}
          onChange={e => setVibracion(e.target.value)}
          placeholder="Ej: Compresor a 6m — verificar amortiguación" />
      </Seccion>

      {/* ── Civil / sismo ── */}
      <Seccion title="Civil y sismo">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Tipo de suelo (NTC-RSEE)</label>
            <select className={sel} value={tipoSuelo} onChange={e => setTipoSuelo(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {TIPOS_SUELO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Zona sísmica (MDOC-CFE / NTC-RSEE)</label>
            <select className={sel} value={zonaSis} onChange={e => setZonaSis(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {ZONAS_SISMICAS.map(z => <option key={z} value={z}>Zona {z}</option>)}
            </select>
          </div>
        </div>

        <label className={lbl}>Profundidad de enterrado (m) — si aplica</label>
        <input type="number" min={0} step={0.1} className={field} value={profundidad}
          onChange={e => setProfundidad(e.target.value)} placeholder="Dejar vacío si va en superficie" />
      </Seccion>

      {/* ── Clasificación de área ── */}
      <Seccion title="Clasificación de área eléctrica">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Clasificación del área (NOM-022-STPS)</label>
            <select className={sel} value={clasArea} onChange={e => setClasArea(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {CLASES_AREA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Clase / División / Zona (detalle)</label>
            <input type="text" className={field} value={clasDiv}
              onChange={e => setClasDiv(e.target.value)}
              placeholder="Ej: Clase I Div 2 Grupo D" />
            <p className="text-[10.5px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink3)' }}>
              Sistema NEC/NOM: <b style={{ color: 'var(--ink2)' }}>Clase I</b> = gases/vapores inflamables;
              <b style={{ color: 'var(--ink2)' }}> Div 1</b> = atmósfera peligrosa en operación normal,
              <b style={{ color: 'var(--ink2)' }}> Div 2</b> = solo en falla.
              Sistema IEC: <b style={{ color: 'var(--ink2)' }}>Zona 0</b> = continuo,
              <b style={{ color: 'var(--ink2)' }}> Zona 1</b> = probable,
              <b style={{ color: 'var(--ink2)' }}> Zona 2</b> = infrecuente.
              Gas natural = Grupo D (NEC) / Grupo IIA (IEC).
            </p>
          </div>
        </div>
      </Seccion>

      {/* ── Instrumento real ── */}
      <Seccion title={`Instrumento seleccionado${f1.tecnologia_nombre ? ` — ${f1.tecnologia_nombre}` : ''}`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Fabricante</label>
            <input type="text" className={field} value={fabricante}
              onChange={e => setFabricante(e.target.value)} placeholder="Ej: SICK, Emerson, Krohne" />
          </div>
          <div>
            <label className={lbl}>Modelo / Serie comercial</label>
            <input type="text" className={field} value={modelo}
              onChange={e => setModelo(e.target.value)} placeholder="Ej: FLOWSIC600-XT" />
          </div>
        </div>
        <label className={lbl}>Número de serie (si disponible)</label>
        <input type="text" className={field} value={serie}
          onChange={e => setSerie(e.target.value)} placeholder="Dejar vacío hasta recepción del equipo" />

        <p className="text-xs mt-4 mb-1" style={{ color: 'var(--ink3)' }}>Dimensiones físicas</p>
        <div className="grid grid-cols-5 gap-3">
          {[
            ['Largo (mm)', largo, setLargo],
            ['Ancho (mm)', ancho, setAncho],
            ['Alto (mm)',  alto,  setAlto],
            ['Face-to-face (mm)', f2f, setF2f],
            ['Peso (kg)', peso, setPeso],
          ].map(([lbTxt, val, setVal]) => (
            <div key={lbTxt as string}>
              <label className={lbl}>{lbTxt as string}</label>
              <input type="number" min={0} className={field}
                value={val as string}
                onChange={e => (setVal as (v: string) => void)(e.target.value)} />
            </div>
          ))}
        </div>
      </Seccion>

      {/* ── Acciones ── */}
      {err && (
        <p className="text-sm mt-2 rounded-md px-3 py-2" style={{ background: 'rgba(184,64,48,0.08)', color: '#b84030', border: '1px solid rgba(184,64,48,0.2)' }}>
          {err}
        </p>
      )}
      {ok && (
        <p className="text-sm mt-2 rounded-md px-3 py-2" style={{ background: 'rgba(45,140,78,0.08)', color: '#2d8c4e', border: '1px solid rgba(45,140,78,0.2)' }}>
          Datos de Fase 2 guardados. Redirigiendo…
        </p>
      )}

      <div className="flex gap-3 mt-8">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {saving ? 'Guardando…' : 'Guardar Fase 2 →'}
        </button>
        <a
          href={`/proyectos/${proyectoId}`}
          className="rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-[#eef4f7]"
          style={{ border: '1px solid var(--line)', color: 'var(--ink2)' }}
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}

function Seccion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-6 mb-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <h3 className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--ink3)' }}>
        {title}
      </h3>
      <div className="h-px mb-1" style={{ background: 'var(--line)' }} />
      {children}
    </div>
  )
}
