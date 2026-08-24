create table public.deployment_test (
  id uuid primary key default gen_random_uuid(),
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.deployment_test enable row level security;