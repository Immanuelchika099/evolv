create table if not exists public.ai_user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_key text not null,
  memory_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, memory_key)
);

create index if not exists ai_user_memory_user_id_idx
  on public.ai_user_memory(user_id);

alter table public.ai_user_memory enable row level security;

grant select, insert, update, delete on public.ai_user_memory to authenticated;

drop policy if exists "Users can view their AI memory" on public.ai_user_memory;
create policy "Users can view their AI memory"
  on public.ai_user_memory
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their AI memory" on public.ai_user_memory;
create policy "Users can create their AI memory"
  on public.ai_user_memory
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their AI memory" on public.ai_user_memory;
create policy "Users can update their AI memory"
  on public.ai_user_memory
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their AI memory" on public.ai_user_memory;
create policy "Users can delete their AI memory"
  on public.ai_user_memory
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
