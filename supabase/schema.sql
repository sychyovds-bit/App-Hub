-- Выполнить в Supabase: Dashboard -> SQL Editor -> New query

-- Таблица ключ-значение с привязкой к пользователю
create table if not exists public.kv_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Row Level Security: каждый видит только свои данные
alter table public.kv_data enable row level security;

create policy "users select own data" on public.kv_data
  for select using (auth.uid() = user_id);

create policy "users insert own data" on public.kv_data
  for insert with check (auth.uid() = user_id);

create policy "users update own data" on public.kv_data
  for update using (auth.uid() = user_id);

create policy "users delete own data" on public.kv_data
  for delete using (auth.uid() = user_id);
