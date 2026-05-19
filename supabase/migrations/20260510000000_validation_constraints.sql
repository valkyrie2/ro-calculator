-- =========================================================================
-- RO Calculator — UGC validation constraints
--
-- Adds CHECK constraints to harden user-generated content at the DB layer,
-- complementing client-side Zod validation. Apply with `supabase db push`
-- or paste into the Supabase SQL editor.
--
-- Existing production rows may contain older names/tags that do not match
-- these rules. Add constraints as NOT VALID so they protect new writes
-- without blocking deployment on historical data.
-- =========================================================================

-- ---- ro_presets --------------------------------------------------------
do $$
begin
  begin
    alter table public.ro_presets
      add constraint ro_presets_label_length_chk
        check (char_length(label) between 1 and 60) not valid;
  exception when duplicate_object then null;
  end;

  begin
    alter table public.ro_presets
      add constraint ro_presets_label_charset_chk
        check (label ~ '^[a-zA-Z0-9 _\-./()]+$') not valid;
  exception when duplicate_object then null;
  end;

  begin
    alter table public.ro_presets
      add constraint ro_presets_model_size_chk
        check (octet_length(model::text) <= 65536) not valid;
  exception when duplicate_object then null;
  end;

  begin
    alter table public.ro_presets
      add constraint ro_presets_publish_name_length_chk
        check (publish_name is null or char_length(publish_name) between 1 and 80) not valid;
  exception when duplicate_object then null;
  end;

  begin
    alter table public.ro_presets
      add constraint ro_presets_publish_name_charset_chk
        check (publish_name is null or publish_name ~ '^[\w \-./()]+$') not valid;
  exception when duplicate_object then null;
  end;

  begin
    alter table public.ro_presets
      add constraint ro_presets_publisher_name_length_chk
        check (publisher_name is null or char_length(publisher_name) between 1 and 120) not valid;
  exception when duplicate_object then null;
  end;
end$$;

-- ---- preset_tags -------------------------------------------------------
do $$
begin
  begin
    alter table public.preset_tags
      add constraint preset_tags_tag_length_chk
        check (char_length(tag) between 1 and 24) not valid;
  exception when duplicate_object then null;
  end;

  begin
    alter table public.preset_tags
      add constraint preset_tags_tag_charset_chk
        check (tag ~ '^[a-zA-Z0-9_-]+$') not valid;
  exception when duplicate_object then null;
  end;

  begin
    alter table public.preset_tags
      add constraint preset_tags_label_length_chk
        check (label is null or char_length(label) between 1 and 80) not valid;
  exception when duplicate_object then null;
  end;
end$$;

-- ---- bug_reports -------------------------------------------------------
-- Bound user-submitted bug report text to prevent abuse (table created in
-- 20260429000100_bug_reports.sql; constraints kept generous to allow logs).
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'bug_reports') then
    -- Use IF NOT EXISTS pattern via exception swallow for idempotency.
    begin
      alter table public.bug_reports
        add constraint bug_reports_message_size_chk
          check (octet_length(coalesce(description, '')) <= 16384) not valid;
    exception when duplicate_object then null;
    end;
  end if;
end$$;
