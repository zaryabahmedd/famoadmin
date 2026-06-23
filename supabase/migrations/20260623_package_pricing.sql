-- Per-package-size pricing.
-- NOTE: this is the committed mirror of the schema applied to the live project.
--
-- Source of truth shared by the admin panel (service-role writes, super-admin
-- gated in the route) and the rider/user apps (anon-key reads). Replaces the
-- single-row pricing_settings model on the user side.
-- Fare = round(base_price + per_km_price * distance_km), integer Naira.

create table if not exists public.package_pricing (
  size         integer primary key check (size in (5, 10, 15, 20)),
  base_price   numeric not null default 0 check (base_price >= 0),
  per_km_price numeric not null default 0 check (per_km_price >= 0),
  updated_at   timestamptz not null default now()
);

alter table public.package_pricing enable row level security;

-- Public read so the user app and rider app (anon key) can fetch live fares.
-- Mirrors the existing "Pricing settings are publicly readable" policy.
drop policy if exists "Package pricing is publicly readable" on public.package_pricing;
create policy "Package pricing is publicly readable"
  on public.package_pricing
  for select
  to public
  using (true);
-- No write policies: only the service-role key (admin panel) may insert/update.

-- Seed all four sizes so none is left un-orderable on the user side.
-- size 5 keeps the current global fare (₦100 + ₦180/km); larger sizes scale up.
insert into public.package_pricing (size, base_price, per_km_price) values
  (5,  100, 180),
  (10, 200, 220),
  (15, 300, 260),
  (20, 400, 300)
on conflict (size) do nothing;

-- Make sure PostgREST serves the new table immediately (the user app reads it
-- via /rest/v1/package_pricing with the anon key).
notify pgrst, 'reload schema';
