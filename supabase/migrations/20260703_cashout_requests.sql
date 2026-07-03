-- Driver cash-out request system.
-- Driver app inserts via request_cashout() and reads via get_cashout_status();
-- admin panel resolves via decide_cashout() (service role only).

create table if not exists public.cashout_requests (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  available_at_request numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text,
  reject_reason text
);

comment on table public.cashout_requests is
  'Driver payout requests. Driver app inserts via request_cashout(); admin panel resolves via decide_cashout(). Funds are transferred manually outside the system.';

-- Hard guarantee: at most one pending request per rider.
create unique index if not exists cashout_requests_one_pending
  on public.cashout_requests (rider_id) where (status = 'pending');

create index if not exists cashout_requests_rider_status
  on public.cashout_requests (rider_id, status);

alter table public.cashout_requests enable row level security;
-- No policies: table is only reachable through the RPCs below and the service role.

-- Net earnings from delivered orders (rider keeps 90% unless the delivery
-- row carries an explicit net_amount), minus everything already paid out.
create or replace function public.rider_available_balance(p_rider_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select round(
    coalesce((
      select sum(coalesce(d.net_amount, d.price * 0.90))
      from deliveries d
      where d.rider_id = p_rider_id and d.status = 'delivered'
    ), 0)
    -
    coalesce((
      select sum(c.amount)
      from cashout_requests c
      where c.rider_id = p_rider_id and c.status = 'approved'
    ), 0)
  , 2);
$$;

-- Everything the driver app needs to render the cash-out screen.
create or replace function public.get_cashout_status(p_rider_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_last_payout timestamptz;
  v_next_eligible timestamptz;
  v_pending jsonb;
  v_history jsonb;
begin
  select max(decided_at) into v_last_payout
  from cashout_requests
  where rider_id = p_rider_id and status = 'approved';

  v_next_eligible := coalesce(v_last_payout + interval '7 days', now());

  select to_jsonb(c) into v_pending
  from cashout_requests c
  where c.rider_id = p_rider_id and c.status = 'pending';

  select coalesce(jsonb_agg(to_jsonb(h) order by h.requested_at desc), '[]'::jsonb)
  into v_history
  from (
    select id, amount, status, requested_at, decided_at, reject_reason
    from cashout_requests
    where rider_id = p_rider_id
    order by requested_at desc
    limit 50
  ) h;

  return jsonb_build_object(
    'available_balance', rider_available_balance(p_rider_id),
    'eligible', (v_next_eligible <= now() and v_pending is null),
    'next_eligible_at', v_next_eligible,
    'last_payout_at', v_last_payout,
    'pending_request', v_pending,
    'history', v_history
  );
end;
$$;

-- Driver submits a cash-out request. All eligibility rules enforced here,
-- serialized per rider so concurrent submissions cannot race.
create or replace function public.request_cashout(p_rider_id uuid, p_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available numeric;
  v_last_payout timestamptz;
  v_next_eligible timestamptz;
  v_row cashout_requests;
begin
  perform pg_advisory_xact_lock(hashtext('cashout:' || p_rider_id::text));

  if p_amount is null or p_amount <= 0 then
    raise exception 'Please enter an amount greater than zero.';
  end if;

  if not exists (select 1 from riders where id = p_rider_id) then
    raise exception 'Rider not found.';
  end if;

  if exists (select 1 from cashout_requests where rider_id = p_rider_id and status = 'pending') then
    raise exception 'You already have a pending cash-out request. Please wait for it to be reviewed.';
  end if;

  select max(decided_at) into v_last_payout
  from cashout_requests
  where rider_id = p_rider_id and status = 'approved';

  if v_last_payout is not null and v_last_payout + interval '7 days' > now() then
    v_next_eligible := v_last_payout + interval '7 days';
    raise exception 'You can request your next payout on %.',
      to_char(v_next_eligible, 'FMMonth DD, YYYY at HH12:MI AM');
  end if;

  v_available := rider_available_balance(p_rider_id);
  if p_amount > v_available then
    raise exception 'Requested amount exceeds your available balance of %.', v_available;
  end if;

  insert into cashout_requests (rider_id, amount, available_at_request)
  values (p_rider_id, round(p_amount, 2), v_available)
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

-- Admin approves or rejects a pending request. Guarded so an already-decided
-- request can never be approved again (no double payouts).
create or replace function public.decide_cashout(
  p_request_id uuid,
  p_approve boolean,
  p_decided_by text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req cashout_requests;
  v_available numeric;
begin
  select * into v_req from cashout_requests where id = p_request_id for update;
  if not found then
    raise exception 'Cash-out request not found.';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request has already been %.', v_req.status;
  end if;

  perform pg_advisory_xact_lock(hashtext('cashout:' || v_req.rider_id::text));

  if p_approve then
    v_available := rider_available_balance(v_req.rider_id);
    if v_req.amount > v_available then
      raise exception 'Requested amount (%) exceeds the rider''s current available balance (%).',
        v_req.amount, v_available;
    end if;
  end if;

  update cashout_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      decided_at = now(),
      decided_by = p_decided_by,
      reject_reason = case when p_approve then null else p_reason end
  where id = p_request_id
  returning * into v_req;

  return to_jsonb(v_req);
end;
$$;

-- Admin panel listing: requests joined with rider info + live balances.
create or replace function public.admin_list_cashouts()
returns table (
  id uuid,
  rider_id uuid,
  rider_name text,
  rider_phone text,
  payout_bank text,
  payout_account_number text,
  amount numeric,
  available_at_request numeric,
  available_balance numeric,
  status text,
  requested_at timestamptz,
  decided_at timestamptz,
  decided_by text,
  reject_reason text,
  last_payout_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.rider_id,
    r.full_name,
    r.phone_number,
    r.payout_bank,
    r.payout_account_number,
    c.amount,
    c.available_at_request,
    rider_available_balance(c.rider_id),
    c.status,
    c.requested_at,
    c.decided_at,
    c.decided_by,
    c.reject_reason,
    (select max(a.decided_at) from cashout_requests a
      where a.rider_id = c.rider_id and a.status = 'approved')
  from cashout_requests c
  join riders r on r.id = c.rider_id
  order by (c.status = 'pending') desc, c.requested_at desc;
$$;

-- Driver app (anon key) may request and read status; deciding and listing
-- are admin-panel (service role) only.
revoke all on function public.request_cashout(uuid, numeric) from public;
revoke all on function public.get_cashout_status(uuid) from public;
revoke all on function public.rider_available_balance(uuid) from public;
revoke all on function public.decide_cashout(uuid, boolean, text, text) from public;
revoke all on function public.admin_list_cashouts() from public;

grant execute on function public.request_cashout(uuid, numeric) to anon, authenticated, service_role;
grant execute on function public.get_cashout_status(uuid) to anon, authenticated, service_role;
grant execute on function public.rider_available_balance(uuid) to anon, authenticated, service_role;
grant execute on function public.decide_cashout(uuid, boolean, text, text) to service_role;
grant execute on function public.admin_list_cashouts() to service_role;
