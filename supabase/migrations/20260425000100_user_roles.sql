-- =========================================================================
-- RO Calculator — user roles & premium membership
--
-- Adds a `user_profiles` table keyed on auth.users.id with:
--   - role: 'user' | 'admin' (extensible via the role_check constraint)
--   - premium_expires_at: NULL when not premium, future timestamptz when active
--
-- A profile row is auto-created on signup via a trigger on auth.users.
--
-- Helper functions `public.is_admin()` and `public.is_premium()` read the
-- viewer's profile and are usable in RLS policies on other tables.
-- =========================================================================

-- ---- Table -------------------------------------------------------------
create table public.user_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  role                text not null default 'user',
  premium_expires_at  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint user_profiles_role_check check (role in ('user', 'admin'))
);

create index user_profiles_role_idx              on public.user_profiles (role) where role <> 'user';
create index user_profiles_premium_expires_idx  on public.user_profiles (premium_expires_at) where premium_expires_at is not null;

-- ---- updated_at trigger -------------------------------------------------
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.touch_updated_at();

-- ---- Auto-create profile on signup --------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: ensure every existing user has a profile row.
insert into public.user_profiles (id)
select u.id from auth.users u
left join public.user_profiles p on p.id = u.id
where p.id is null;

-- ---- RLS ----------------------------------------------------------------
alter table public.user_profiles enable row level security;

-- Anyone signed in may read their own profile.
create policy "users read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

-- Admins may read every profile.
create policy "admins read all profiles"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles me
      where me.id = auth.uid() and me.role = 'admin'
    )
  );

-- Only admins may insert / update / delete profiles. (Signup uses the
-- SECURITY DEFINER trigger above, which bypasses RLS.)
create policy "admins write profiles"
  on public.user_profiles for all
  using (
    exists (
      select 1 from public.user_profiles me
      where me.id = auth.uid() and me.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles me
      where me.id = auth.uid() and me.role = 'admin'
    )
  );

-- ---- Helper SQL ---------------------------------------------------------
-- Both helpers run with the caller's privileges (security invoker is the
-- default for `language sql`) so they respect RLS on user_profiles.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_premium()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid()
      and (
        role = 'admin'
        or (premium_expires_at is not null and premium_expires_at > now())
      )
  );
$$;
