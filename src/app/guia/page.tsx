import Link from 'next/link'

const PASOS = [
  {
    num: '01',
    fase: 'Fase 1',
    titulo: 'Diseño de oficina — condiciones de proceso',
    color: 'var(--accent)',
    bg: 'rgba(74,158,187,0.07)',
    border: 'rgba(74,158,187,0.25)',
    items: [
      'Nombre del proyecto, cliente y tipo de punto (City Gate, Industrial, Ducto, Auditoría)',
      'Definir si es custodia fiscal ante el SAT (RMF Anexo 21) — cambia los requisitos normativos',
      'Caudales de operación: Qmín, Qnorm y Qmáx en m³/h a condiciones de referencia (101.325 kPa / 15.6 °C)',
      'Presión de operación en kg/cm² y diámetro nominal en pulgadas',
      'Composición del gas: gravedad específica (SG), % CO₂ y % N₂',
      'Variables avanzadas: ΔP en regulador, punto de rocío de agua y de HC, temperatura mínima de diseño',
      'El motor de reglas selecciona automáticamente la tecnología de medición y justifica la elección',
      'Se calcula el factor Z (AGA 8 DETAIL si el servicio Python está activo, Papay como respaldo) y el efecto Joule-Thomson en la etapa de regulación',
    ],
    salida: 'Proyecto guardado con tecnología recomendada, alertas de diseño y cálculo de Z.',
    req: 'Hoja de datos de proceso del cliente o estimado de ingeniería básica.',
  },
  {
    num: '02',
    fase: 'Fase 2',
    titulo: 'Datos de sitio — condiciones físicas y eléctricas',
    color: '#7b5ea7',
    bg: 'rgba(123,94,167,0.06)',
    border: 'rgba(123,94,167,0.2)',
    items: [
      'Orientación de la instalación (horizontal, vertical, inclinado)',
      'Tramos rectos disponibles aguas arriba y aguas abajo del medidor, expresados en diámetros (D). AGA 9 exige 10D u/a para ultrasónico; AGA 3 requiere 20–40D para orificio',
      'Clasificación de área eléctrica: Clase / División (NEC) o Zona (IEC 60079) — determina la certificación Ex requerida para todos los instrumentos',
      'Zona sísmica según MDOC-CFE / NTC-RSEE — afecta el diseño estructural del skid',
      'Tipo de suelo (SUCS: roca, arena, arcilla blanda) para el análisis de cimentación',
      'Datos del medidor si ya está cotizado: fabricante, modelo, número de serie',
    ],
    salida: 'Datos de sitio guardados; estos se incluyen en las hojas de datos y en el P&ID.',
    req: 'Visita al sitio o plano de planta del cliente. Reporte de mecánica de suelos si aplica.',
  },
  {
    num: '03',
    fase: 'Hojas de datos',
    titulo: 'Instrumentos ISA/IEC — especificación individual',
    color: '#2d8c4e',
    bg: 'rgba(45,140,78,0.06)',
    border: 'rgba(45,140,78,0.2)',
    items: [
      'El sistema genera automáticamente los 8 instrumentos de la estación según la tecnología seleccionada: PT-101 (presión entrada), TT-101 (temperatura), FE-100/FT-100 (elemento y transmisor de flujo), PCV-100 (válvula reguladora), PT-102 (presión salida), FQI-100 (computador de flujo) y SEP-100 (separador/filtro)',
      'Cada instrumento tiene su hoja de datos formato ISA 5.1 / IEC 61511 con: datos de proceso, especificación del instrumento, materiales, conexiones, señal de salida y clasificación de área',
      'Los campos se pre-llenan con los datos de Fase 1; el ingeniero los refina con la información de fabricante',
      'Estado: borrador → revisado → aprobado',
      '"Generar hojas de datos ↓" exporta las 8 hojas en un solo PDF listo para RFQ o paquete de compras',
    ],
    salida: 'Hojas de datos ISA/IEC en PDF, una por instrumento y paquete completo.',
    req: 'Cotizaciones de fabricantes para llenar modelo, exactitud real y datos de certificación Ex.',
  },
  {
    num: '04',
    fase: 'Exportar',
    titulo: 'Generación de documentos de ingeniería',
    color: '#c17f24',
    bg: 'rgba(193,127,36,0.06)',
    border: 'rgba(193,127,36,0.2)',
    items: [
      'Generar P&ID ↓ — Diagrama de tuberías e instrumentación en formato DXF (AutoCAD). Incluye simbología ISA 5.1: válvulas, instrumentos con burbujas, líneas de proceso y tabla de etiquetas (tag list)',
      'Generar reporte ↓ — Reporte técnico en PDF: resumen del proyecto, condiciones de proceso, tecnología seleccionada, metodología AGA 8 y marco normativo',
      'Generar memoria ↓ — Memoria de cálculo en PDF (3 páginas): datos de entrada, cálculo del factor Z paso a paso, efecto Joule-Thomson, selección de tecnología con criterios y marco normativo completo con las normas que aplican al proyecto',
    ],
    salida: 'Paquete de documentos de ingeniería básica: DXF + PDF reporte + PDF memoria.',
    req: 'Fase 1 completa. Fase 2 recomendada para que el P&ID incluya datos de sitio.',
  },
  {
    num: '05',
    fase: 'Ingeniería de detalle',
    titulo: 'Fuera del sistema — pasos manuales',
    color: '#b84030',
    bg: 'rgba(184,64,48,0.05)',
    border: 'rgba(184,64,48,0.18)',
    items: [
      'Ingeniería civil y estructural del skid: análisis sísmico (MDOC-CFE zona correspondiente), diseño de cimentación según tipo de suelo y diseño mecánico del bastidor',
      'Cálculo hidráulico completo con software especializado (PIPESIM, HYSYS) para verificar caídas de presión reales',
      'Diseño eléctrico: diagramas unifilares, lista de cargas, alimentación de instrumentos (24VDC / 120VAC), puesta a tierra',
      'Especificación de tuberías: selección de clase, material, bridas, válvulas de bloqueo y venteos',
      'Revisión por ingeniero responsable con cédula profesional — los documentos de Peregrin son borrador hasta que lleven firma',
      'Sometimiento a Unidad de Verificación (UV) acreditada ante ASEA para proyectos con custodia fiscal o con interconexión a SISTRANGAS',
      'Gestión de permisos ante ASEA: registro de instalación, plan de medición y pruebas de arranque',
      'Interconexión a CENAGAS/SISTRANGAS (si aplica): nodo de medición, telemetría SCADA y acreditación del punto ante el Operador',
    ],
    salida: 'Expediente técnico completo, aprobado por UV y ASEA. Punto operativo.',
    req: 'Todos los documentos de Peregrin + firmas de ingenieros + UV acreditada + permiso ASEA.',
  },
]

const ACRON = [
  { clave: 'AGA', largo: 'American Gas Association', desc: 'Asociación de la industria del gas en EUA. Publica los reportes técnicos que definen cómo medir gas natural: AGA 3 (orificio), AGA 7 (turbina), AGA 8 (factor Z), AGA 9 (ultrasónico), AGA 11 (Coriolis).' },
  { clave: 'API', largo: 'American Petroleum Institute', desc: 'Instituto de estándares de la industria petrolera de EUA. API 14.3 es la versión API del AGA 3 para placa de orificio. API MPMS (Manual of Petroleum Measurement Standards) cubre toda la metrología de hidrocarburos.' },
  { clave: 'ASEA', largo: 'Agencia de Seguridad, Energía y Ambiente', desc: 'Órgano regulador mexicano para el sector de hidrocarburos y electricidad. Otorga permisos, acredita Unidades de Verificación (UV) y vigila el cumplimiento de la NOM-020-ASEA-2024.' },
  { clave: 'CENAGAS', largo: 'Centro Nacional de Control del Gas Natural', desc: 'Empresa productiva del Estado encargada de operar el SISTRANGAS (red de ductos de transporte de gas natural en México). Todo punto de medición conectado a la red de transporte requiere su aprobación.' },
  { clave: 'CFE', largo: 'Comisión Federal de Electricidad', desc: 'Empresa eléctrica del Estado mexicano. En el contexto de Peregrin, se referencia el MDOC-CFE (Manual de Diseño por Sismo de la CFE) para el diseño sismorresistente de las instalaciones.' },
  { clave: 'Ex / ATEX', largo: 'Equipo para atmósferas explosivas', desc: 'Certificación de seguridad para instrumentos instalados en zonas con riesgo de atmósfera inflamable (gas). En EUA se usa el sistema NEC Clase/División; en Europa e internacionalmente se usa IEC 60079 con Zonas. México acepta ambos.' },
  { clave: 'GERG', largo: 'Groupe Européen de Recherches Gazières', desc: 'Consorcio europeo de investigación del gas. Desarrolló la ecuación de estado GERG-2008, la más precisa para gas natural. AGA 8 DETAIL es una implementación simplificada compatible con GERG para el rango de condiciones operativas típico.' },
  { clave: 'IEC', largo: 'International Electrotechnical Commission', desc: 'Organismo internacional de estándares para equipos eléctricos y electrónicos. IEC 60079 define la clasificación de área y la certificación de equipos Ex. IEC 61511 define la seguridad funcional (SIL) para la industria de procesos.' },
  { clave: 'ISA', largo: 'International Society of Automation', desc: 'Sociedad de estándares de automatización e instrumentación. ISA 5.1 define la simbología e identificación de instrumentación (los "círculos" en un P&ID). ISA 18.2 cubre la gestión de alarmas.' },
  { clave: 'JT', largo: 'Joule-Thomson', desc: 'Efecto termodinámico por el que un gas real se enfría al expandirse a través de una válvula (proceso isoentálpico). Crítico en la etapa reguladora: una caída de presión grande puede bajar la temperatura del gas por debajo del punto de rocío del agua y formar hidratos.' },
  { clave: 'MDOC-CFE', largo: 'Manual de Diseño por Sismo de la CFE', desc: 'Norma sísmica de referencia para infraestructura industrial en México. Define zonas sísmicas A–D y los espectros de diseño. En CDMX se complementa con las NTC-RSEE del RCDF.' },
  { clave: 'NEC', largo: 'National Electrical Code', desc: 'Código eléctrico de EUA (NFPA 70). Define la clasificación de áreas peligrosas por Clase (tipo de material: I=gas, II=polvo, III=fibra) y División (frecuencia de presencia: 1=normal, 2=anormal). Ampliamente usado en México por la industria de hidrocarburos.' },
  { clave: 'NOM', largo: 'Norma Oficial Mexicana', desc: 'Regulación técnica de cumplimiento obligatorio en México, emitida por secretarías de Estado. NOM-020-ASEA-2024 es la norma central del proyecto: diseño, construcción, operación y mantenimiento de sistemas de medición de gas natural y gas LP.' },
  { clave: 'P&ID', largo: 'Piping and Instrumentation Diagram', desc: 'Diagrama de tuberías e instrumentación. Documento gráfico que muestra todos los equipos, tuberías, instrumentos y sus interconexiones de señal. Es el documento técnico de referencia durante construcción, arranque y operación. Peregrin lo genera en formato DXF.' },
  { clave: 'RMF', largo: 'Resolución Miscelánea Fiscal', desc: 'Disposición anual del SAT que regula aspectos fiscales. El Anexo 21 de la RMF establece los controles volumétricos obligatorios para contribuyentes en el sector de hidrocarburos: los medidores de custodia fiscal deben cumplir con NOM-020 y reportar al SAT.' },
  { clave: 'SAT', largo: 'Servicio de Administración Tributaria', desc: 'Autoridad fiscal de México. Para puntos de medición fiscal de gas natural, el SAT exige que los sistemas de medición estén certificados según NOM-020-ASEA-2024 y reporten consumos en tiempo real.' },
  { clave: 'SG', largo: 'Gravedad específica / Specific Gravity', desc: 'Relación entre la densidad del gas y la densidad del aire, ambas a las mismas condiciones (típicamente 15.6 °C y 101.325 kPa). Para gas natural, SG ≈ 0.55–0.70. Junto con CO₂ y N₂, permite calcular la composición aproximada para AGA 8.' },
  { clave: 'SISTRANGAS', largo: 'Sistema de Transporte y Almacenamiento Nacional Integrado de Gas Natural', desc: 'Red nacional de gasoductos de transporte de México, operada por CENAGAS. Los City Gates son puntos de entrega del SISTRANGAS a distribuidoras o usuarios finales; su medición es crítica para la facturación entre agentes del mercado.' },
  { clave: 'UV', largo: 'Unidad de Verificación', desc: 'Organismo acreditado por ASEA para verificar que instalaciones de medición cumplen con la NOM-020-ASEA-2024. Para puntos de custodia fiscal es obligatoria antes del arranque. Emite un dictamen de cumplimiento con vigencia definida.' },
  { clave: 'Z / Zc', largo: 'Factor de compresibilidad', desc: 'Corrección a la ley del gas ideal (PV = nZRT). Para gas natural real, Z < 1 en condiciones típicas de operación. Es el parámetro más crítico para la exactitud del cálculo de flujo volumétrico. NOM-020 exige el método AGA 8 DETAIL para medición fiscal.' },
]

export default function GuiaPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Hero */}
      <div className="flex items-center gap-6 mb-10">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Peregrin" width={80} height={80} style={{ objectFit: 'contain' }} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--ink)' }}>
            Cómo usar Peregrin
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink2)' }}>
            Peregrin es una plataforma de <strong style={{ color: 'var(--ink)' }}>ingeniería normativa de estaciones de medición de gas natural</strong> para México, alineada a <strong style={{ color: 'var(--ink)' }}>NOM-020-ASEA-2024</strong>.
            Genera automáticamente tecnología recomendada, documentos de ingeniería y hojas de datos
            de instrumentos — pero no reemplaza la revisión por ingeniero responsable ni la verificación
            por una UV acreditada.
          </p>
        </div>
      </div>

      {/* Flujo de trabajo */}
      <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--ink)' }}>
        Flujo de trabajo secuencial
      </h2>

      <div className="flex flex-col gap-4 mb-14">
        {PASOS.map((p) => (
          <div key={p.num} className="rounded-lg border p-5"
            style={{ background: p.bg, borderColor: p.border }}>

            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-[11px] font-mono font-bold"
                style={{ color: p.color }}>
                PASO {p.num}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded"
                style={{ background: p.color, color: '#fff', opacity: 0.9 }}>
                {p.fase}
              </span>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {p.titulo}
              </h3>
            </div>

            <ul className="text-xs leading-relaxed space-y-1.5 mb-3" style={{ color: 'var(--ink2)' }}>
              {p.items.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: p.color }} className="shrink-0 mt-0.5">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-1.5 border-t pt-3 mt-3"
              style={{ borderColor: p.border }}>
              <div className="flex gap-2 text-[10.5px]">
                <span className="font-semibold shrink-0" style={{ color: p.color }}>Salida:</span>
                <span style={{ color: 'var(--ink2)' }}>{p.salida}</span>
              </div>
              <div className="flex gap-2 text-[10.5px]">
                <span className="font-semibold shrink-0" style={{ color: p.color }}>Requiere:</span>
                <span style={{ color: 'var(--ink3)' }}>{p.req}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Métodos de cálculo */}
      <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--ink)' }}>
        Métodos de cálculo: AGA 8 y AGA 7
      </h2>

      <div className="rounded-lg border mb-6 overflow-hidden" style={{ borderColor: 'var(--line)' }}>
        {/* AGA 8 */}
        <div className="p-5 border-b" style={{ borderColor: 'var(--line)', background: 'rgba(74,158,187,0.05)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: 'rgba(74,158,187,0.15)', color: 'var(--accent)', border: '1px solid rgba(74,158,187,0.3)' }}>
              AGA 8 DETAIL
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              Factor de compresibilidad Z — comportamiento del gas real
            </span>
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--ink2)' }}>
            El gas natural no se comporta como gas ideal: a alta presión y baja temperatura,
            las moléculas interactúan entre sí. El <strong style={{ color: 'var(--ink)' }}>factor Z</strong> cuantifica esa desviación.
            Un gas ideal tiene Z = 1; el gas natural en condiciones típicas de operación tiene Z ≈ 0.85–0.95.
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--ink2)' }}>
            <strong style={{ color: 'var(--ink)' }}>AGA Report No. 8</strong> (implementado en Peregrin mediante la librería <em>pyaga8</em>) calcula Z
            a partir de la composición del gas, la presión y la temperatura usando la ecuación de estado
            GERG-2008. NOM-020-ASEA-2024 exige este método para medición fiscal.
          </p>
          <div className="rounded px-3 py-2 text-xs font-mono" style={{ background: 'var(--panel)', color: 'var(--ink2)', border: '1px solid var(--line)' }}>
            PV = nZRT &nbsp;→&nbsp; Z = PV / (nRT) &nbsp;→&nbsp; si Z &lt; 1, el gas ocupa menos volumen del esperado
          </div>
        </div>

        {/* AGA 7 */}
        <div className="p-5 border-b" style={{ borderColor: 'var(--line)', background: 'rgba(45,140,78,0.04)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: 'rgba(45,140,78,0.12)', color: '#2d8c4e', border: '1px solid rgba(45,140,78,0.3)' }}>
              AGA 7
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              Conversión a condiciones base — lo que se factura
            </span>
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--ink2)' }}>
            El medidor de turbina mide el volumen del gas <strong style={{ color: 'var(--ink)' }}>en condiciones de operación</strong> (alta presión,
            temperatura real del sitio). Pero los contratos de gas se facturan en <strong style={{ color: 'var(--ink)' }}>condiciones base</strong>
            {' '}(101.325 kPa y 15.6 °C). Un m³ a 50 kg/cm² vale mucho más que un m³ a presión atmosférica.
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--ink2)' }}>
            <strong style={{ color: 'var(--ink)' }}>AGA Report No. 7</strong> define la ecuación de corrección para medidores volumétricos (turbina,
            ultrasónico, orificio). Usa el Z calculado por AGA 8 para ambas condiciones:
          </p>
          <div className="rounded px-3 py-2 text-xs font-mono mb-3" style={{ background: 'var(--panel)', color: 'var(--ink2)', border: '1px solid var(--line)' }}>
            Qb = Qt × (Pf / Pb) × (Tb / Tf) × (Zb / Zf)
          </div>
          <ul className="text-xs leading-relaxed space-y-1" style={{ color: 'var(--ink2)' }}>
            <li><span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>Qt</span> — caudal que mide la turbina (condiciones de operación)</li>
            <li><span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>Qb</span> — caudal que se factura (condiciones base)</li>
            <li><span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>Pf / Pb</span> — relación de presiones: operación vs base (101.325 kPa)</li>
            <li><span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>Tb / Tf</span> — relación de temperaturas: base (288.75 K) vs operación</li>
            <li><span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>Zb / Zf</span> — corrección por no-idealidad: Z en base entre Z en operación</li>
          </ul>
        </div>

        {/* Relación entre ambos */}
        <div className="p-5" style={{ background: 'rgba(193,127,36,0.04)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: 'rgba(193,127,36,0.12)', color: '#c17f24', border: '1px solid rgba(193,127,36,0.3)' }}>
              RELACIÓN
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              Cómo trabajan juntos en Peregrin
            </span>
          </div>
          <div className="flex flex-col gap-2 text-xs" style={{ color: 'var(--ink2)' }}>
            <div className="flex gap-3 items-start">
              <span className="font-mono text-[10px] mt-0.5 shrink-0" style={{ color: 'var(--accent)' }}>1.</span>
              <span>El servicio Python (<em>pyaga8</em>) calcula <strong style={{ color: 'var(--ink)' }}>Z con AGA 8</strong> a partir de SG, CO₂, N₂, presión y temperatura de operación.</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="font-mono text-[10px] mt-0.5 shrink-0" style={{ color: 'var(--accent)' }}>2.</span>
              <span>Ese Z se usa como insumo en la ecuación <strong style={{ color: 'var(--ink)' }}>AGA 7</strong> para calcular el factor Fpv (supercompresibilidad) y los caudales corregidos a condiciones base.</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="font-mono text-[10px] mt-0.5 shrink-0" style={{ color: 'var(--accent)' }}>3.</span>
              <span>La <strong style={{ color: 'var(--ink)' }}>memoria de cálculo</strong> muestra ambos resultados: Z de AGA 8 en la sección de propiedades físicas, y Qb de AGA 7 en la sección de conversión a condiciones base.</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="font-mono text-[10px] mt-0.5 shrink-0" style={{ color: '#c17f24' }}>⚠</span>
              <span>Si el servicio Python no responde, Peregrin usa la correlación de <strong style={{ color: 'var(--ink)' }}>Papay</strong> como respaldo para Z. Es válida solo para screening preliminar — no para cómputo fiscal.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Glosario */}
      <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--ink)' }}>
        Glosario de acrónimos y organismos
      </h2>
      <p className="text-xs mb-5" style={{ color: 'var(--ink3)' }}>
        Marco normativo: NOM-020-ASEA-2024 · AGA Reports · API MPMS · ISA 5.1 · IEC 60079 · RMF Anexo 21
      </p>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
        {ACRON.map((a, i) => (
          <div key={a.clave}
            className="grid text-xs py-3 px-4 gap-4"
            style={{
              gridTemplateColumns: '80px 160px 1fr',
              borderBottom: i < ACRON.length - 1 ? '1px solid var(--line)' : 'none',
              background: i % 2 === 0 ? 'var(--panel)' : 'transparent',
            }}>
            <span className="font-mono font-bold self-start" style={{ color: 'var(--accent)' }}>
              {a.clave}
            </span>
            <span className="font-medium self-start" style={{ color: 'var(--ink)' }}>
              {a.largo}
            </span>
            <span className="leading-relaxed" style={{ color: 'var(--ink2)' }}>
              {a.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-10 flex items-center gap-4">
        <Link
          href="/"
          className="rounded-md px-5 py-2.5 text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Crear proyecto →
        </Link>
        <Link
          href="/proyectos"
          className="text-sm"
          style={{ color: 'var(--accent)' }}
        >
          Ver mis proyectos
        </Link>
      </div>
    </div>
  )
}
