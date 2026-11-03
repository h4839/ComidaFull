-- =====================================================================
--  COMIDA FULL · Esquema de base de datos para Supabase
--  Pégalo completo en: Supabase → SQL Editor → New query → Run
--  Es seguro ejecutarlo varias veces (idempotente).
--
--  IMPORTANTE:
--  * Borra y recrea TODAS las políticas RLS de las tablas de la app
--    (perfiles, excedentes, recepciones, historial_excedente, notificaciones)
--    para que nadie pueda saltarse la aprobación del administrador.
--  * Si tu tabla "excedentes" actual usa un id que NO es uuid (por ejemplo
--    bigint), el script se detiene con un mensaje. Como solo tienes datos de
--    prueba, ejecuta antes:   drop table if exists public.excedentes cascade;
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 0. Comprobación de compatibilidad
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'excedentes'
      and column_name = 'id' and data_type <> 'uuid'
  ) then
    raise exception 'La tabla excedentes existente usa un id que no es uuid. Ejecuta primero: drop table if exists public.excedentes cascade;';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------
create table if not exists public.perfiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  rol                 text not null default 'comedor',
  nombre_organizacion text not null default '',
  responsable         text,
  telefono            text,
  direccion           text,
  horario_atencion    text,
  aprobado            boolean not null default false,
  created_at          timestamptz not null default now()
);
alter table public.perfiles add column if not exists correo     text;
alter table public.perfiles add column if not exists logo_url   text;
alter table public.perfiles add column if not exists activo     boolean not null default true;
alter table public.perfiles add column if not exists created_at timestamptz not null default now();

alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add  constraint perfiles_rol_check
  check (rol in ('donante', 'comedor', 'admin')) not valid;

create table if not exists public.excedentes (
  id              uuid primary key default gen_random_uuid(),
  donante_id      uuid not null references public.perfiles(id) on delete cascade,
  tipo_alimento   text not null,
  cantidad        numeric not null check (cantidad > 0),
  unidad          text not null default 'porciones',
  fecha_caducidad date not null,
  hora_limite     time not null,
  foto_url        text,
  estado          text not null default 'publicado',
  created_at      timestamptz not null default now()
);
alter table public.excedentes add column if not exists comedor_id uuid references public.perfiles(id);
alter table public.excedentes add column if not exists aceptado_at timestamptz;
alter table public.excedentes add column if not exists porciones integer;
alter table public.excedentes add column if not exists buen_estado_confirmado boolean not null default false;

alter table public.excedentes drop constraint if exists excedentes_estado_check;
alter table public.excedentes add  constraint excedentes_estado_check
  check (estado in ('publicado','aceptado','confirmado','rechazado','cancelado','vencido')) not valid;

-- Garantiza que donante_id apunte a perfiles (necesario para los joins del cliente)
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.contype = 'f'
      and c.conrelid  = 'public.excedentes'::regclass
      and c.confrelid = 'public.perfiles'::regclass
      and a.attname   = 'donante_id'
  ) then
    alter table public.excedentes
      add constraint excedentes_donante_perfil_fkey
      foreign key (donante_id) references public.perfiles(id) on delete cascade not valid;
  end if;
end $$;

create index if not exists excedentes_estado_caducidad_idx on public.excedentes (estado, fecha_caducidad);
create index if not exists excedentes_donante_idx          on public.excedentes (donante_id);
create index if not exists excedentes_comedor_idx          on public.excedentes (comedor_id);

create table if not exists public.recepciones (
  id                   uuid primary key default gen_random_uuid(),
  excedente_id         uuid not null unique references public.excedentes(id) on delete cascade,
  comedor_id           uuid not null references public.perfiles(id),
  cantidad_recibida    numeric,
  porciones_rescatadas integer not null default 0,
  resultado            text not null check (resultado in ('confirmada','rechazada')),
  motivo               text,
  fecha                timestamptz not null default now()
);

create table if not exists public.historial_excedente (
  id           bigint generated always as identity primary key,
  excedente_id uuid not null references public.excedentes(id) on delete cascade,
  estado       text not null,
  detalle      text,
  fecha        timestamptz not null default now()
);
create index if not exists historial_excedente_idx on public.historial_excedente (excedente_id, fecha);

create table if not exists public.notificaciones (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references public.perfiles(id) on delete cascade,
  excedente_id uuid references public.excedentes(id) on delete cascade,
  mensaje      text not null,
  leida        boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists notificaciones_usuario_idx on public.notificaciones (usuario_id, leida, created_at desc);

-- ---------------------------------------------------------------------
-- 2. Funciones auxiliares
-- ---------------------------------------------------------------------
create or replace function public.hoy_mx() returns date
language sql stable as $$ select (now() at time zone 'America/Mexico_City')::date $$;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.perfiles
                 where id = auth.uid() and rol = 'admin' and activo)
$$;

create or replace function public.rol_aprobado(p_rol text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.perfiles
                 where id = auth.uid() and rol = p_rol and aprobado and activo)
$$;

-- ---------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------

-- 3.1 Al crear un usuario en Auth se crea su perfil (SIN aprobar).
--     Los datos vienen de options.data en signUp(). Nunca se acepta "admin".
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.perfiles
    (id, rol, nombre_organizacion, responsable, telefono, direccion, horario_atencion, correo, aprobado, activo)
  values (
    new.id,
    case when m->>'rol' = 'donante' then 'donante' else 'comedor' end,
    coalesce(m->>'nombre_organizacion', ''),
    m->>'responsable', m->>'telefono', m->>'direccion', m->>'horario_atencion',
    new.email, false, true
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.2 Validaciones al publicar (RF-06, RF-07, RF-08)
create or replace function public.validar_excedente() returns trigger
language plpgsql as $$
begin
  if new.fecha_caducidad < public.hoy_mx() then
    raise exception 'No se puede publicar un alimento ya caducado.';
  end if;
  if not coalesce(new.buen_estado_confirmado, false) then
    raise exception 'Debes confirmar que la comida está en buen estado.';
  end if;
  if new.foto_url is null or new.foto_url = '' then
    raise exception 'Adjunta al menos una foto del alimento.';
  end if;
  new.estado     := 'publicado';
  new.comedor_id := null;
  if new.porciones is null or new.porciones <= 0 then
    new.porciones := case when new.unidad in ('porciones','piezas')
                          then round(new.cantidad)::int
                          else round(new.cantidad * 4)::int end;
  end if;
  return new;
end $$;

drop trigger if exists trg_validar_excedente on public.excedentes;
create trigger trg_validar_excedente
  before insert on public.excedentes
  for each row execute function public.validar_excedente();

-- 3.3 Historial de cada lote (RF-14)
create or replace function public.historial_alta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.historial_excedente (excedente_id, estado, detalle)
  values (new.id, new.estado, 'Publicado por la empresa');
  return new;
end $$;

create or replace function public.historial_cambio() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_detalle text;
begin
  if new.estado = 'aceptado' then
    select 'Aceptado por ' || nombre_organizacion into v_detalle
      from public.perfiles where id = new.comedor_id;
  elsif new.estado = 'cancelado' then v_detalle := 'Retirado por la empresa';
  elsif new.estado = 'vencido'   then v_detalle := 'Pasó su fecha sin ser aceptado';
  elsif new.estado = 'confirmado' then v_detalle := 'Recepción confirmada por el comedor';
  elsif new.estado = 'rechazado'  then v_detalle := 'Lote rechazado por el comedor';
  end if;
  insert into public.historial_excedente (excedente_id, estado, detalle)
  values (new.id, new.estado, v_detalle);
  return new;
end $$;

drop trigger if exists trg_historial_alta   on public.excedentes;
drop trigger if exists trg_historial_cambio on public.excedentes;
create trigger trg_historial_alta
  after insert on public.excedentes
  for each row execute function public.historial_alta();
create trigger trg_historial_cambio
  after update of estado on public.excedentes
  for each row when (old.estado is distinct from new.estado)
  execute function public.historial_cambio();

-- ---------------------------------------------------------------------
-- 4. Funciones (RPC) que usa la app
-- ---------------------------------------------------------------------

-- Aceptar: el primero que llega lo reserva (RF-11) y avisa al donante (RF-12)
create or replace function public.aceptar_excedente(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v public.excedentes; me public.perfiles;
begin
  if not public.rol_aprobado('comedor') then
    raise exception 'Tu cuenta de comedor aún no está aprobada.';
  end if;
  update public.excedentes
     set estado = 'aceptado', comedor_id = auth.uid(), aceptado_at = now()
   where id = p_id and estado = 'publicado' and fecha_caducidad >= public.hoy_mx()
  returning * into v;
  if not found then
    raise exception 'Este excedente ya no está disponible.';
  end if;
  select * into me from public.perfiles where id = auth.uid();
  insert into public.notificaciones (usuario_id, excedente_id, mensaje)
  values (v.donante_id, v.id,
    format('%s aceptó "%s". Contacto: %s · %s',
           me.nombre_organizacion, v.tipo_alimento,
           coalesce(me.responsable, 'sin responsable'), coalesce(me.telefono, 'sin teléfono')));
end $$;

-- Confirmar recepción con la cantidad realmente recibida (RF-13)
create or replace function public.confirmar_recepcion(p_id uuid, p_cantidad numeric) returns void
language plpgsql security definer set search_path = public as $$
declare v public.excedentes; me public.perfiles; v_porc integer;
begin
  select * into v from public.excedentes
   where id = p_id and comedor_id = auth.uid() and estado = 'aceptado' for update;
  if not found then
    raise exception 'No se encontró un excedente aceptado por ti.';
  end if;
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'Indica la cantidad realmente recibida.';
  end if;
  v_porc := greatest(1, round(coalesce(v.porciones, v.cantidad) * p_cantidad / v.cantidad)::int);

  insert into public.recepciones (excedente_id, comedor_id, cantidad_recibida, porciones_rescatadas, resultado)
  values (v.id, auth.uid(), p_cantidad, v_porc, 'confirmada');
  update public.excedentes set estado = 'confirmado' where id = v.id;

  select * into me from public.perfiles where id = auth.uid();
  insert into public.notificaciones (usuario_id, excedente_id, mensaje)
  values (v.donante_id, v.id,
    format('%s confirmó la recepción de "%s" (%s porciones rescatadas). ¡Gracias!',
           me.nombre_organizacion, v.tipo_alimento, v_porc));
end $$;

-- Rechazar el lote indicando el motivo (RF-13)
create or replace function public.rechazar_recepcion(p_id uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare v public.excedentes; me public.perfiles;
begin
  select * into v from public.excedentes
   where id = p_id and comedor_id = auth.uid() and estado = 'aceptado' for update;
  if not found then
    raise exception 'No se encontró un excedente aceptado por ti.';
  end if;
  if p_motivo is null or length(trim(p_motivo)) < 3 then
    raise exception 'Indica el motivo del rechazo.';
  end if;

  insert into public.recepciones (excedente_id, comedor_id, cantidad_recibida, porciones_rescatadas, resultado, motivo)
  values (v.id, auth.uid(), null, 0, 'rechazada', trim(p_motivo));
  update public.excedentes set estado = 'rechazado' where id = v.id;

  select * into me from public.perfiles where id = auth.uid();
  insert into public.notificaciones (usuario_id, excedente_id, mensaje)
  values (v.donante_id, v.id,
    format('%s rechazó "%s". Motivo: %s', me.nombre_organizacion, v.tipo_alimento, trim(p_motivo)));
end $$;

-- Cancelar una publicación que aún no fue aceptada (RF-09)
create or replace function public.cancelar_excedente(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.excedentes set estado = 'cancelado'
   where id = p_id and donante_id = auth.uid() and estado = 'publicado';
  if not found then
    raise exception 'Solo puedes cancelar publicaciones disponibles.';
  end if;
end $$;

-- Marca como vencidos los excedentes que pasaron su fecha sin ser aceptados (RF-07)
create or replace function public.marcar_vencidos() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.excedentes set estado = 'vencido'
   where estado = 'publicado' and fecha_caducidad < public.hoy_mx();
  get diagnostics n = row_count;
  return n;
end $$;

-- Administración (RF-19)
create or replace function public.aprobar_registro(p_id uuid, p_aprobar boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo el administrador puede hacer esto.'; end if;
  update public.perfiles
     set aprobado = p_aprobar, activo = p_aprobar
   where id = p_id and rol <> 'admin';
end $$;

create or replace function public.set_cuenta_activa(p_id uuid, p_activo boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo el administrador puede hacer esto.'; end if;
  update public.perfiles set activo = p_activo where id = p_id and rol <> 'admin';
end $$;

-- Cada usuario edita solo sus datos de contacto; nunca su rol ni su aprobación
create or replace function public.actualizar_mi_perfil(
  p_nombre text, p_responsable text, p_telefono text, p_direccion text, p_horario text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'El nombre es obligatorio.'; end if;
  update public.perfiles
     set nombre_organizacion = trim(p_nombre),
         responsable         = nullif(trim(coalesce(p_responsable, '')), ''),
         telefono            = nullif(trim(coalesce(p_telefono, '')), ''),
         direccion           = nullif(trim(coalesce(p_direccion, '')), ''),
         horario_atencion    = case when rol = 'comedor'
                                    then nullif(trim(coalesce(p_horario, '')), '')
                                    else horario_atencion end
   where id = auth.uid();
end $$;

-- Sitio público: solo datos agregados, sin información personal (RF-15, RF-16, RF-18)
create or replace function public.estadisticas_publicas() returns json
language sql security definer stable set search_path = public as $$
  select json_build_object(
    'porciones', coalesce((select sum(porciones_rescatadas) from public.recepciones where resultado = 'confirmada'), 0),
    'entregas',  (select count(*) from public.recepciones where resultado = 'confirmada'),
    'empresas',  (select count(*) from public.perfiles where rol = 'donante' and aprobado and activo),
    'comedores', (select count(*) from public.perfiles where rol = 'comedor' and aprobado and activo)
  )
$$;

create or replace function public.aliados_publicos()
returns table (nombre text, rol text, direccion text, logo_url text)
language sql security definer stable set search_path = public as $$
  select nombre_organizacion,
         rol,
         case when rol = 'comedor' then direccion end,
         case when rol = 'donante' then logo_url end
    from public.perfiles
   where rol in ('donante','comedor') and aprobado and activo and nombre_organizacion <> ''
   order by nombre_organizacion
$$;

grant execute on function public.estadisticas_publicas() to anon, authenticated;
grant execute on function public.aliados_publicos()      to anon, authenticated;
grant execute on function public.marcar_vencidos()       to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Seguridad a nivel de fila (RLS)
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('perfiles','excedentes','recepciones','historial_excedente','notificaciones')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.perfiles            enable row level security;
alter table public.excedentes          enable row level security;
alter table public.recepciones         enable row level security;
alter table public.historial_excedente enable row level security;
alter table public.notificaciones      enable row level security;

-- Perfiles: el propio, el admin, o quien participa en un excedente que puedo ver
create policy perfiles_select on public.perfiles for select to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.excedentes e
             where e.donante_id = perfiles.id or e.comedor_id = perfiles.id)
);

-- Excedentes
create policy excedentes_select on public.excedentes for select to authenticated
using (
  donante_id = auth.uid()
  or comedor_id = auth.uid()
  or public.is_admin()
  or (estado = 'publicado' and public.rol_aprobado('comedor'))
);

create policy excedentes_insert on public.excedentes for insert to authenticated
with check (donante_id = auth.uid() and public.rol_aprobado('donante'));
-- (los cambios de estado se hacen solo con las funciones RPC de arriba)

-- Recepciones e historial: visibles para quien puede ver el excedente
create policy recepciones_select on public.recepciones for select to authenticated
using (exists (select 1 from public.excedentes e where e.id = recepciones.excedente_id));

create policy historial_select on public.historial_excedente for select to authenticated
using (exists (select 1 from public.excedentes e where e.id = historial_excedente.excedente_id));

-- Notificaciones: solo las propias
create policy notificaciones_select on public.notificaciones for select to authenticated
using (usuario_id = auth.uid());
create policy notificaciones_update on public.notificaciones for update to authenticated
using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ---------------------------------------------------------------------
-- 6. Almacenamiento de fotos (bucket público "fotos")
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "fotos_lectura_publica" on storage.objects;
create policy "fotos_lectura_publica" on storage.objects for select
using (bucket_id = 'fotos');

drop policy if exists "fotos_subir_propias" on storage.objects;
create policy "fotos_subir_propias" on storage.objects for insert to authenticated
with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 7. Tiempo real
-- ---------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.excedentes;     exception when others then null; end;
  begin alter publication supabase_realtime add table public.notificaciones; exception when others then null; end;
end $$;

notify pgrst, 'reload schema';

-- =====================================================================
--  DESPUÉS DE EJECUTAR ESTE SCRIPT
--
--  1) Crea tu cuenta de administrador:
--     a. Regístrate normalmente en la página (como empresa o comedor).
--     b. Ejecuta esto con TU correo:
--
--        update public.perfiles
--           set rol = 'admin', aprobado = true, activo = true
--         where correo = 'tu-correo@ejemplo.com';
--
--  2) Para la demo, en Supabase → Authentication → Providers → Email,
--     desactiva "Confirm email" para que el registro no pida confirmar correo.
--
--  3) (Opcional) Aprobar de golpe todas las cuentas de prueba existentes:
--        update public.perfiles set aprobado = true, activo = true where rol <> 'admin';
-- =====================================================================
