-- Show closed reports in public Report Tracking while keeping public replies
-- limited to active open/in-progress reports only.

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
		status in ('open', 'in_progress')
		and admin_reply is not null
		and admin_replied_at is not null
		and (
			public_replied_at is null
			or public_reply_admin_replied_at is distinct from admin_replied_at
		)
	) as can_reply
from public.bug_reports
where status in ('open', 'in_progress', 'closed');

create index if not exists bug_reports_public_tracking_idx
	on public.bug_reports (status, created_at desc)
	where status in ('open', 'in_progress', 'closed');

grant select on public.public_bug_report_dashboard to anon, authenticated;
