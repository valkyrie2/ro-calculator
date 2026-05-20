-- =========================================================================
-- RO Calculator - public bug/request dashboard
--
-- Public users can view open/in-progress reports through a sanitized view,
-- see admin replies, and submit one public reply per admin reply.
-- =========================================================================

alter table public.bug_reports
	add column if not exists report_type text not null default 'bug',
	add column if not exists public_reply text,
	add column if not exists public_replied_at timestamptz,
	add column if not exists public_reply_admin_replied_at timestamptz;

do $$
begin
	begin
		alter table public.bug_reports
			add constraint bug_reports_report_type_chk
				check (report_type in ('bug', 'request')) not valid;
	exception when duplicate_object then null;
	end;

	begin
		alter table public.bug_reports
			add constraint bug_reports_public_reply_size_chk
				check (public_reply is null or octet_length(public_reply) <= 4000) not valid;
	exception when duplicate_object then null;
	end;
end$$;

create index if not exists bug_reports_public_dashboard_idx
	on public.bug_reports (status, created_at desc)
	where status in ('open', 'in_progress');

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
		admin_reply is not null
		and admin_replied_at is not null
		and (
			public_replied_at is null
			or public_reply_admin_replied_at is distinct from admin_replied_at
		)
	) as can_reply
from public.bug_reports
where status in ('open', 'in_progress');

grant select on public.public_bug_report_dashboard to anon, authenticated;

create or replace function public.reply_to_bug_report_admin_comment(
	report_id bigint,
	reply text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
	cleaned text := nullif(btrim(reply), '');
	updated_count integer;
begin
	if cleaned is null then
		raise exception 'Reply is required.';
	end if;

	if octet_length(cleaned) > 4000 then
		raise exception 'Reply is too long.';
	end if;

	update public.bug_reports
	set
		public_reply = cleaned,
		public_replied_at = now(),
		public_reply_admin_replied_at = admin_replied_at
	where id = report_id
		and status in ('open', 'in_progress')
		and admin_reply is not null
		and admin_replied_at is not null
		and (
			public_replied_at is null
			or public_reply_admin_replied_at is distinct from admin_replied_at
		);

	get diagnostics updated_count = row_count;
	if updated_count = 0 then
		raise exception 'This report cannot be replied to, or it has already been replied to.';
	end if;
end;
$$;

revoke all on function public.reply_to_bug_report_admin_comment(bigint, text) from public;
grant execute on function public.reply_to_bug_report_admin_comment(bigint, text) to anon, authenticated;
