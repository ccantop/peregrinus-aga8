-- Peregrinus — Schema inicial
-- Plataforma de diseño de puntos de medición de gas natural

create extension if not exists "uuid-ossp";

-- ─── Proyectos ────────────────────────────────────────────────────────────────

create table proyectos (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text not null,
  cliente       text,
  tipo_punto    text not null check (tipo_punto in ('city_gate','industrial','ducto','auditoria')),
  descripcion   text,
  fase_actual   text not null default 'fase1' check (fase_actual in ('fase1','fase2')),
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ─── Fase 1: Datos preliminares ───────────────────────────────────────────────

create table fase1_datos (
  id            uuid primary key default uuid_generate_v4(),
  proyecto_id   uuid not null references proyectos(id) on delete cascade,

  -- Proceso / fluido
  fiscal        boolean not null default false,
  fluido        text not null check (fluido in ('gn','glp')),
  qmin          numeric not null,
  qnorm         numeric not null,
  qmax          numeric not null,
  presion_kgcm2 numeric not null,
  diametro_pulg numeric not null,
  clase_localizacion text not null default 'na',

  -- Variables avanzadas (opcionales en fase 1)
  sg                  numeric,
  co2_pct             numeric,
  n2_pct              numeric,
  viscosidad_cp       numeric,
  toma_diferencial    text,
  elevacion_msnm      numeric,
  patm_kpa            numeric,
  tamb_min_c          numeric,
  p_base_kpa          numeric,
  t_base_c            numeric,
  dew_agua_c          numeric,
  dew_hc_c            numeric,
  dp_regulador_bar    numeric,

  -- Resultado del motor de reglas (cacheado)
  tecnologia_key      text,
  tecnologia_nombre   text,
  tecnologia_motivo   text,

  -- Normativa bloqueada al pasar a Fase 2
  normativa_bloqueada boolean not null default false,

  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  unique (proyecto_id)
);

-- ─── Fase 2: Datos de detalle ─────────────────────────────────────────────────

create table fase2_datos (
  id            uuid primary key default uuid_generate_v4(),
  proyecto_id   uuid not null references proyectos(id) on delete cascade,

  -- Levantamiento físico
  interferencias_descripcion text,
  tramos_rectos_disponibles  numeric,
  orientacion_instalacion    text,
  vibracion_notas            text,
  espacio_fisico_cm2         numeric,

  -- Civil / sismo
  tipo_suelo                 text,
  zona_sismica               text,
  profundidad_enterrado_m    numeric,

  -- Eléctrico
  clasificacion_area         text,
  clase_division_zona        text,

  -- Instrumento real
  fabricante                 text,
  modelo                     text,
  numero_serie               text,
  dimensiones_json           jsonb,  -- largo/ancho/alto, face-to-face, etc.

  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  unique (proyecto_id)
);

-- ─── Actividades / huecos pendientes ─────────────────────────────────────────

create table actividades (
  id                      uuid primary key default uuid_generate_v4(),
  proyecto_id             uuid not null references proyectos(id) on delete cascade,
  actividad_id_interno    text not null,  -- ej. 'dictamen-uv', 'datos-proceso'
  nombre                  text not null,
  etapa                   smallint not null,
  estado                  text not null default 'falta' check (estado in ('tienes','falta','en_proceso')),
  responsable_rol         text not null,
  responsable_tipo        text not null check (responsable_tipo in ('interno_energon','externo_obligatorio','externo_opcional')),
  accion_sugerida         text,
  bloquea_exportacion_final boolean not null default false,
  notas                   text,
  actualizado_en          timestamptz not null default now(),

  unique (proyecto_id, actividad_id_interno)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

create index on proyectos (creado_en desc);
create index on actividades (proyecto_id, estado);
create index on actividades (proyecto_id, bloquea_exportacion_final) where bloquea_exportacion_final = true;

-- ─── Trigger updated_at ───────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end;
$$;

create trigger trg_proyectos_updated before update on proyectos
  for each row execute function set_updated_at();
create trigger trg_fase1_updated before update on fase1_datos
  for each row execute function set_updated_at();
create trigger trg_fase2_updated before update on fase2_datos
  for each row execute function set_updated_at();
create trigger trg_actividades_updated before update on actividades
  for each row execute function set_updated_at();
