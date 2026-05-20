-- =========================================================================
-- RO Calculator - harden public bug report reply RPC
--
-- Keep the PostgREST-facing function in public, but move elevated update
-- logic to an unexposed private schema.
-- =========================================================================

create schema if not exists private;

create or replace function private.reply_to_bug_report_admin_comment(
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

revoke all on function private.reply_to_bug_report_admin_comment(bigint, text) from public;
grant execute on function private.reply_to_bug_report_admin_comment(bigint, text) to anon, authenticated;

create or replace function public.reply_to_bug_report_admin_comment(
	report_id bigint,
	reply text
) returns void
language sql
security invoker
set search_path = public, pg_temp
as $$
	select private.reply_to_bug_report_admin_comment(report_id, reply);
$$;

revoke all on function public.reply_to_bug_report_admin_comment(bigint, text) from public;
grant execute on function public.reply_to_bug_report_admin_comment(bigint, text) to anon, authenticated;
