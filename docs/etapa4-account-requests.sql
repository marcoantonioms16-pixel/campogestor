-- ETAPA 4 — Supabase SQL Editor → Run
create table if not exists public.account_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  farm_name text,
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

alter table public.account_requests enable row level security;

drop policy if exists "admin_select_requests" on public.account_requests;
drop policy if exists "admin_insert_requests" on public.account_requests;
drop policy if exists "admin_update_requests" on public.account_requests;

create policy "admin_select_requests"
  on public.account_requests for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'campogestor@gmail.com');

create policy "admin_insert_requests"
  on public.account_requests for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = 'campogestor@gmail.com');

create policy "admin_update_requests"
  on public.account_requests for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'campogestor@gmail.com')
  with check (auth.jwt() ->> 'email' = 'campogestor@gmail.com');
