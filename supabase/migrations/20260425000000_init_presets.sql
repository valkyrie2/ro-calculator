-- =========================================================================
-- RO Calculator — preset system schema
--
-- Apply with `supabase db push` (after `supabase link`) or paste this whole
-- file into the SQL editor on the Supabase dashboard.
-- =========================================================================

-- =========================================================================
-- ro_presets: per-user saved calculator presets
-- =========================================================================
create table public.ro_presets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  label           text not null,
  class_id        int  not null,
  model           jsonb not null,                  -- the full PresetModel JSON
  publish_name    text,                            -- snapshot at publish time
  publisher_name  text,                            -- snapshot at publish time
  is_published    boolean not null default false,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index ro_presets_user_id_idx        on public.ro_presets (user_id);
create index ro_presets_published_class_idx on public.ro_presets (is_published, class_id) where is_published = true;

alter table public.ro_presets enable row level security;

-- Owners do anything to their presets
create policy "owners read own presets"   on public.ro_presets for select using (auth.uid() = user_id);
create policy "owners insert own presets" on public.ro_presets for insert with check (auth.uid() = user_id);
create policy "owners update own presets" on public.ro_presets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners delete own presets" on public.ro_presets for delete using (auth.uid() = user_id);

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
create index preset_tags_preset_id_idx on public.preset_tags (preset_id);

alter table public.preset_tags enable row level security;
create policy "anyone reads preset tags"     on public.preset_tags for select using (true);
create policy "publishers manage own tags"   on public.preset_tags for all
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

create index preset_tag_likes_tag_id_idx on public.preset_tag_likes (tag_id);

alter table public.preset_tag_likes enable row level security;
create policy "anyone reads likes"        on public.preset_tag_likes for select using (true);
create policy "users manage own likes"    on public.preset_tag_likes for all
  using    (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =========================================================================
-- View: preset_tag_summary (with like counts + viewer's like state)
-- security_invoker = true so RLS on preset_tags / preset_tag_likes applies.
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
-- RPC: get_published_presets
-- Returns paginated published presets for a (class_id, tag) filter, with
-- per-row total_like, viewer-specific liked flag, total_count for paging,
-- and a tags map ({tag: like_count}) summarising every tag on each preset.
-- =========================================================================
create or replace function public.get_published_presets(
  p_class_id int,
  p_tag      text,
  p_skip     int default 0,
  p_take     int default 20
)
returns table (
  tag_id          uuid,
  preset_id       uuid,
  tag             text,
  liked           boolean,
  total_like      int,
  created_at      timestamptz,
  publish_name    text,
  publisher_name  text,
  model           jsonb,
  tags            jsonb,
  total_count     bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with matching as (
    select pt.id, pt.preset_id, pt.tag, pt.created_at
    from public.preset_tags pt
    join public.ro_presets p on p.id = pt.preset_id and p.is_published = true
    where pt.class_id = p_class_id and pt.tag = p_tag
  ),
  paged as (
    select m.*, count(*) over () as total_count
    from matching m
    order by m.created_at desc
    offset greatest(coalesce(p_skip, 0), 0)
    limit  greatest(coalesce(p_take, 20), 1)
  )
  select
    pg.id        as tag_id,
    pg.preset_id,
    pg.tag,
    exists (select 1 from public.preset_tag_likes l where l.tag_id = pg.id and l.user_id = auth.uid()) as liked,
    (select count(*)::int from public.preset_tag_likes l where l.tag_id = pg.id) as total_like,
    pg.created_at,
    p.publish_name,
    p.publisher_name,
    p.model,
    coalesce(
      (select jsonb_object_agg(s.tag, s.total_like)
         from public.preset_tag_summary s
         where s.preset_id = pg.preset_id),
      '{}'::jsonb
    ) as tags,
    pg.total_count
  from paged pg
  join public.ro_presets p on p.id = pg.preset_id;
$$;

-- =========================================================================
-- updated_at triggers
-- =========================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ro_presets_updated_at  before update on public.ro_presets  for each row execute function public.touch_updated_at();
create trigger preset_tags_updated_at before update on public.preset_tags for each row execute function public.touch_updated_at();
