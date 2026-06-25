-- Migración 0003: Hojas de datos de instrumentos (ISA/IEC)

create table hojas_datos (
  id            uuid primary key default uuid_generate_v4(),
  proyecto_id   uuid not null references proyectos(id) on delete cascade,

  -- Identificación
  tag           text not null,          -- PT-101, FE-100, etc.
  tipo_inst     text not null,          -- transmisor_presion, elemento_primario, etc.
  servicio      text,                   -- descripción del servicio
  linea_equipo  text,                   -- número de línea o equipo

  -- Datos de proceso
  fluido        text,
  presion_op_kgcm2   numeric,
  presion_dis_kgcm2  numeric,
  temp_op_c          numeric,
  temp_dis_c         numeric,
  caudal_min         numeric,
  caudal_nom         numeric,
  caudal_max         numeric,
  densidad_kgm3      numeric,
  viscosidad_cp      numeric,

  -- Especificación del instrumento
  fabricante_esp     text,              -- fabricante especificado (diseño)
  fabricante_real    text,              -- fabricante real (compra)
  modelo             text,
  numero_serie       text,
  rango_min          numeric,
  rango_max          numeric,
  unidad_rango       text,
  exactitud_pct      numeric,
  senal_salida       text,              -- 4-20mA, HART, Modbus, Profibus, etc.
  fuente_alimentacion text,             -- 24VDC, 120VAC, etc.
  protocolo_com      text,              -- HART, Modbus RTU, FF, etc.

  -- Conexión de proceso
  conexion_proceso   text,              -- brida, NPT, etc.
  tamano_conexion    text,              -- 1/2", DN25, etc.
  rating_conexion    text,              -- 150#, 300#, 600#, etc.
  material_cuerpo    text,
  material_partes_mojadas text,

  -- Instalación / eléctrico
  clasificacion_area text,
  certificacion_ex   text,              -- ATEX, IECEx, NOM, FM, etc.
  grado_proteccion   text,              -- IP65, IP67, NEMA 4X, etc.
  montaje            text,

  -- Estado
  revision           text not null default '0',
  estado             text not null default 'borrador'
                     check (estado in ('borrador','revisado','aprobado')),

  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now(),

  unique (proyecto_id, tag)
);

create index on hojas_datos (proyecto_id);

create trigger trg_hojas_datos_updated before update on hojas_datos
  for each row execute function set_updated_at();

-- RLS
alter table hojas_datos enable row level security;

create policy "usuario ve hojas de sus proyectos"
  on hojas_datos for select
  using (proyecto_id in (select id from proyectos where user_id = auth.uid()));

create policy "usuario inserta hojas en sus proyectos"
  on hojas_datos for insert
  with check (proyecto_id in (select id from proyectos where user_id = auth.uid()));

create policy "usuario actualiza hojas de sus proyectos"
  on hojas_datos for update
  using (proyecto_id in (select id from proyectos where user_id = auth.uid()));

create policy "usuario borra hojas de sus proyectos"
  on hojas_datos for delete
  using (proyecto_id in (select id from proyectos where user_id = auth.uid()));
