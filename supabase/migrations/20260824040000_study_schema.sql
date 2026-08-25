-- The consent table has no foreign key to sessions
-- Clients can't read or write. Participants never authenticate.
-- Only the edge functions reach tables

create table public.sessions (
  id uuid primary key default gen_random_uuid(),

  -- Assigned here instead of browser
  condition text not null check (condition in ('hidden', 'transparent')),

  created_at timestamptz not null default now(),

  completed_at timestamptz,

  termination_reason text check (
    termination_reason in ('completed', 'lives_exhausted')
  ),

  final_score integer,
  lives_remaining integer,
  waves_completed integer,
  starting_level integer,

  calibration jsonb,

  power_ups_collected jsonb,

  pause_count integer,
  total_paused_ms integer,
  music_enabled boolean,
  sfx_enabled boolean,

  -- questionnaire responses keyed by item id
  questionnaire jsonb,

  server_assigned boolean not null default true,

  -- in case a duplicate submission is attempted
  submission_count integer not null default 0
);

alter table public.sessions enable row level security;

create table public.consent (
  id uuid primary key default gen_random_uuid(),

  -- not a foreign key, not indexed
  session_reference uuid,

  answers jsonb not null,
  signature text not null,
  printed_name text not null,
  signed_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.consent enable row level security;

create table public.wave_performance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,

  wave_number integer not null,
  duration_ms integer not null,

  kills_by_type jsonb not null,
  lives_lost integer not null,
  shield_hits_absorbed integer not null,

  enemy_persistence double precision not null,
  enemies_tracked integer not null,
  enemies_cleared_by_death integer not null,
  enemies_spawned integer not null,

  shots_fired integer not null,
  shots_hit integer not null,
  power_ups_spawned integer not null,
  power_ups_collected integer not null,

  created_at timestamptz not null default now(),

  unique (session_id, wave_number)
);

alter table public.wave_performance enable row level security;

create index wave_performance_session_idx
  on public.wave_performance (session_id);


create table public.dda_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,

  wave_number integer not null,
  elapsed_time_ms integer not null,

  previous_level integer not null,
  next_level integer not null,
  direction text not null check (
    direction in ('increase', 'decrease', 'unchanged')
  ),

  performance_score double precision not null,
  metric_snapshot jsonb not null,

  parameter_changes jsonb not null,
  reasons jsonb not null,
  explanation text not null,

  displayed boolean not null,

  suppressed_by_hysteresis boolean not null,
  safety_override boolean not null,
  used_accelerated_step boolean not null,

  created_at timestamptz not null default now(),

  unique (session_id, wave_number)
);

alter table public.dda_events enable row level security;

create index dda_events_session_idx on public.dda_events (session_id);