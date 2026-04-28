-- =========================================================================
-- RO Calculator — admin-managed custom items & monsters
--
-- Lets users with role='admin' add new items and custom monsters that get
-- merged into the calculator alongside the static JSON data shipped in
-- assets/. Images go into two public Storage buckets so the anon client
-- can render them without auth.
--
-- Tables:
--   custom_items     — keyed on the item id (matches keys in item.json)
--   custom_monsters  — keyed on the monster id (matches keys in monster.json)
--
-- Policies:
--   - Anyone (incl. anon) can SELECT.
--   - Only admins (public.is_admin()) can INSERT / UPDATE / DELETE.
-- =========================================================================

-- ---- custom_items ------------------------------------------------------
create table public.custom_items (
  id          bigint primary key,
  data        jsonb not null,
  image_path  text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger custom_items_updated_at
  before update on public.custom_items
  for each row execute function public.touch_updated_at();

alter table public.custom_items enable row level security;

create policy custom_items_select_all on public.custom_items
  for select using (true);

create policy custom_items_admin_insert on public.custom_items
  for insert with check (public.is_admin());

create policy custom_items_admin_update on public.custom_items
  for update using (public.is_admin()) with check (public.is_admin());

create policy custom_items_admin_delete on public.custom_items
  for delete using (public.is_admin());

-- ---- custom_monsters ---------------------------------------------------
create table public.custom_monsters (
  id          bigint primary key,
  data        jsonb not null,
  image_path  text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger custom_monsters_updated_at
  before update on public.custom_monsters
  for each row execute function public.touch_updated_at();

alter table public.custom_monsters enable row level security;

create policy custom_monsters_select_all on public.custom_monsters
  for select using (true);

create policy custom_monsters_admin_insert on public.custom_monsters
  for insert with check (public.is_admin());

create policy custom_monsters_admin_update on public.custom_monsters
  for update using (public.is_admin()) with check (public.is_admin());

create policy custom_monsters_admin_delete on public.custom_monsters
  for delete using (public.is_admin());

-- ---- Storage buckets ---------------------------------------------------
-- Public-read so the calculator can render images via the anon key.
insert into storage.buckets (id, name, public)
  values ('custom-item-images', 'custom-item-images', true)
  on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
  values ('custom-monster-images', 'custom-monster-images', true)
  on conflict (id) do update set public = excluded.public;

-- Storage policies: public read, admin-only write.
drop policy if exists "custom_item_images_read" on storage.objects;
create policy "custom_item_images_read" on storage.objects
  for select using (bucket_id = 'custom-item-images');

drop policy if exists "custom_item_images_admin_write" on storage.objects;
create policy "custom_item_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'custom-item-images' and public.is_admin());

drop policy if exists "custom_item_images_admin_update" on storage.objects;
create policy "custom_item_images_admin_update" on storage.objects
  for update using (bucket_id = 'custom-item-images' and public.is_admin())
  with check (bucket_id = 'custom-item-images' and public.is_admin());

drop policy if exists "custom_item_images_admin_delete" on storage.objects;
create policy "custom_item_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'custom-item-images' and public.is_admin());

drop policy if exists "custom_monster_images_read" on storage.objects;
create policy "custom_monster_images_read" on storage.objects
  for select using (bucket_id = 'custom-monster-images');

drop policy if exists "custom_monster_images_admin_write" on storage.objects;
create policy "custom_monster_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'custom-monster-images' and public.is_admin());

drop policy if exists "custom_monster_images_admin_update" on storage.objects;
create policy "custom_monster_images_admin_update" on storage.objects
  for update using (bucket_id = 'custom-monster-images' and public.is_admin())
  with check (bucket_id = 'custom-monster-images' and public.is_admin());

drop policy if exists "custom_monster_images_admin_delete" on storage.objects;
create policy "custom_monster_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'custom-monster-images' and public.is_admin());
