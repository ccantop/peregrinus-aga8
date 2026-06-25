-- Migración 0002: Autenticación y Row Level Security
-- Requiere ejecutar DESPUÉS de 0001_schema_inicial.sql

-- ─── Agregar columna user_id a proyectos ─────────────────────────────────────

alter table proyectos
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists proyectos_user_id_idx on proyectos (user_id);

-- ─── Habilitar RLS ────────────────────────────────────────────────────────────

alter table proyectos   enable row level security;
alter table fase1_datos enable row level security;
alter table fase2_datos enable row level security;
alter table actividades enable row level security;

-- ─── Políticas: proyectos ─────────────────────────────────────────────────────

create policy "usuario ve sus proyectos"
  on proyectos for select
  using (user_id = auth.uid());

create policy "usuario crea sus proyectos"
  on proyectos for insert
  with check (user_id = auth.uid());

create policy "usuario edita sus proyectos"
  on proyectos for update
  using (user_id = auth.uid());

create policy "usuario borra sus proyectos"
  on proyectos for delete
  using (user_id = auth.uid());

-- ─── Políticas: fase1_datos (hereda via proyecto) ────────────────────────────

create policy "usuario ve fase1 de sus proyectos"
  on fase1_datos for select
  using (proyecto_id in (select id from proyectos where user_id = auth.uid()));

create policy "usuario inserta fase1 en sus proyectos"
  on fase1_datos for insert
  with check (proyecto_id in (select id from proyectos where user_id = auth.uid()));

create policy "usuario actualiza fase1 de sus proyectos"
  on fase1_datos for update
  using (proyecto_id in (select id from proyectos where user_id = auth.uid()));

-- ─── Políticas: fase2_datos ───────────────────────────────────────────────────

create policy "usuario ve fase2 de sus proyectos"
  on fase2_datos for select
  using (proyecto_id in (select id from proyectos where user_id = auth.uid()));

create policy "usuario inserta fase2 en sus proyectos"
  on fase2_datos for insert
  with check (proyecto_id in (select id from proyectos where user_id = auth.uid()));

create policy "usuario actualiza fase2 de sus proyectos"
  on fase2_datos for update
  using (proyecto_id in (select id from proyectos where user_id = auth.uid()));

-- ─── Políticas: actividades ───────────────────────────────────────────────────

create policy "usuario ve actividades de sus proyectos"
  on actividades for select
  using (proyecto_id in (select id from proyectos where user_id = auth.uid()));

create policy "usuario inserta actividades en sus proyectos"
  on actividades for insert
  with check (proyecto_id in (select id from proyectos where user_id = auth.uid()));

create policy "usuario actualiza actividades de sus proyectos"
  on actividades for update
  using (proyecto_id in (select id from proyectos where user_id = auth.uid()));
