-- =========================================================================
-- RO Calculator — backlog status for bug reports
--
-- New kanban column between New Issues and In Progress on both the admin
-- board and public Report Tracking, for reports the admin decided not to do.
-- =========================================================================

alter table public.bug_reports drop constraint if exists bug_reports_status_check;
alter table public.bug_reports
	add constraint bug_reports_status_check
		check (status in ('open', 'backlog', 'in_progress', 'resolved', 'closed'));

-- Superseded partial indexes.
drop index if exists public.bug_reports_public_dashboard_idx;
drop index if exists public.bug_reports_public_tracking_idx;
create index bug_reports_public_tracking_idx
	on public.bug_reports (status, created_at desc)
	where status in ('open', 'backlog', 'in_progress', 'closed');

-- Same shape as before, with backlog visible and replyable.
-- (The old reply RPC still only allows open/in_progress; it is replaced
-- wholesale by the comment-thread migration that ships together with this.)
create or replace view public.public_bug_report_dashboard as
select
	id,
	title,
	description,
	status,
	report_type,
	admin_reply,
	admin_replied_at,
	public_reply,
	public_replied_at,
	created_at,
	updated_at,
	(
		status in ('open', 'backlog', 'in_progress')
		and admin_reply is not null
		and admin_replied_at is not null
		and (
			public_replied_at is null
			or public_reply_admin_replied_at is distinct from admin_replied_at
		)
	) as can_reply
from public.bug_reports
where status in ('open', 'backlog', 'in_progress', 'closed');

grant select on public.public_bug_report_dashboard to anon, authenticated;
