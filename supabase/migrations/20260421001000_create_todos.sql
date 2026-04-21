create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  inserted_at timestamptz not null default now()
);
