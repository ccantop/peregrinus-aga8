'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { guardarHojaDatos, type HojaDatosInput } from '@/lib/acciones/guardar-hoja-datos'
import {
  TIPOS_INST, TIPO_LABEL, SENALES, PROTOCOLOS, FUENTES,
  RATINGS, CONEXIONES, MATERIALES, CERTS_EX, GRADOS_IP, ESTADOS,
  type InstrumentoBase,
} from '@/lib/instrumentos'

const fi = 'w-full bg-[#f2f7f9] border border-[#cddde5] text-[#1b3044] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4a9ebb]'
const lb = 'block text-xs text-[#8aaabb] mb-1 mt-3'
const sl = fi + ' appearance-none cursor-pointer'

interface Props {
  proyectoId: string
  baseInst: InstrumentoBase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f1: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initial?: any
}

export default function HojaDatosForm({ proyectoId, baseInst, f1, initial }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')

  const n = (v: unknown) => (v === null || v === undefined || v === 'null' || v === '') ? null : Number(v)
  const s = (v: unknown, def = '') => (v ?? def) as string

  // ── Identificación ──
  const [tipoInst,    setTipoInst]    = useState(s(initial?.tipo_inst, baseInst.tipo_inst))
  const [servicio,    setServicio]    = useState(s(initial?.servicio, baseInst.servicio))
  const [lineaEquipo, setLineaEquipo] = useState(s(initial?.linea_equipo))
  const [revision,    setRevision]    = useState(s(initial?.revision, '0'))
  const [estado,      setEstado]      = useState<'borrador'|'revisado'|'aprobado'>(initial?.estado ?? 'borrador')

  // ── Proceso ──
  const [fluido,      setFluido]      = useState(s(initial?.fluido, f1?.fluido === 'gn' ? 'Gas natural' : 'GLP'))
  const [pOp,         setPOp]         = useState(s(initial?.presion_op_kgcm2, f1?.presion_kgcm2 ?? ''))
  const [pDis,        setPDis]        = useState(s(initial?.presion_dis_kgcm2, f1 ? (Number(f1.presion_kgcm2)*1.25).toFixed(1) : ''))
  const [tOp,         setTOp]         = useState(s(initial?.temp_op_c, '20'))
  const [tDis,        setTDis]        = useState(s(initial?.temp_dis_c, '60'))
  const [qMin,        setQMin]        = useState(s(initial?.caudal_min, f1?.qmin ?? ''))
  const [qNom,        setQNom]        = useState(s(initial?.caudal_nom, f1?.qnorm ?? ''))
  const [qMax,        setQMax]        = useState(s(initial?.caudal_max, f1?.qmax ?? ''))
  const [densidad,    setDensidad]    = useState(s(initial?.densidad_kgm3))
  const [viscosidad,  setViscosidad]  = useState(s(initial?.viscosidad_cp, f1?.viscosidad_cp ?? ''))

  // ── Especificación ──
  const [fabEsp,    setFabEsp]    = useState(s(initial?.fabricante_esp))
  const [fabReal,   setFabReal]   = useState(s(initial?.fabricante_real, f1?.fabricante ?? ''))
  const [modelo,    setModelo]    = useState(s(initial?.modelo, f1?.modelo ?? ''))
  const [serie,     setSerie]     = useState(s(initial?.numero_serie, f1?.numero_serie ?? ''))
  const [rangoMin,  setRangoMin]  = useState(s(initial?.rango_min, '0'))
  const [rangoMax,  setRangoMax]  = useState(s(initial?.rango_max))
  const [unidad,    setUnidad]    = useState(s(initial?.unidad_rango, baseInst.unidad_rango))
  const [exactitud, setExactitud] = useState(s(initial?.exactitud_pct))
  const [senal,     setSenal]     = useState(s(initial?.senal_salida, baseInst.senal_salida))
  const [fuente,    setFuente]    = useState(s(initial?.fuente_alimentacion, '24 VDC (lazo)'))
  const [proto,     setProto]     = useState(s(initial?.protocolo_com, baseInst.protocolo_com))

  // ── Conexión ──
  const [conxProceso, setConxProceso] = useState(s(initial?.conexion_proceso, baseInst.conexion_proceso))
  const [tamConx,     setTamConx]     = useState(s(initial?.tamano_conexion, f1 ? `${f1.diametro_pulg}"` : ''))
  const [rating,      setRating]      = useState(s(initial?.rating_conexion, '300#'))
  const [matCuerpo,   setMatCuerpo]   = useState(s(initial?.material_cuerpo, '316 SS'))
  const [matMojadas,  setMatMojadas]  = useState(s(initial?.material_partes_mojadas, baseInst.material_partes_mojadas))

  // ── Eléctrico / instalación ──
  const [clasArea,  setClasArea]  = useState(s(initial?.clasificacion_area, f1?.clasificacion_area ?? ''))
  const [certEx,    setCertEx]    = useState(s(initial?.certificacion_ex, 'N/A'))
  const [gradoIP,   setGradoIP]   = useState(s(initial?.grado_proteccion, 'IP65'))
  const [montaje,   setMontaje]   = useState(s(initial?.montaje))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr('')
    const payload: HojaDatosInput = {
      proyecto_id: proyectoId,
      tag: baseInst.tag,
      tipo_inst: tipoInst,
      servicio, linea_equipo: lineaEquipo,
      fluido,
      presion_op_kgcm2: n(pOp), presion_dis_kgcm2: n(pDis),
      temp_op_c: n(tOp), temp_dis_c: n(tDis),
      caudal_min: n(qMin), caudal_nom: n(qNom), caudal_max: n(qMax),
      densidad_kgm3: n(densidad), viscosidad_cp: n(viscosidad),
      fabricante_esp: fabEsp, fabricante_real: fabReal,
      modelo, numero_serie: serie,
      rango_min: n(rangoMin), rango_max: n(rangoMax),
      unidad_rango: unidad, exactitud_pct: n(exactitud),
      senal_salida: senal, fuente_alimentacion: fuente, protocolo_com: proto,
      conexion_proceso: conxProceso, tamano_conexion: tamConx,
      rating_conexion: rating, material_cuerpo: matCuerpo,
      material_partes_mojadas: matMojadas,
      clasificacion_area: clasArea, certificacion_ex: certEx,
      grado_proteccion: gradoIP, montaje,
      revision, estado,
    }
    const res = await guardarHojaDatos(payload)
    setSaving(false)
    if (res.ok) {
      router.push(`/proyectos/${proyectoId}/instrumentos`)
    } else {
      setErr(res.error ?? 'Error desconocido')
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-0">

      {/* ── Identificación ── */}
      <Sec title="Identificación">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lb}>Tag</label>
            <input className={fi} value={baseInst.tag} readOnly
              style={{ opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
          <div>
            <label className={lb}>Tipo de instrumento</label>
            <select className={sl} value={tipoInst} onChange={e => setTipoInst(e.target.value)}>
              {TIPOS_INST.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
            </select>
          </div>
        </div>
        <label className={lb}>Descripción del servicio</label>
        <input className={fi} value={servicio} onChange={e => setServicio(e.target.value)} />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={lb}>Línea / equipo</label>
            <input className={fi} value={lineaEquipo} onChange={e => setLineaEquipo(e.target.value)}
              placeholder="Ej: L-100-GN-6" />
          </div>
          <div>
            <label className={lb}>Revisión</label>
            <input className={fi} value={revision} onChange={e => setRevision(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Estado</label>
            <select className={sl} value={estado} onChange={e => setEstado(e.target.value as typeof estado)}>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </Sec>

      {/* ── Datos de proceso ── */}
      <Sec title="Datos de proceso">
        <label className={lb}>Fluido</label>
        <input className={fi} value={fluido} onChange={e => setFluido(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lb}>Presión operación (kg/cm²)</label>
            <input type="number" className={fi} value={pOp} onChange={e => setPOp(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Presión diseño (kg/cm²)</label>
            <input type="number" className={fi} value={pDis} onChange={e => setPDis(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Temperatura operación (°C)</label>
            <input type="number" className={fi} value={tOp} onChange={e => setTOp(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Temperatura diseño (°C)</label>
            <input type="number" className={fi} value={tDis} onChange={e => setTDis(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={lb}>Qmín (m³/h)</label>
            <input type="number" className={fi} value={qMin} onChange={e => setQMin(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Qnom (m³/h)</label>
            <input type="number" className={fi} value={qNom} onChange={e => setQNom(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Qmáx (m³/h)</label>
            <input type="number" className={fi} value={qMax} onChange={e => setQMax(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Densidad (kg/m³)</label>
            <input type="number" className={fi} value={densidad} onChange={e => setDensidad(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Viscosidad (cP)</label>
            <input type="number" step="0.001" className={fi} value={viscosidad} onChange={e => setViscosidad(e.target.value)} />
          </div>
        </div>
      </Sec>

      {/* ── Especificación ── */}
      <Sec title="Especificación del instrumento">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lb}>Fabricante especificado</label>
            <input className={fi} value={fabEsp} onChange={e => setFabEsp(e.target.value)}
              placeholder="Ej: SICK, Emerson, Rosemount" />
          </div>
          <div>
            <label className={lb}>Fabricante real (compra)</label>
            <input className={fi} value={fabReal} onChange={e => setFabReal(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Modelo</label>
            <input className={fi} value={modelo} onChange={e => setModelo(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Número de serie</label>
            <input className={fi} value={serie} onChange={e => setSerie(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={lb}>Rango mín</label>
            <input type="number" className={fi} value={rangoMin} onChange={e => setRangoMin(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Rango máx</label>
            <input type="number" className={fi} value={rangoMax} onChange={e => setRangoMax(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Unidad</label>
            <input className={fi} value={unidad} onChange={e => setUnidad(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Exactitud (%)</label>
            <input type="number" step="0.01" className={fi} value={exactitud} onChange={e => setExactitud(e.target.value)} />
          </div>
          <div>
            <label className={lb}>Señal de salida</label>
            <select className={sl} value={senal} onChange={e => setSenal(e.target.value)}>
              {SENALES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={lb}>Protocolo</label>
            <select className={sl} value={proto} onChange={e => setProto(e.target.value)}>
              {PROTOCOLOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={lb}>Fuente de alimentación</label>
            <select className={sl} value={fuente} onChange={e => setFuente(e.target.value)}>
              {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </Sec>

      {/* ── Conexión de proceso ── */}
      <Sec title="Conexión de proceso y materiales">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lb}>Tipo de conexión</label>
            <select className={sl} value={conxProceso} onChange={e => setConxProceso(e.target.value)}>
              {CONEXIONES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lb}>Tamaño de conexión</label>
            <input className={fi} value={tamConx} onChange={e => setTamConx(e.target.value)}
              placeholder={`Ej: ${f1?.diametro_pulg ?? '4'}" Sch 40`} />
          </div>
          <div>
            <label className={lb}>Rating / clase de presión</label>
            <select className={sl} value={rating} onChange={e => setRating(e.target.value)}>
              {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={lb}>Material del cuerpo</label>
            <select className={sl} value={matCuerpo} onChange={e => setMatCuerpo(e.target.value)}>
              {MATERIALES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={lb}>Material partes mojadas</label>
            <select className={sl} value={matMojadas} onChange={e => setMatMojadas(e.target.value)}>
              {MATERIALES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </Sec>

      {/* ── Eléctrico / instalación ── */}
      <Sec title="Eléctrico e instalación">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lb}>Clasificación de área</label>
            <input className={fi} value={clasArea} onChange={e => setClasArea(e.target.value)}
              placeholder="Ej: Clase I División 2" />
          </div>
          <div>
            <label className={lb}>Certificación Ex</label>
            <select className={sl} value={certEx} onChange={e => setCertEx(e.target.value)}>
              {CERTS_EX.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lb}>Grado de protección</label>
            <select className={sl} value={gradoIP} onChange={e => setGradoIP(e.target.value)}>
              {GRADOS_IP.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={lb}>Tipo de montaje</label>
            <input className={fi} value={montaje} onChange={e => setMontaje(e.target.value)}
              placeholder="Ej: Directo en línea, en bypass, en pozo" />
          </div>
        </div>
      </Sec>

      {err && (
        <p className="text-sm mt-2 rounded-md px-3 py-2"
          style={{ background: 'rgba(184,64,48,0.08)', color: '#b84030', border: '1px solid rgba(184,64,48,0.2)' }}>
          {err}
        </p>
      )}

      <div className="flex gap-3 mt-8">
        <button type="submit" disabled={saving}
          className="rounded-md px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {saving ? 'Guardando…' : 'Guardar hoja →'}
        </button>
        <a href={`/proyectos/${proyectoId}/instrumentos`}
          className="rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-[#eef4f7]"
          style={{ border: '1px solid var(--line)', color: 'var(--ink2)' }}>
          Cancelar
        </a>
      </div>
    </form>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-6 mb-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <h3 className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--ink3)' }}>{title}</h3>
      <div className="h-px mb-1" style={{ background: 'var(--line)' }} />
      {children}
    </div>
  )
}
