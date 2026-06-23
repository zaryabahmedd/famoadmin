-- Two-tier admin hierarchy: individual admin accounts + audit trail.
-- NOTE: this is the committed mirror of the schema applied to the live project.
-- The first super-admin account is seeded separately (out of band) so no
-- credentials are committed here.

create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------------
-- admin_accounts
-- ------------------------------------------------------------------
create table if not exists public.admin_accounts (
  id                   uuid primary key default gen_random_uuid(),
  email                text not null unique,
  name                 text not null,
  password_hash        text not null,
  role                 text not null default 'admin' check (role in ('super_admin','admin')),
  is_active            boolean not null default true,
  must_change_password boolean not null default false,
  created_by           uuid references public.admin_accounts(id) on delete set null,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now()
);

alter table public.admin_accounts enable row level security;
-- No policies: only the service-role key (admin panel) may read/write.

-- ------------------------------------------------------------------
-- admin_audit_logs
-- ------------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.admin_accounts(id) on delete set null,
  actor_name   text,
  actor_email  text,
  action       text not null,
  target_type  text,
  target_id    text,
  target_label text,
  details      jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_action_idx     on public.admin_audit_logs (action);

alter table public.admin_audit_logs enable row level security;
-- No policies: only the service-role key (admin panel) may read/write.

-- ------------------------------------------------------------------
-- RPCs (SECURITY DEFINER) -- bcrypt hashing lives in the database.
-- ------------------------------------------------------------------
create or replace function public.admin_login(p_email text, p_password text)
returns table (id uuid, name text, email text, role text, must_change_password boolean)
language sql
security definer
set search_path = public, extensions
as $$
  select a.id, a.name, a.email, a.role, a.must_change_password
  from public.admin_accounts a
  where a.email = lower(p_email)
    and a.is_active = true
    and a.password_hash = crypt(p_password, a.password_hash);
$$;

create or replace function public.create_admin_account(
  p_email text, p_name text, p_password text, p_role text, p_created_by uuid
)
returns table (id uuid, name text, email text, role text, is_active boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_role text := coalesce(nullif(p_role, ''), 'admin');
begin
  if v_role not in ('super_admin','admin') then
    raise exception 'invalid role: %', v_role;
  end if;

  return query
  insert into public.admin_accounts (email, name, password_hash, role, created_by)
  values (lower(p_email), p_name, crypt(p_password, gen_salt('bf')), v_role, p_created_by)
  returning admin_accounts.id, admin_accounts.name, admin_accounts.email,
            admin_accounts.role, admin_accounts.is_active, admin_accounts.created_at;
end;
$$;

create or replace function public.set_admin_password(p_admin_id uuid, p_new_password text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.admin_accounts
  set password_hash = crypt(p_new_password, gen_salt('bf')),
      must_change_password = false
  where id = p_admin_id;
$$;

-- Functions default to EXECUTE for PUBLIC (which anon/authenticated inherit).
-- These admin RPCs must only be callable by the service-role key.
revoke execute on function public.admin_login(text, text)                            from public, anon, authenticated;
revoke execute on function public.create_admin_account(text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.set_admin_password(uuid, text)                     from public, anon, authenticated;

grant execute on function public.admin_login(text, text)                            to service_role;
grant execute on function public.create_admin_account(text, text, text, text, uuid) to service_role;
grant execute on function public.set_admin_password(uuid, text)                     to service_role;
