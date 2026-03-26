create table if not exists public.user_wallet_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_wallet_data enable row level security;

drop policy if exists "user_wallet_data_select_own" on public.user_wallet_data;
create policy "user_wallet_data_select_own"
on public.user_wallet_data
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_wallet_data_insert_own" on public.user_wallet_data;
create policy "user_wallet_data_insert_own"
on public.user_wallet_data
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_wallet_data_update_own" on public.user_wallet_data;
create policy "user_wallet_data_update_own"
on public.user_wallet_data
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
