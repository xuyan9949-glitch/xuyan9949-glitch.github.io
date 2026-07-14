-- 个人持仓追踪 Supabase 数据表
-- 在 Supabase SQL Editor 中执行一次即可。

create table if not exists public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market text not null check (market in ('US', 'CN')),
  version integer not null default 3,
  account_capital numeric not null default 100000,
  currency text not null default 'USD',
  trades jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, market)
);

alter table public.portfolio_snapshots
add column if not exists version integer not null default 3;

alter table public.portfolio_snapshots enable row level security;

drop policy if exists "Users can read own portfolio snapshots" on public.portfolio_snapshots;
create policy "Users can read own portfolio snapshots"
on public.portfolio_snapshots
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own portfolio snapshots" on public.portfolio_snapshots;
create policy "Users can insert own portfolio snapshots"
on public.portfolio_snapshots
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own portfolio snapshots" on public.portfolio_snapshots;
create policy "Users can update own portfolio snapshots"
on public.portfolio_snapshots
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own portfolio snapshots" on public.portfolio_snapshots;
create policy "Users can delete own portfolio snapshots"
on public.portfolio_snapshots
for delete
using (auth.uid() = user_id);
