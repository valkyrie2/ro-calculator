# Phase 2 — Migrate Presets to Supabase

Phase 1 (this commit) replaces the auth layer with Supabase. The existing preset CRUD (`PresetService`) still POINTS at the old backend at `https://ro-calc.luminotus.com` and will fail with 401 once users authenticate via Supabase, because the old backend issues its own JWTs and won't accept Supabase tokens.

Phase 2 moves preset data into Supabase Postgres and rewrites `PresetService` to use the Supabase client.

## Schema

Apply via the SQL editor in the Supabase dashboard, or via `supabase migration new init_presets` then paste:

```sql
-- =========================================================================
-- ro_presets: per-user saved calculator presets
-- =========================================================================
create table public.ro_presets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  label         text not null,
  class_id      int  not null,
  model         jsonb not null,                  -- the full PresetModel JSON
  publish_name  text,                            -- non-null when shared
  is_published  boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index ro_presets_user_id_idx        on public.ro_presets (user_id);
create index ro_presets_published_class_idx on public.ro_presets (is_published, class_id) where is_published = true;

alter table public.ro_presets enable row level security;

-- Owners do anything to their presets
create policy "owners read their presets"   on public.ro_presets for select using (auth.uid() = user_id);
create policy "owners insert their presets" on public.ro_presets for insert with check (auth.uid() = user_id);
create policy "owners update their presets" on public.ro_presets for update using (auth.uid() = user_id);
create policy "owners delete their presets" on public.ro_presets for delete using (auth.uid() = user_id);

-- Anyone (incl. anon) can read PUBLISHED presets
create policy "anyone reads published presets" on public.ro_presets for select using (is_published = true);

-- =========================================================================
-- preset_tags: tags attached to published presets
-- =========================================================================
create table public.preset_tags (
  id           uuid primary key default gen_random_uuid(),
  preset_id    uuid not null references public.ro_presets(id) on delete cascade,
  publisher_id uuid not null references auth.users(id) on delete cascade,
  class_id     int  not null,
  tag          text not null,
  label        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (preset_id, tag)
);

create index preset_tags_class_tag_idx on public.preset_tags (class_id, tag);

alter table public.preset_tags enable row level security;
create policy "anyone reads preset tags"        on public.preset_tags for select using (true);
create policy "publishers manage their tags"    on public.preset_tags for all
  using    (auth.uid() = publisher_id)
  with check (auth.uid() = publisher_id);

-- =========================================================================
-- preset_tag_likes: per-user "likes" on tags
-- =========================================================================
create table public.preset_tag_likes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  tag_id     uuid not null references public.preset_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tag_id)
);

alter table public.preset_tag_likes enable row level security;
create policy "anyone reads likes"        on public.preset_tag_likes for select using (true);
create policy "users manage their likes"  on public.preset_tag_likes for all
  using    (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =========================================================================
-- View: preset_tag_summary (with like counts + viewer's like state)
-- =========================================================================
create or replace view public.preset_tag_summary
with (security_invoker = true)
as
select
  pt.id,
  pt.preset_id,
  pt.publisher_id,
  pt.class_id,
  pt.tag,
  pt.label,
  pt.created_at,
  pt.updated_at,
  (select count(*)::int from public.preset_tag_likes l where l.tag_id = pt.id) as total_like,
  exists (select 1 from public.preset_tag_likes l where l.tag_id = pt.id and l.user_id = auth.uid()) as liked
from public.preset_tags pt;

-- =========================================================================
-- updated_at triggers
-- =========================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger ro_presets_updated_at  before update on public.ro_presets  for each row execute function public.touch_updated_at();
create trigger preset_tags_updated_at before update on public.preset_tags for each row execute function public.touch_updated_at();
```

## Code rewrite (Phase 2 follow-up)

After the schema is applied:

1. Rewrite `src/app/api-services/preset.service.ts` to use `SupabaseService.client.from('ro_presets')...` instead of `BaseAPIService.get/post/delete`.
2. Map snake_case columns to camelCase in the existing `RoPresetModel` interface (or use `.select('id, user_id:userId, ...')` aliasing).
3. Delete `BaseAPIService` and `JwtModule` once nothing else depends on them.
4. Delete `roBackendUrl` from environments.
5. Optionally write a one-shot migration script (`tools/migrate-presets-to-supabase.ts`) to dump existing users' presets from the old backend and `INSERT` them via the service-role key.

## Migrating existing users' data

Existing users have presets in the old backend. Options:

- **Lossy reset**: announce the migration; users re-import via Local→Cloud sync (the calculator already supports local presets).
- **Export → import**: build a one-off admin script that uses an old-backend admin token to dump everyone's presets to JSON, then bulk-insert into Supabase using `service_role`. Keys will need to be mapped to the new Supabase user ids (by email).
