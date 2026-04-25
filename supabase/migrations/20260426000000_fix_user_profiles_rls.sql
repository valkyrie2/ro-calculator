-- =========================================================================
-- Fix infinite recursion in user_profiles RLS policies.
--
-- The original "admins read all profiles" / "admins write profiles" policies
-- ran a subquery against public.user_profiles, which re-triggered RLS and
-- caused error 42P17: "infinite recursion detected in policy for relation
-- user_profiles".
--
-- Solution: make `public.is_admin()` SECURITY DEFINER so it executes as the
-- function owner (postgres) and bypasses RLS, then call it from the policies.
-- =========================================================================

-- ---- Recreate is_admin() as SECURITY DEFINER ----------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- Recreate is_premium() as SECURITY DEFINER too ----------------------
-- (Same recursion risk if it's ever called from a user_profiles policy.)
create or replace function public.is_premium()
returns boolean
language sql
stable
security definer
set search_path = public
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

-- Lock the functions down to authenticated callers (anon doesn't need them).
revoke all on function public.is_admin()   from public;
revoke all on function public.is_premium() from public;
grant  execute on function public.is_admin()   to authenticated;
grant  execute on function public.is_premium() to authenticated;

-- ---- Rewrite the recursive policies -------------------------------------
drop policy if exists "admins read all profiles" on public.user_profiles;
drop policy if exists "admins write profiles"    on public.user_profiles;

create policy "admins read all profiles"
  on public.user_profiles for select
  using (public.is_admin());

create policy "admins write profiles"
  on public.user_profiles for all
  using      (public.is_admin())
  with check (public.is_admin());
