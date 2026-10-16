create table if not exists public.ai_daily_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_date date not null,
  category text not null default 'personal',
  title text not null,
  observation text not null,
  suggestion text not null,
  evidence jsonb not null default '[]'::jsonb,
  source_hash text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, insight_date)
);

alter table public.ai_daily_insights enable row level security;

drop policy if exists "Users can read their own daily insights" on public.ai_daily_insights;
create policy "Users can read their own daily insights"
  on public.ai_daily_insights for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own daily insights" on public.ai_daily_insights;
create policy "Users can create their own daily insights"
  on public.ai_daily_insights for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own daily insights" on public.ai_daily_insights;
create policy "Users can update their own daily insights"
  on public.ai_daily_insights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists ai_daily_insights_user_date_idx
  on public.ai_daily_insights (user_id, insight_date desc);
