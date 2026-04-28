-- =========================================================================
-- RO Calculator — bug reports
--
-- Lets any visitor (signed in or anonymous) file a bug report from the
-- topbar. Optional image attachment goes into the public `bug-report-images`
-- bucket. Only admins can list / update / delete reports.
-- =========================================================================

create table public.bug_reports (
  id           bigserial primary key,
  title        text not null,
  description  text,
  page_url     text,
  user_agent   text,
  image_path   text,
  status       text not null default 'open',
  reporter_id  uuid references auth.users(id) on delete set null,
  reporter_name text,
  reporter_email text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint bug_reports_status_check check (status in ('open', 'in_progress', 'resolved', 'closed'))
);

create index bug_reports_status_idx on public.bug_reports (status);
create index bug_reports_created_at_idx on public.bug_reports (created_at desc);

create trigger bug_reports_updated_at
  before update on public.bug_reports
  for each row execute function public.touch_updated_at();

alter table public.bug_reports enable row level security;

-- Anyone (incl. anon) can submit a report.
create policy bug_reports_insert_any on public.bug_reports
  for insert with check (true);

-- Reporters see their own; admins see everything.
create policy bug_reports_select_own_or_admin on public.bug_reports
  for select using (
    public.is_admin()
    or (auth.uid() is not null and reporter_id = auth.uid())
  );

create policy bug_reports_admin_update on public.bug_reports
  for update using (public.is_admin()) with check (public.is_admin());

create policy bug_reports_admin_delete on public.bug_reports
  for delete using (public.is_admin());

-- ---- Storage bucket ----------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('bug-report-images', 'bug-report-images', true)
  on conflict (id) do update set public = excluded.public;

drop policy if exists "bug_report_images_read" on storage.objects;
create policy "bug_report_images_read" on storage.objects
  for select using (bucket_id = 'bug-report-images');

-- Anyone may upload to this bucket (matches the open-insert policy on the
-- bug_reports table). Service-role / admin can clean up.
drop policy if exists "bug_report_images_write" on storage.objects;
create policy "bug_report_images_write" on storage.objects
  for insert with check (bucket_id = 'bug-report-images');

drop policy if exists "bug_report_images_admin_delete" on storage.objects;
create policy "bug_report_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'bug-report-images' and public.is_admin());
