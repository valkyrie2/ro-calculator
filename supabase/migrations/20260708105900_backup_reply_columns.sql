-- =========================================================================
-- RO Calculator — safety snapshot of single-reply columns
--
-- 20260708110000_bug_report_comments.sql migrates these values into
-- bug_report_comments and then drops the columns. This snapshot keeps the
-- raw originals recoverable in-database (private schema: not exposed via
-- PostgREST, no grants to anon/authenticated).
-- Drop this table once the comment thread is verified in production:
--   drop table private.bug_reports_reply_backup_20260708;
-- =========================================================================

create table private.bug_reports_reply_backup_20260708 as
select
	id,
	admin_reply,
	admin_replied_at,
	admin_replied_by,
	public_reply,
	public_replied_at,
	public_reply_admin_replied_at,
	created_at,
	updated_at
from public.bug_reports
where admin_reply is not null or public_reply is not null;
