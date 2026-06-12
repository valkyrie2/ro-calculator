-- =========================================================================
-- RO Calculator — allow Unicode preset labels / publish names
--
-- The previous charset constraints were ASCII-only allowlists, which
-- rejected Thai (and any non-Latin) labels with "Label has invalid
-- characters". The client-side Zod allowlist is now Unicode-aware
-- (\p{L}\p{M}\p{N}); Postgres regex classes cannot express that reliably
-- across locales (e.g. Thai tone marks U+0E48–U+0E4C are not [[:alnum:]]),
-- so the DB layer switches to a denylist of control characters and angle
-- brackets. Precise charset enforcement stays in the client schema.
--
-- Apply with `supabase db push` or paste into the Supabase SQL editor.
-- =========================================================================

do $$
begin
  alter table public.ro_presets
    drop constraint if exists ro_presets_label_charset_chk;

  begin
    alter table public.ro_presets
      add constraint ro_presets_label_charset_chk
        check (label !~ '[\x01-\x1F\x7F<>]') not valid;
  exception when duplicate_object then null;
  end;

  alter table public.ro_presets
    drop constraint if exists ro_presets_publish_name_charset_chk;

  begin
    alter table public.ro_presets
      add constraint ro_presets_publish_name_charset_chk
        check (publish_name is null or publish_name !~ '[\x01-\x1F\x7F<>]') not valid;
  exception when duplicate_object then null;
  end;
end$$;
