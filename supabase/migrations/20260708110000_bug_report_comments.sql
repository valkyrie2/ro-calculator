-- =========================================================================
-- RO Calculator — bug report comment thread (pingpong)
--
-- Replaces the single admin_reply/public_reply fields with a web-board
-- style comment thread. The reporter side may post 1 comment per admin
-- comment (enforced by RPC); admins insert directly and are unlimited.
-- Existing replies are migrated into the thread, then the old columns and
-- RPC are dropped.
-- =========================================================================

create table public.bug_report_comments (
	id bigserial primary key,
	report_id bigint not null references public.bug_reports(id) on delete cascade,
	author_role text not null check (author_role in ('admin', 'reporter')),
	author_id uuid references auth.users(id) on delete set null,
	body text not null check (btrim(body) <> '' and octet_length(body) <= 4000),
	created_at timestamptz not null default now()
);

create index bug_report_comments_report_idx
	on public.bug_report_comments (report_id, created_at);

alter table public.bug_report_comments enable row level security;

-- Comment bodies belong to reports whose title/description are already
-- public on the dashboard; nothing sensitive here.
create policy bug_report_comments_select_all on public.bug_report_comments
	for select using (true);

-- Admins insert directly (unlimited, no alternation limit).
create policy bug_report_comments_admin_insert on public.bug_report_comments
	for insert with check (public.is_admin() and author_role = 'admin');

-- ---- migrate existing single replies into the thread ---------------------
insert into public.bug_report_comments (report_id, author_role, author_id, body, created_at)
select id, 'admin', admin_replied_by, admin_reply, coalesce(admin_replied_at, updated_at)
from public.bug_reports
where admin_reply is not null;

insert into public.bug_report_comments (report_id, author_role, body, created_at)
select id, 'reporter', public_reply, coalesce(public_replied_at, updated_at)
from public.bug_reports
where public_reply is not null;

-- ---- drop old reply columns (view depends on them: drop view first) ------
drop view if exists public.public_bug_report_dashboard;

alter table public.bug_reports
	drop column if exists admin_reply,
	drop column if exists admin_replied_at,
	drop column if exists admin_replied_by,
	drop column if exists public_reply,
	drop column if exists public_replied_at,
	drop column if exists public_reply_admin_replied_at;

-- ---- rebuild the public dashboard view on top of the thread --------------
create view public.public_bug_report_dashboard as
select
	r.id,
	r.title,
	r.description,
	r.status,
	r.report_type,
	r.created_at,
	r.updated_at,
	exists (
		select 1
		from public.bug_report_comments c
		where c.report_id = r.id and c.author_role = 'admin'
	) as answered,
	coalesce(
		r.status in ('open', 'backlog', 'in_progress')
		and (
			select c.author_role
			from public.bug_report_comments c
			where c.report_id = r.id
			order by c.created_at desc, c.id desc
			limit 1
		) = 'admin',
		false
	) as can_reply
from public.bug_reports r
where r.status in ('open', 'backlog', 'in_progress', 'closed');

grant select on public.public_bug_report_dashboard to anon, authenticated;

-- ---- reporter-side inserts go through the pingpong RPC --------------------
create or replace function private.add_bug_report_comment(
	report_id bigint,
	body text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
	cleaned text := nullif(btrim(body), '');
	report_status text;
	last_role text;
begin
	if cleaned is null then
		raise exception 'Comment is required.';
	end if;

	if octet_length(cleaned) > 4000 then
		raise exception 'Comment is too long.';
	end if;

	-- Lock the report row so two concurrent replies cannot both pass the gate.
	select r.status into report_status
	from public.bug_reports r
	where r.id = add_bug_report_comment.report_id
	for update;

	if report_status is null then
		raise exception 'Report not found.';
	end if;

	if report_status not in ('open', 'backlog', 'in_progress') then
		raise exception 'This report is closed.';
	end if;

	select c.author_role into last_role
	from public.bug_report_comments c
	where c.report_id = add_bug_report_comment.report_id
	order by c.created_at desc, c.id desc
	limit 1;

	-- Pingpong gate: a reporter comment may only follow an admin comment.
	if last_role is distinct from 'admin' then
		raise exception 'You can reply once per admin comment. Wait for the admin to reply first.';
	end if;

	insert into public.bug_report_comments (report_id, author_role, author_id, body)
	values (add_bug_report_comment.report_id, 'reporter', auth.uid(), cleaned);
end;
$$;

revoke all on function private.add_bug_report_comment(bigint, text) from public;
grant execute on function private.add_bug_report_comment(bigint, text) to anon, authenticated;

create or replace function public.add_bug_report_comment(
	report_id bigint,
	body text
) returns void
language sql
security invoker
set search_path = public, pg_temp
as $$
	select private.add_bug_report_comment(report_id, body);
$$;

revoke all on function public.add_bug_report_comment(bigint, text) from public;
grant execute on function public.add_bug_report_comment(bigint, text) to anon, authenticated;

-- ---- retire the old single-reply RPC --------------------------------------
drop function if exists public.reply_to_bug_report_admin_comment(bigint, text);
drop function if exists private.reply_to_bug_report_admin_comment(bigint, text);
