# Supabase Setup Guide — RO Calculator

This guide walks you through creating a Supabase project and wiring it up to the RO Calculator. You only need to do this once.

## 1. Create a Supabase project

1. Go to https://supabase.com/dashboard and sign in (or create a free account).
2. Click **New project**.
   - Name: `ro-calculator` (or anything you like)
   - Database password: generate a strong one and **save it** (you won't need it for the frontend, but you'll need it for `psql`/CLI later).
   - Region: pick the one closest to your users (Singapore or Tokyo for Thailand).
   - Pricing plan: Free tier is fine to start.
3. Wait ~2 minutes for the project to provision.

## 2. Grab your API credentials

From the dashboard left sidebar:

- **Project Settings → API**
  - Copy **Project URL** (looks like `https://xxxxx.supabase.co`)
  - Copy **anon public** key (the one labeled `anon` — NOT `service_role`)

> ⚠️ **NEVER paste the `service_role` key into the frontend.** It bypasses RLS.

## 3. Wire credentials into the app

Edit `src/environments/environment.ts` and `src/environments/environment.prod.ts`:

```ts
supabase: {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_ANON_KEY',
},
```

For local dev you can hardcode them. For prod consider injecting at build time, but since this is a static GH Pages app, plain config is fine — the anon key is meant to be public.

## 4. Configure auth providers

### Email + Password

1. **Authentication → Providers → Email** → enable.
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://tongaphisit.github.io/ro-calculator/` (prod). For dev also add `http://localhost:4200/`.
   - **Redirect URLs**: add both:
     - `http://localhost:4200/**`
     - `https://tongaphisit.github.io/ro-calculator/**`
3. **Authentication → Email Templates**: optionally customize confirm/reset templates.
4. Decide if you want **Confirm email** on (recommended): Authentication → Providers → Email → "Confirm email".

### Google OAuth

1. Go to https://console.cloud.google.com/apis/credentials
2. Create an **OAuth 2.0 Client ID** (Web application).
   - Authorized redirect URIs: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret**.
4. In Supabase: **Authentication → Providers → Google** → paste both → enable.

### Discord OAuth

1. Go to https://discord.com/developers/applications → **New Application**.
2. **OAuth2 → General** → Redirects → add `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
3. Copy **Client ID** and **Client Secret** (reset secret if needed).
4. In Supabase: **Authentication → Providers → Discord** → paste both → enable.

## 5. Apply the database schema (Phase 2 — presets)

When you're ready to migrate presets off the old backend onto Supabase, see [phase-2-preset-migration.md](./phase-2-preset-migration.md).

## 6. Smoke test

1. `npm start`
2. Navigate to `/login`
3. Try signing up with email — you should receive a confirmation email.
4. Try Google / Discord — they should redirect, return, and log you in.
5. Topbar should show your email/name when logged in.
