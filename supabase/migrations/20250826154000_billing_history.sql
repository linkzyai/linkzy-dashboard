-- Create billing_history table if missing
create table if not exists public.billing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  amount numeric not null default 0,
  credits_added integer not null default 0,
  description text,
  stripe_session_id text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists billing_history_user_id_idx on public.billing_history(user_id);
create index if not exists billing_history_created_at_idx on public.billing_history(created_at desc);

-- RLS
alter table public.billing_history enable row level security;

create policy if not exists billing_history_own on public.billing_history
  for select using (auth.uid() = user_id);

create policy if not exists billing_history_insert_service on public.billing_history
  for insert with check (auth.role() = 'service_role');

