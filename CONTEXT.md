# RO Calculator — Domain Glossary

## Glossary

### Calculator

The pure-logic class (`src/app/layout/pages/ro-calculator/calculator.ts`) that aggregates character stats, equipment bonuses, and skill data into a `DamageSummaryModel`. No Angular DI — instantiated directly.

### Damage Pipeline

`Calculator` → `calc-dmg-dps.ts` → `DamageSummaryModel`. Accepts `InfoForClass` (aggregated input) and produces min/max/crit/DPS values per skill.

### Preset

A saved configuration of character stats + equipment + skill selections. Persisted in Supabase (`ro_presets` table). Can be private or shared (published).

### Item Script

The `script` field on an item JSON entry — a `Record<string, string[]>` of bonus keys to condition-prefixed value strings. Evaluated by `create-raw-total-bonus.ts`.

### Bonus Key

A string key in an Item Script (e.g. `atk`, `p_race_all`, `EQUIP[...]`). Must exist in `create-raw-total-bonus.ts` and `equipment-summary.model.ts` to be recognized.

### Item Index

A generated lookup file (`src/assets/demo/data/item-index.json`) mapping `itemSubTypeId → [itemIds]` and `bonusKey → [itemIds]`. Built from `item.json` — allows agents to find sibling items without grepping 179k lines.

### Snapshot Test

A golden-file regression test: run the Calculator once, commit the output as a `.snap.json` file, assert on every subsequent run that output matches. Stored under `src/app/utils/__snapshots__/` — one file per job scenario.

---

## Decisions

### Testing strategy (2026-05-21)

- **Scope:** Regression guard + refactor safety for Signals/Standalone migration
- **Data source:** Real `item.json` / `monster.json` (not mocks) — catches regressions from item data changes
- **Assertion style:** Golden-file snapshots (`.snap.json` committed to repo)
- **Priority jobs:** Most-used first — RuneKnight, Ranger, ArchBishop
- **Snapshot location:** `src/app/utils/__snapshots__/*.snap.json` (one file per job scenario, Jest-style convention)

### Signals/Standalone migration (2026-05-21)

- **Decision:** Deferred — risk not worth it vs pending features
- **Revisit when:** Feature backlog clears, or refactor pressure from test failures

### Add-item workflow (2026-05-21)

- **Pain point:** Slow — finding sibling items + parsing Thai description manually
- **Solution:** Improve `add-item` SKILL.md (not a CLI tool)
- **Sibling lookup:** Generate `item-index.json` (itemSubTypeId → itemIds, bonusKey → itemIds) so agent skips grepping 179k-line file
- **Description parsing:** Thai text is unstructured — AI agent remains the parser; SKILL.md needs better pattern templates
