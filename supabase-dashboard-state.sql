create table if not exists public.dashboard_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_state enable row level security;

drop policy if exists "dashboard state public read" on public.dashboard_state;
drop policy if exists "dashboard state public insert" on public.dashboard_state;
drop policy if exists "dashboard state public update" on public.dashboard_state;

create policy "dashboard state public read"
on public.dashboard_state
for select
to anon
using (id = 'main');

create policy "dashboard state public insert"
on public.dashboard_state
for insert
to anon
with check (id = 'main');

create policy "dashboard state public update"
on public.dashboard_state
for update
to anon
using (id = 'main')
with check (id = 'main');
