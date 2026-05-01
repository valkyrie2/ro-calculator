# Ragnarok Online Calculator

A **Ragnarok Online damage/DPS calculator** built with Angular 16, PrimeNG, and PrimeFlex. Supports 55+ job classes, item/equipment systems with bonuses, skill-based damage calculations, user authentication, and shareable presets.

**Live Site:** [https://valkyrie2.github.io/ro-calculator/#/](https://valkyrie2.github.io/ro-calculator/#/)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Key Modules & Features](#key-modules--features)
- [Available Scripts](#available-scripts)
- [Environment Configuration](#environment-configuration)
- [Supabase Setup](#supabase-setup)
- [Deployment](#deployment)
- [Data Tools](#data-tools)
- [Developer Notes](#developer-notes)
- [Version History](#version-history)

---

## Tech Stack

| Layer          | Technology                                         |
|----------------|-----------------------------------------------------|
| Framework      | Angular 16.1 (NgModule-based, AOT, esbuild)        |
| UI Library     | PrimeNG 16 + PrimeFlex 3.3                         |
| Theme          | Vela Green (dark theme)                              |
| Styling        | SCSS                                                |
| Backend        | Supabase (Postgres + Auth + Realtime)               |
| Auth           | Supabase Auth (email/password, PKCE flow)           |
| Charts         | Chart.js 3                                          |
| Calendar       | FullCalendar 6                                      |
| Code Highlight | Prism.js                                            |
| State Mgmt     | RxJS 7.8 (services + ReplaySubject)                |
| Build Tool     | Angular CLI + esbuild (browser-esbuild builder)     |
| Testing        | Karma + Jasmine (headless Chrome)                   |
| Linting        | ESLint (`no-explicit-any: warn`, `no-console: warn`)|
| Language       | TypeScript 5.1                                      |

---

## Prerequisites

- **Node.js** >= 16.x (LTS recommended)
- **npm** >= 8.x
- **Angular CLI** ~16.1 (installed globally or via npx)

```bash
# Install Angular CLI globally (optional)
npm install -g @angular/cli@16
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ro-calculator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

This runs `ng serve --host 0.0.0.0 --hmr --port 4200` with Hot Module Replacement enabled.

Open your browser at **http://localhost:4200**.

Alternatively, to open the browser automatically:

```bash
ng serve --open
```

---

## Project Structure

```
ro-calculator/
├── src/
│   ├── index.html                    # App entry with Vela Green theme
│   ├── main.ts                       # Angular bootstrap (AppModule)
│   ├── styles.scss                   # Global styles (PrimeNG, PrimeFlex, PrimeIcons)
│   ├── app/
│   │   ├── app.module.ts             # Root module (JWT, Layout, API services)
│   │   ├── app-routing.module.ts     # Root routes with lazy loading
│   │   ├── app.component.ts          # Root component (PrimeNG ripple config)
│   │   ├── api-services/             # Services for backend communication
│   │   │   ├── supabase-client.service.ts # Singleton Supabase client (PKCE auth)
│   │   │   ├── auth.service.ts       #   Supabase auth + user_profiles (role/premium)
│   │   │   ├── ro.service.ts         #   Monsters, items, HP/SP tables (static JSON)
│   │   │   ├── preset.service.ts     #   Preset CRUD, sharing, tagging (Supabase)
│   │   │   ├── summary.service.ts    #   Cached summary data
│   │   │   ├── logger.service.ts     #   Dev-only logger (no-ops in production)
│   │   │   ├── analytics.service.ts  #   Umami analytics
│   │   │   ├── valid-bonuses.ts      #   Bonus type definitions
│   │   │   └── models/               #   DTOs (profile, preset, etc.)
│   │   ├── app-config/               # App-wide config (4th job level cap, compare rules)
│   │   ├── app-errors/               # Custom error types (BaseError, Unauthorized)
│   │   ├── constants/                # Game data constants
│   │   │   ├── element-*.ts          #   Element types, converters, mappers
│   │   │   ├── item-*.ts             #   Item types, options, enums
│   │   │   ├── weapon-*.ts           #   Weapon types, ammo mapping
│   │   │   ├── skill-name.ts         #   Skill name constants
│   │   │   ├── job-buffs.ts          #   Job-specific buffs
│   │   │   ├── size-penalty-mapper.ts #  Size penalty tables
│   │   │   ├── enchant_item/         #   Enchantment item data
│   │   │   └── share-active-skills/  #   Shared active/passive skill defs
│   │   ├── domain/                   # Domain models (Monster, Weapon)
│   │   ├── jobs/                     # 55+ job class implementations
│   │   │   ├── _character-base.abstract.ts  # Base character (shared logic)
│   │   │   ├── _class-list.ts        #   Registry of all jobs
│   │   │   ├── _class-name.ts        #   Job name enum/constants
│   │   │   ├── _aspd-table.ts        #   ASPD lookup table
│   │   │   ├── _raw-job.ts           #   Shared job structure
│   │   │   ├── _skill-builder.ts     #   `atkSkill()` helper — removes label/value boilerplate
│   │   │   ├── [JobName].ts          #   Individual job implementations
│   │   │   └── summons/              #   Summon-type entities
│   │   ├── layout/                   # PrimeNG dashboard layout
│   │   │   ├── app.layout.component.ts   # Main layout shell
│   │   │   ├── app.topbar.component.ts   # Top navigation bar
│   │   │   ├── app.sidebar.component.ts  # Collapsible sidebar
│   │   │   ├── app.menu.component.ts     # Menu items
│   │   │   ├── app.footer.component.ts   # Footer
│   │   │   └── pages/                    # Feature pages
│   │   │       ├── ro-calculator/        #   Main calculator (damage, equipment, skills)
│   │   │       ├── shared-preset/        #   Browse public presets
│   │   │       ├── preset-summary/       #   Preset summary/compare
│   │   │       └── auth/                 #   Login page
│   │   ├── models/                   # Core data models
│   │   │   ├── main.model.ts         #   Character data (class, level, all stats)
│   │   │   ├── damage-summary.model.ts #  Damage/DPS calculation outputs
│   │   │   ├── equipment-summary.model.ts # Equipment bonus aggregation
│   │   │   ├── status-summary.model.ts #  Status breakdown (base/equip/total)
│   │   │   ├── item.model.ts         #   Game item definition
│   │   │   ├── monster.model.ts      #   Monster definition
│   │   │   ├── info-for-class.model.ts # Aggregated data for damage calc
│   │   │   ├── pre-calc-skill.model.ts # Skill data before calculation
│   │   │   ├── post-calc-skill.model.ts # Skill data after calculation
│   │   │   └── hp-sp-table.model.ts  #   HP/SP scaling tables
│   │   └── utils/                    # Utility functions (31 files)
│   │       ├── calc-dmg-dps.ts       #   Damage → DPS calculation
│   │       ├── calc-skill-aspd.ts    #   Skill attack speed
│   │       ├── create-main-model.ts  #   Factory for default character model
│   │       ├── add-bonus.ts          #   Bonus accumulator/merger
│   │       ├── can-used-by-class.ts  #   Class → item validation
│   │       └── ...                   #   More calculation & formatting helpers
│   ├── assets/
│   │   ├── demo/                     # Demo/sample assets
│   │   └── layout/                   # Theme CSS and layout assets
│   └── environments/
│       ├── environment.model.ts      # Environment interface definition
│       ├── environment.ts            # Development config (imports supabase secrets)
│       ├── environment.prod.ts       # Production config (imports supabase secrets)
│       ├── supabase.secrets.ts       # **gitignored** — real URL + anon key
│       └── supabase.secrets.example.ts # Committed template; copy → supabase.secrets.ts
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD — build + deploy to GitHub Pages
├── supabase/
│   └── migrations/                   # SQL migrations (apply via Dashboard or `supabase db push`)
├── tools/                            # Python data scraping/parsing scripts
│   ├── item_download.py              #   Download item data
│   ├── item_parser.py                #   Parse items to JSON
│   └── monster_parser.py             #   Parse monsters to JSON
├── angular.json                      # Angular workspace config
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript compiler base config
├── tsconfig.app.json                 # App-specific TS config
├── tsconfig.spec.json                # Test-specific TS config
├── deploy.bat                        # One-click deploy script (Windows)
└── test.bat                          # Quick test script (Windows)
```

---

## Architecture Overview

### Application Bootstrap

```
index.html → main.ts → AppModule → AppComponent → <router-outlet>
```

- `AppModule` registers JWT configuration, layout module, and API services.
- Uses `HashLocationStrategy` for GitHub Pages compatibility (`/#/` URLs).

### Routing (Lazy Loaded)

| Route              | Module              | Description                        |
|--------------------|---------------------|------------------------------------|
| `/`                | RoCalculatorModule  | Main calculator (damage, skills, equipment) |
| `/shared-presets`  | SharedPresetModule  | Browse presets shared by other users |
| `/preset-summary`  | PresetSummaryModule | Preset comparison and summaries    |
| `/login`           | AuthModule          | User authentication                |
| `**` (wildcard)    | —                   | Redirects to `/`                   |

### Data Flow

```
Supabase (Postgres + Auth)               Static JSON (item.json, monster.json)
        ↓                                          ↓
   AuthService / PresetService              RoService / SummaryService
        ↓                                          ↓
              Components (layout pages)
                          ↓
              Calculation Utils (damage, DPS, ASPD)
                          ↓
              Display (PrimeNG + Chart.js)
```

Row-Level Security (RLS) on every Supabase table enforces ownership; the
browser only ever talks to Supabase with the public anon key.

### Job System

All 55+ jobs extend `_character-base.abstract.ts` which provides:
- Base stat calculations
- Skill definitions
- ASPD computation (via `_aspd-table.ts`)
- Passive/active skill integration

Each job file (e.g., `RuneKnight.ts`, `ArchBishop.ts`) defines job-specific:
- Skills and their damage formulas
- Passive bonuses
- Equipment restrictions
- Class-specific mechanics

### Key Calculation Pipeline

```
Character Stats + Equipment Bonuses + Skill Selection + Monster Data
        ↓
   InfoForClass Model (aggregated input)
        ↓
   Pre-Calc Skill → Damage Formula → Post-Calc Skill
        ↓
   DPS Calculation (min/max/crit/accuracy with 2-hit system)
        ↓
   DamageSummaryModel (final output)
```

---

## Key Modules & Features

### RO Calculator (Main Page)
- **Status Input** — Configure character stats (STR, AGI, VIT, INT, DEX, LUK) and trait stats (POW, STA, WIS, SPL, CON, CRT)
- **Equipment Setup** — Select weapons, armor, cards, enchantments with bonus calculations
- **Skill Selection** — Choose and configure skills with level selection
- **Damage Calculation** — Real-time min/max/crit damage and DPS output
- **Monster Data View** — Select target monster with element, race, size properties
- **Battle Summary** — Comprehensive damage breakdown
- **Preset Management** — Save/load equipment and stat configurations (local + cloud sync)

### Custom Bonus Tab
- Manually add bonus stats for theorycrafting / testing
- Accepts custom item-script input
- Displays pseudo damage for verifying base damage with custom bonuses
- Custom equipment compare (Proc & damage diff vs current equip)

### DPS Compare Tab
- Compare DPS across multiple presets side by side
- Load own presets or shared presets for comparison

### EXP Calculator Tab
- Calculates EXP / Job EXP yield from monsters
- Level-difference modifier table (Monster Lv. vs Player Lv.)
- Full EXP modifier support: Equip Bonus, MR. Kim A.L.F.C, Battle Manual, VIP, Job Manual, Event EXP%, Kafra Buff, EXP Tap
- Monster Spotlight group (time-boxed event monsters)
- Player level syncs from the main Calculator tab

### Shared Presets
- Browse community-shared presets
- View equipment details and skill configurations

### Preset Summary
- Compare presets side by side
- Aggregated summary views

### Authentication & Roles
- Supabase Auth — email/password sign-up, sign-in, password reset (PKCE flow)
- OAuth providers (Google, Discord) wired but UI hidden until enabled in the Supabase Dashboard
- Session persisted in `localStorage` and auto-refreshed
- `user_profiles` table adds `role: 'user' | 'admin'` and `premium_expires_at`
- `AuthService` exposes `isAdmin$` / `isPremium$` observables (premium = admin OR future expiry)
- Helper SQL functions `public.is_admin()` / `public.is_premium()` (SECURITY DEFINER) for use in RLS policies on other tables
- Required for saving/sharing presets

---

## Available Scripts

| Command             | Description                                              |
|---------------------|----------------------------------------------------------|
| `npm start`         | Dev server with HMR at `http://localhost:4200`           |
| `npm run start2`    | Dev server (default ng serve)                            |
| `npm run build`     | Production build (AOT, output hashing)                   |
| `npm test`          | Run unit tests via Karma                                 |
| `npm run lint`      | Lint and auto-fix with ESLint                            |
| `npm run e2e`       | Run end-to-end tests                                     |
| `npm run predeploy` | Build for GitHub Pages into `docs/` (used by CI)         |
| `npm run deploy`    | Copy `index.html` → `404.html` for SPA routing (used by CI) |
| `test.bat`          | Quick shortcut: `ng serve --open`                        |

---

## Environment Configuration

Environment files are in `src/environments/`:

| Variable           | Purpose                          | Value (Dev & Prod)                        |
|--------------------|----------------------------------|-------------------------------------------|
| `production`       | Production mode flag             | `false` (dev) / `true` (prod)             |
| `supabase.url`     | Supabase project URL             | `https://<ref>.supabase.co`               |
| `supabase.anonKey` | Supabase anon (public) key       | JWT or `sb_publishable_*` key             |
| `surveyUrl`        | User feedback form               | Google Forms link                         |
| `issueTrackingUrl` | Bug/issue tracker                | Google Sheets link                        |
| `youtubeVideoUrl`  | Tutorial video                   | YouTube playlist link                     |

The Supabase URL and anon key are NOT stored inline in `environment.ts` /
`environment.prod.ts` — both files import from `./supabase.secrets`, which is
**gitignored**. To set up locally:

```bash
cp src/environments/supabase.secrets.example.ts src/environments/supabase.secrets.ts
# then edit supabase.secrets.ts and paste your project URL + anon key from
# Supabase Dashboard → Project Settings → API
```

The anon key is safe to ship to the browser — RLS policies enforce all access
control. CI/host setups must materialize `supabase.secrets.ts` before
`ng build` runs (e.g. write it from a CI secret).

During production build, `environment.ts` is replaced with `environment.prod.ts`
via Angular's `fileReplacements` in `angular.json`.

---

## Supabase Setup

The project ships SQL migrations under `supabase/migrations/`:

| Migration                                  | Purpose                                                 |
|--------------------------------------------|---------------------------------------------------------|
| `20260425000000_init_presets.sql`          | `ro_presets`, `preset_tags`, `preset_tag_likes`, RLS, `get_published_presets` RPC |
| `20260425000100_user_roles.sql`            | `user_profiles` (role + premium_expires_at), signup trigger, `is_admin()` / `is_premium()` |
| `20260426000000_fix_user_profiles_rls.sql` | Fixes infinite-recursion RLS on `user_profiles` (helpers become `SECURITY DEFINER`) |

### Option A — paste in SQL Editor

Supabase Dashboard → **SQL Editor → New query**, paste each file in order, **Run**.

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### Promote yourself to admin

In the Dashboard SQL Editor (which uses the service role and bypasses RLS):

```sql
select id, email from auth.users;
update public.user_profiles set role = 'admin' where id = '<your-uuid>';
```

### Grant premium access

```sql
update public.user_profiles
set premium_expires_at = now() + interval '30 days'
where id = '<user-uuid>';
```

---

## Deployment

The project is deployed to **GitHub Pages** automatically via GitHub Actions. Pushing to `main` triggers a build-and-deploy workflow — no manual steps required.

### One-Time Setup

1. **Create a GitHub repository** named `ro-calculator` under your account.

2. **Push your code:**
   ```bash
   git remote add origin https://github.com/valkyrie2/ro-calculator.git
   git branch -M main
   git push -u origin main
   ```

3. **Add repository secrets** (Settings → Secrets and variables → Actions):

   | Secret name        | Value                                   |
   |--------------------|-----------------------------------------|
   | `SUPABASE_URL`     | Your Supabase project URL               |
   | `SUPABASE_ANON_KEY`| Your Supabase anon (public) key         |

4. **Enable GitHub Pages** (Settings → Pages → Source): select **GitHub Actions**.

### How It Works

The workflow file is at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

On every push to `main`:
1. Checks out the code.
2. Installs dependencies (`npm ci`).
3. Materializes `supabase.secrets.ts` from the repository secrets.
4. Runs `npm run predeploy` (Angular build → `docs/`).
5. Copies `index.html` → `404.html` for SPA routing.
6. Uploads `docs/` as a Pages artifact and deploys via `actions/deploy-pages`.

> The `docs/` build output is **gitignored** — it is generated entirely by CI and never committed.

You can also trigger a deploy manually from the **Actions** tab → **Build and Deploy to GitHub Pages** → **Run workflow**.

After a successful run, your site will be live at **https://valkyrie2.github.io/ro-calculator/#/**.

---

## Data Tools

Python scripts in the `tools/` directory are used to scrape and parse Ragnarok Online game data:

| Script               | Purpose                                       |
|----------------------|-----------------------------------------------|
| `item_download.py`   | Downloads raw item data from a source          |
| `item_parser.py`     | Parses item data into JSON for the app         |
| `monster_parser.py`  | Parses monster data into JSON for the app      |

These generate the static JSON files (`item.json`, `monster.json`) consumed by `RoService`.

### Running the tools

```bash
cd tools
python item_download.py
python item_parser.py
python monster_parser.py
```

> **Note:** Requires Python 3.x. Check each script for any additional dependencies.

---

## Developer Notes

### Logging

Use the `LoggerService` (DI) or the `logger` singleton (for non-DI contexts like utils / constants) from [`src/app/api-services/logger.service.ts`](src/app/api-services/logger.service.ts). All `log`/`warn`/`info`/`debug` calls become no-ops when `environment.production === true`. Only `error()` always passes through so production diagnostics still surface.

ESLint flags raw `console.log` as a warning — `console.warn` and `console.error` are allowed through for fast debug scenarios.

### Skill name invariants

[`src/app/constants/skill-name.ts`](src/app/constants/skill-name.ts) intentionally keeps the in-game typos `Fatal Manace` and `Lightening Bolt`. The item data (`item.json`) uses these exact strings as script keys, and `RoService` validates every key against the list. Regression guards live in [`src/app/constants/skill-name.spec.ts`](src/app/constants/skill-name.spec.ts).

### Skill definition helper

New `AtkSkillModel` entries in `src/app/jobs/*.ts` can use `atkSkill({ name, level, includeImproved, formula, … })` from [`_skill-builder.ts`](src/app/jobs/_skill-builder.ts) instead of hand-writing the `label` / `value` / `values` / default-cooldown scaffolding. See [`RoyalGuard.ts`](src/app/jobs/RoyalGuard.ts) (Banishing Point, Genesis Ray) for a working reference.

### Angular upgrade

Angular 16 is EOL (Nov 2024). The staged upgrade plan — covering 16→17→18→19, PrimeNG migration risk, and alt-library trade-offs — lives in [`angular-upgrade-plan.md`](angular-upgrade-plan.md).

### Running tests

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Current coverage is smoke-only (9 specs). Priority additions: `RoService`, `PresetService`, `damage-calculator`, `calculator`.

---

## Version History

| Version          | Highlights                                                                             |
|------------------|----------------------------------------------------------------------------------------|
| (unreleased)     | **Supabase migration** — replaced JWT backend with Supabase Auth + Postgres; admin role; premium-with-expiry membership |
| Extra v59.3      | Added 6th Anniversary monsters (Bio Naga, Bio Ancient Tree, Bio Dollocaris); Daily Dungeon - Thursday (ไพรภิรมย์) group with orange tag |
| Extra v59.2      | Umami analytics + opt-out; AdSense integration (`AdSlotComponent`, ads.txt); LoggerService |
| Extra v59.1      | Added 6th Anniversary Ayothaya Ring [1]                                                |
| Extra v59        | EXP Calculator tab; Monster Spotlight Summer 2026; expBonus scripts on 26 items        |
| Extra v58.4      | Added Limit Break Shadow Earring / Pendant                                             |
| Extra v58.2      | Custom equipment compare (Custom Bonus tab); Compare Preset in DPS Compare tab         |
| Extra v58.1      | New **Custom Bonus** tab — manual bonus input, custom item scripts, pseudo damage view |
| Extra v58        | Ranger / SR / Sorcerer skill bonuses; new items; 4th slot garment costume              |
| 1.0.3            | Weapon compare fix; new items & monsters                                               |
| 1.0.2            | EDP calculation fix; Rolling Cutter → Melee damage                                     |
| 1.0.1            | Item bonus fix; Shadow monster calc fix; Racing cap & Enchants                         |
| 1.0.0            | Initial release: 10+ job support, presets, item compare, ESLint                        |

See [CHANGELOG.md](CHANGELOG.md) for full details.
