-- ============================================================================
-- PatternAI · Migración inicial (Supabase / Postgres)
-- Pégala en: Supabase Dashboard > SQL Editor > New query > Run
-- O con CLI: supabase db push
--
-- Incluye correcciones importantes frente al borrador de arquitectura:
--   1. Funciones SECURITY DEFINER (current_org_id / is_admin / can_manage_guides)
--      para EVITAR la recursión infinita de RLS en `profiles`.
--   2. Bootstrap de organización + trigger de alta de usuario + invitaciones.
--   3. Políticas separadas por comando (más claras y sin solapes peligrosos).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABLAS
-- ----------------------------------------------------------------------------

create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null,
  created_at  timestamptz default now()
);

create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  organization_id   uuid references organizations(id) on delete cascade,
  full_name         text,
  avatar_url        text,
  role              text not null default 'member' check (role in ('admin','member')),
  can_view_shared   boolean default true,
  can_download      boolean default true,
  can_share         boolean default false,
  can_create_guides boolean default false,
  status            text not null default 'active' check (status in ('pending','active','disabled')),
  invited_by        uuid references profiles(id),
  created_at        timestamptz default now()
);

-- Invitaciones: el admin vincula a alguien por email ANTES de que se registre.
-- Al registrarse, el trigger de abajo lo mete a la organización con estos permisos.
create table invitations (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  email             text not null,
  role              text not null default 'member' check (role in ('admin','member')),
  can_download      boolean default true,
  can_share         boolean default false,
  can_create_guides boolean default false,
  invited_by        uuid not null references profiles(id),
  accepted          boolean default false,
  created_at        timestamptz default now()
);
create index on invitations (lower(email)) where accepted = false;

create table guides (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  title            text not null,
  category         text default 'general',
  content_md       text not null,
  pdf_path         text,
  visibility       text not null default 'private'
                   check (visibility in ('private','shared','company')),
  created_by       uuid not null references profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index on guides (organization_id);

create table guide_shares (
  id          uuid primary key default gen_random_uuid(),
  guide_id    uuid not null references guides(id) on delete cascade,
  shared_with uuid not null references profiles(id) on delete cascade,
  permission  text not null default 'view' check (permission in ('view','download')),
  shared_by   uuid not null references profiles(id),
  created_at  timestamptz default now(),
  unique (guide_id, shared_with)
);
create index on guide_shares (shared_with);

create table guide_share_links (
  id          uuid primary key default gen_random_uuid(),
  guide_id    uuid not null references guides(id) on delete cascade,
  token       text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by  uuid not null references profiles(id),
  expires_at  timestamptz,
  revoked     boolean default false,
  created_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 2. FUNCIONES AUXILIARES (SECURITY DEFINER = leen profiles SIN disparar RLS)
--    Esto es lo que evita la recursión infinita del borrador original.
-- ----------------------------------------------------------------------------

create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false)
$$;

create or replace function public.can_manage_guides()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'admin' or can_create_guides from profiles where id = auth.uid()),
    false)
$$;

-- ----------------------------------------------------------------------------
-- 3. RPCs (llamadas desde la app con supabase.rpc(...))
-- ----------------------------------------------------------------------------

-- El primer usuario crea su empresa y queda como admin/owner.
create or replace function public.create_organization(org_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_org uuid;
begin
  if (select organization_id from profiles where id = auth.uid()) is not null then
    raise exception 'Este usuario ya pertenece a una organización';
  end if;

  insert into organizations (name, created_by)
  values (org_name, auth.uid())
  returning id into new_org;

  update profiles set
    organization_id   = new_org,
    role              = 'admin',
    status            = 'active',
    can_view_shared   = true,
    can_download      = true,
    can_share         = true,
    can_create_guides = true
  where id = auth.uid();

  return new_org;
end;
$$;

-- El admin invita a alguien por email (aparecerá en su equipo al registrarse).
create or replace function public.invite_member(
  p_email text,
  p_role text default 'member',
  p_can_download boolean default true,
  p_can_share boolean default false,
  p_can_create_guides boolean default false
) returns uuid language plpgsql security definer set search_path = public as $$
declare inv_id uuid; org uuid;
begin
  if not is_admin() then
    raise exception 'Solo un administrador puede invitar miembros';
  end if;
  org := current_org_id();

  insert into invitations (organization_id, email, role, can_download, can_share, can_create_guides, invited_by)
  values (org, lower(p_email), p_role, p_can_download, p_can_share, p_can_create_guides, auth.uid())
  returning id into inv_id;

  return inv_id;
end;
$$;

-- Un miembro puede editar SOLO sus campos seguros (nombre / avatar).
create or replace function public.update_my_profile(p_full_name text, p_avatar_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles
     set full_name  = coalesce(p_full_name, full_name),
         avatar_url = coalesce(p_avatar_url, avatar_url)
   where id = auth.uid();
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS
-- ----------------------------------------------------------------------------

-- Al registrarse un usuario en auth.users, crea su profile.
-- Si tiene invitación pendiente, entra ya vinculado a la organización.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv invitations;
begin
  select * into inv
    from invitations
   where lower(email) = lower(new.email) and accepted = false
   order by created_at desc limit 1;

  if inv.id is not null then
    insert into profiles (id, organization_id, full_name, role,
                          can_download, can_share, can_create_guides, status, invited_by)
    values (new.id, inv.organization_id,
            coalesce(new.raw_user_meta_data->>'full_name', new.email),
            inv.role, inv.can_download, inv.can_share, inv.can_create_guides,
            'active', inv.invited_by);
    update invitations set accepted = true where id = inv.id;
  else
    insert into profiles (id, full_name, status)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'pending');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático en guides
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger guides_touch_updated_at
  before update on guides
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table organizations    enable row level security;
alter table profiles         enable row level security;
alter table invitations      enable row level security;
alter table guides           enable row level security;
alter table guide_shares     enable row level security;
alter table guide_share_links enable row level security;

-- organizations: solo la mía
create policy org_select on organizations for select
  using (id = current_org_id());

-- profiles: mi propio perfil + compañeros de mi organización
create policy profiles_select on profiles for select
  using (id = auth.uid() or organization_id = current_org_id());

-- solo un admin de la misma organización actualiza perfiles ajenos (permisos/rol/estado)
create policy profiles_admin_update on profiles for update
  using (is_admin() and organization_id = current_org_id())
  with check (organization_id = current_org_id());

-- invitations: solo el admin de la organización
create policy invitations_admin_all on invitations for all
  using (is_admin() and organization_id = current_org_id())
  with check (is_admin() and organization_id = current_org_id());

-- guides — LECTURA:
--   * el creador ve las suyas
--   * el admin ve TODO el catálogo de su organización
--   * un miembro ve las que le compartieron
--   (opcional) que todo miembro vea el catálogo 'company': descomenta la línea marcada
create policy guides_select on guides for select
  using (
    organization_id = current_org_id() and (
      created_by = auth.uid()
      or is_admin()
      or exists (
        select 1 from guide_shares gs
        where gs.guide_id = guides.id and gs.shared_with = auth.uid()
      )
      -- or visibility = 'company'   -- <<< DESCOMENTA para catálogo de empresa visible a todos
    )
  );

-- guides — ESCRITURA: admin o miembro con can_create_guides, dentro de su organización
create policy guides_write_insert on guides for insert
  with check (organization_id = current_org_id() and can_manage_guides());
create policy guides_write_update on guides for update
  using (organization_id = current_org_id() and can_manage_guides())
  with check (organization_id = current_org_id() and can_manage_guides());
create policy guides_write_delete on guides for delete
  using (organization_id = current_org_id() and can_manage_guides());

-- guide_shares — LECTURA: a quien se le compartió, quien compartió, o admin
create policy guide_shares_select on guide_shares for select
  using (
    shared_with = auth.uid()
    or exists (
      select 1 from guides g
      where g.id = guide_shares.guide_id
        and g.organization_id = current_org_id()
        and (g.created_by = auth.uid() or is_admin())
    )
  );

-- guide_shares — ESCRITURA: solo el creador de la guía o un admin
create policy guide_shares_write on guide_shares for all
  using (
    exists (select 1 from guides g
            where g.id = guide_shares.guide_id
              and g.organization_id = current_org_id()
              and (g.created_by = auth.uid() or is_admin()))
  )
  with check (
    exists (select 1 from guides g
            where g.id = guide_shares.guide_id
              and g.organization_id = current_org_id()
              and (g.created_by = auth.uid() or is_admin()))
  );

-- guide_share_links: gestionados por creador/admin.
-- La lectura pública por token la hace la Edge Function con service_role (no anon).
create policy guide_share_links_all on guide_share_links for all
  using (
    exists (select 1 from guides g
            where g.id = guide_share_links.guide_id
              and g.organization_id = current_org_id()
              and (g.created_by = auth.uid() or is_admin()))
  )
  with check (
    exists (select 1 from guides g
            where g.id = guide_share_links.guide_id
              and g.organization_id = current_org_id()
              and (g.created_by = auth.uid() or is_admin()))
  );

-- ----------------------------------------------------------------------------
-- Listo. Recuerda desactivar "Confirm email" en Auth para pruebas rápidas,
-- o confirma manualmente los usuarios de prueba.
-- ----------------------------------------------------------------------------
