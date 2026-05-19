-- =========================================================================
-- RO Calculator - admin replies for bug reports
--
-- Adds a nullable admin reply to each bug report. Existing admin-only update
-- RLS policy on public.bug_reports controls who can write these fields.
-- =========================================================================

alter table public.bug_reports
  add column if not exists admin_reply text,
  add column if not exists admin_replied_at timestamptz,
  add column if not exists admin_replied_by uuid references auth.users(id) on delete set null;

do $$
begin
  begin
    alter table public.bug_reports
      add constraint bug_reports_admin_reply_size_chk
        check (admin_reply is null or octet_length(admin_reply) <= 16384);
  exception when duplicate_object then null;
  end;
end$$;