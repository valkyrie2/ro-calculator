# Angular Upgrade Plan

**Current:** Angular 16.1.0 + PrimeNG 16.0.2 + RxJS 7.8 + Zone.js 0.13 + TypeScript 5.1
**Target (eventual):** Angular 19 LTS
**Status:** Angular 16 went EOL in **November 2024**. No further security patches.

---

## Staged migration (recommended)

Each stage is a separate branch + PR. Run the app after each step before proceeding.

### Stage 1 — Angular 16 → 17

```pwsh
npx ng update @angular/core@17 @angular/cli@17
npx ng update @angular-eslint/schematics@17
```

- Peer-bump: `zone.js` → `~0.14.0`, `typescript` → `~5.2.x`.
- **PrimeNG 16 → 17** is a hard dependency here: PrimeNG 17 drops several themes and restructures CSS layers. Budget time to re-verify the Vela Green theme.
- Build-system: Angular 17 defaults to the **esbuild application builder**. `angular.json` already uses esbuild, so no forced migration, but review `browser` vs `application` target.
- Check `@auth0/angular-jwt` / `@fullcalendar/angular` / `chart.js` for Angular 17 compatibility (usually fine, but pin first).
- Expect template breakage only if using deprecated control-flow APIs.

**Risk:** Medium. PrimeNG is the biggest unknown.

### Stage 2 — Angular 17 → 18

```pwsh
npx ng update @angular/core@18 @angular/cli@18
```

- Peer-bump: `zone.js` → `~0.14.x`, `typescript` → `~5.4.x`, `rxjs` → `~7.8.x` (unchanged).
- Angular 18 stabilizes the **new control flow** (`@if`, `@for`, `@switch`). Optional migration via `ng g @angular/core:control-flow`.
- Default binding for `bindComplete`/`contentChild` in signals (opt-in).

**Risk:** Low — mostly a version bump.

### Stage 3 — Angular 18 → 19

```pwsh
npx ng update @angular/core@19 @angular/cli@19
```

- `standalone: true` becomes the **default** for newly generated components. Existing NgModule code keeps working, but deprecation warnings increase.
- `typescript` → `~5.5.x`.
- `zone.js` still supported but zoneless change detection is now stable.

**Risk:** Low.

---

## Orthogonal modernizations (do *after* the version bumps, or in parallel slices)

These are optional but recommended once on Angular 19:

1. **Standalone components** — run `ng g @angular/core:standalone`. This is the largest code change but the CLI does 95% of it. NgModules remain during transition.
2. **Signals** — replace `ReplaySubject`/`BehaviorSubject` in the calculator page with `signal` / `computed`. Gradual, file by file. Keep RxJS for HTTP and async stream pipelines.
3. **New control flow** — `ng g @angular/core:control-flow` converts `*ngIf`/`*ngFor`/`*ngSwitch` across all templates. Safe and mechanical.
4. **Zoneless change detection** — defer until signals adoption is substantial.

---

## PrimeNG escape-hatch (only if Stage 1 blocks)

If PrimeNG 17+ migration cost is prohibitive, alternatives (free, MIT):

| Library | Pros | Cons |
|---|---|---|
| **Angular Material** (Google) | Actively maintained, official, Material 3 theming | Very different look from PrimeNG; many components missing (data tables less rich) |
| **Taiga UI** | Modern, signal-native in v4, high DX | Smaller ecosystem, less RO-game-friendly theming |
| **NG-Zorro** | Ant Design aesthetics, complete widget set | Different design language, some overhead |
| **Spartan UI** (shadcn-style) | Headless, works with Tailwind, full customization | Young project, manual wiring |

**Recommendation:** Stick with PrimeNG and absorb the 16→17 migration cost. The calculator uses ~15 PrimeNG components (Dialog, Dropdown, Table, Slider, InputNumber, etc.) which all have stable v17+ equivalents.

---

## Pre-flight checks before starting

1. **Tests exist** — today we have 3 spec files (LoggerService, OFFENSIVE_SKILL_NAMES, Calculator smoke). Add a handful more covering `RoService`, `PresetService`, and the damage-calculator before touching Angular version, so regressions surface.
2. **Lockfile clean** — commit `package-lock.json` before each stage.
3. **Browser lockstep** — Chromium headless is all we test against; Angular 17 dropped some older browser support (IE gone long ago, but re-check target in `angular.json` `defaultConfiguration`).
4. **Deploy path** — `deploy.ps1` / `deploy.bat` currently copies `docs/` to GitHub Pages. No change expected; but the esbuild application builder outputs a different folder structure (`browser/` sub-folder). Inspect `predeploy` script after Stage 1.

---

## Out of scope

- Framework swap (React/Vue/Svelte) — not recommended, no ROI given the Angular investment here.
- Nx / monorepo split — only if the host app grows.
- SSR — the app is a pure-client calculator; no SEO benefit.
