alter table public.consent
  alter column signed_at type date using signed_at::date,
  alter column created_at type date using created_at::date,
  alter column created_at set default current_date;