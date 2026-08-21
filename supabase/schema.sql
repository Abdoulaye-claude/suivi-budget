-- Suivi de Budget — cloud sync schema
--
-- Run this once, by hand, in the Supabase SQL editor for this project
-- (Dashboard > SQL Editor > New query > paste > Run). This file is committed
-- as documentation; it is NOT executed automatically by the app or by CI.
--
-- Type notes: all id columns are `text` (category ids include fixed non-uuid
-- slugs like 'logement', and expenses.category_id must reference either those
-- or a crypto.randomUUID() id). Primary keys are composite (user_id, id)
-- since ids aren't globally unique (every user gets their own 'logement'
-- category row). There is deliberately no FK from expenses.category_id to
-- categories.id (would complicate merge/backup-restore ordering for no real
-- benefit here). `settings` is one row per user.

create table if not exists public.categories (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  color text not null,
  kind text not null check (kind in ('depense', 'revenu')),
  budget numeric,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.expenses (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date text not null, -- ISO 'yyyy-MM-dd', kept as text to mirror the app model exactly
  amount numeric not null,
  category_id text not null,
  description text not null default '',
  status text not null check (status in ('reel', 'prevu')),
  type text not null check (type in ('depense', 'revenu')),
  recurrence_id text,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.savings_goals (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  target_amount numeric not null,
  saved_amount numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'EUR',
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  notifications_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.savings_goals enable row level security;
alter table public.settings enable row level security;

create policy "categories_owner_all" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_owner_all" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "savings_goals_owner_all" on public.savings_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_owner_all" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.savings_goals;
alter publication supabase_realtime add table public.settings;
