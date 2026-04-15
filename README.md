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
- [Deployment](#deployment)
- [Data Tools](#data-tools)
- [Version History](#version-history)

---

## Tech Stack

| Layer          | Technology                                         |
|----------------|-----------------------------------------------------|
| Framework      | Angular 16.1 (NgModule-based, AOT, esbuild)        |
| UI Library     | PrimeNG 16 + PrimeFlex 3.3                         |
| Theme          | Vela Green (dark theme)                              |
| Styling        | SCSS                                                |
| Auth           | JWT (`@auth0/angular-jwt`)                          |
| Charts         | Chart.js 3                                          |
| Calendar       | FullCalendar 6                                      |
| Code Highlight | Prism.js                                            |
| State Mgmt     | RxJS 7.8 (services + ReplaySubject)                |
| Build Tool     | Angular CLI + esbuild (browser-esbuild builder)     |
| Testing        | Karma + Jasmine                                     |
| Linting        | ESLint + @angular-eslint + unused-imports plugin    |
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
│   │   ├── api-services/             # HTTP services for backend communication
│   │   │   ├── auth.service.ts       #   JWT login/logout/profile
│   │   │   ├── ro.service.ts         #   Monsters, items, HP/SP tables
│   │   │   ├── preset.service.ts     #   Preset CRUD, sharing, tagging
│   │   │   ├── summary.service.ts    #   Cached summary data
│   │   │   ├── base-api.service.ts   #   Abstract HTTP base class
│   │   │   ├── valid-bonuses.ts      #   Bonus type definitions
│   │   │   └── models/               #   API DTOs and response interfaces
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
│       ├── environment.ts            # Development config
│       └── environment.prod.ts       # Production config
├── docs/                             # GitHub Pages deployment output (generated)
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
Backend API (ro-calc.luminotus.com)
        ↓
   API Services (auth, ro, preset, summary)
        ↓
   Components (layout pages)
        ↓
   Calculation Utils (damage, DPS, ASPD)
        ↓
   Display (PrimeNG components + Chart.js)
```

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
- **Preset Management** — Save/load equipment and stat configurations

### Shared Presets
- Browse community-shared presets
- View equipment details and skill configurations

### Preset Summary
- Compare presets side by side
- Aggregated summary views

### Authentication
- JWT-based login/logout
- Token stored in localStorage
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
| `npm run predeploy` | Build for GitHub Pages into `tong-calc-ro-host/docs`     |
| `npm run deploy`    | Copy `index.html` → `404.html` for SPA routing support  |
| `test.bat`          | Quick shortcut: `ng serve --open`                        |
| `deploy.bat`        | Full deploy: `npm run predeploy && npm run deploy`       |

---

## Environment Configuration

Environment files are in `src/environments/`:

| Variable           | Purpose                          | Value (Dev & Prod)                        |
|--------------------|----------------------------------|-------------------------------------------|
| `production`       | Production mode flag             | `false` (dev) / `true` (prod)             |
| `roBackendUrl`     | Backend API base URL             | `https://ro-calc.luminotus.com`           |
| `surveyUrl`        | User feedback form               | Google Forms link                         |
| `issueTrackingUrl` | Bug/issue tracker                | Google Sheets link                        |
| `youtubeVideoUrl`  | Tutorial video                   | YouTube playlist link                     |

During production build, `environment.ts` is replaced with `environment.prod.ts` via Angular's `fileReplacements` in `angular.json`.

---

## Deployment

The project is deployed to **GitHub Pages** from the `docs/` folder in this repository.

### One-Time Setup

1. **Create a GitHub repository** named `ro-calculator` under your account.

2. **Push your code:**
   ```bash
   git remote add origin https://github.com/valkyrie2/ro-calculator.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to **Settings → Pages** in your repository.
   - Under **Source**, select **Deploy from a branch**.
   - Set branch to `main` and folder to `/docs`.
   - Click **Save**.

### Deploy Steps

1. **Build for production:**
   ```bash
   npm run predeploy
   ```
   This builds the Angular app with output hashing and places it in the `docs/` folder with `--base-href /ro-calculator/`.

2. **Copy index.html for SPA routing:**
   ```bash
   npm run deploy
   ```
   Copies `index.html` to `404.html` so that GitHub Pages handles client-side routing correctly.

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "deploy"
   git push
   ```

Or use the one-click script on Windows:

```bash
deploy.bat
```

After pushing, your site will be live at **https://valkyrie2.github.io/ro-calculator/#/**.

> **Note:** The first deployment may take a few minutes for GitHub Pages to activate.

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

## Version History

| Version | Highlights                                                                 |
|---------|---------------------------------------------------------------------------|
| 1.0.4   | Ranger, Sura, Sorcerer skill bonuses; new items; 4th slot garment costume |
| 1.0.3   | Weapon compare fix; new items & monsters                                  |
| 1.0.2   | EDP calculation fix; Rolling Cutter → Melee damage                        |
| 1.0.1   | Item bonus fix; Shadow monster calc fix; Racing cap & Enchants            |
| 1.0.0   | Initial release: 10+ job support, presets, item compare, ESLint           |

See [CHANGELOG.md](CHANGELOG.md) for full details.
