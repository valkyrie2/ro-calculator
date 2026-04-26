-- =========================================================================
-- RO Calculator — app_logs
--
-- Captures major user actions and errors from the client. Anonymous and
-- signed-in users may insert; only owners can read their own rows and admins
-- can read all rows. Reads happen via the Supabase Dashboard (Table Editor
-- or SQL Editor) — see docs-internal/app-logs.md.
-- =========================================================================

create table public.app_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  level        text not null default 'info',
  event        text not null,
  message      text,
  data         jsonb,
  url          text,
  user_agent   text,
  app_version  text,
  created_at   timestamptz not null default now(),
  constraint app_logs_level_check check (level in ('info', 'warn', 'error'))
);

create index app_logs_created_at_idx on public.app_logs (created_at desc);
create index app_logs_level_idx      on public.app_logs (level);
create index app_logs_event_idx      on public.app_logs (event);
create index app_logs_user_id_idx    on public.app_logs (user_id) where user_id is not null;

alter table public.app_logs enable row level security;

-- Anyone (incl. anon) may insert. If user_id is provided it must match the
-- caller's auth.uid(); anon callers must leave user_id null.
create policy "anyone inserts logs"
  on public.app_logs for insert
  with check (user_id is null or user_id = auth.uid());

-- Owners read their own logs.
create policy "owners read own logs"
  on public.app_logs for select
  using (auth.uid() is not null and user_id = auth.uid());

-- Admins read every log.
create policy "admins read all logs"
  on public.app_logs for select
  using (public.is_admin());

-- Admins may delete (e.g. for log rotation / pruning).
create policy "admins delete logs"
  on public.app_logs for delete
  using (public.is_admin());
