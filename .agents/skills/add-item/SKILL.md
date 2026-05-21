---
name: add-item
description: Add a new equipment, card, shadow gear, or accessory to the RO Calculator from raw item data (Divine Pride JSON, in-game description, or user-supplied JSON). Use when the user asks to "add item", "insert item", "new equipment/card/shadow", paste item JSON, or wants an item ID registered into `src/assets/demo/data/item.json`.
---

# Add Item to RO Calculator

End-to-end workflow for adding a new item to the calculator. Follow the steps in order. Skip steps that genuinely do not apply (e.g., no enchants), but never skip validation.

## Inputs the user usually provides

- Raw Divine Pride JSON, or the in-game `description` text
- Item ID (numeric) and slot/position
- Set/combo partners, refine breakpoints, level conditions

If any of these are missing, infer from the source text. Do NOT invent bonus keys or condition syntax — every script entry must use existing patterns from `src/assets/demo/data/item.json`.

---

## 1. Gather context first

Before editing, confirm:

1. **Does the item already exist?**
   ```
   grep_search isRegexp:false query:"\"{itemId}\"" includePattern:src/assets/demo/data/item.json
   ```
   If yes — ask whether to update or skip.
2. **Find the insertion point.** Items are roughly grouped by numeric ID. Use `grep_search` for a nearby ID range to pick a stable neighbour.
3. **Find a sibling item with similar mechanics** (same `itemSubTypeId`, similar bonus pattern). Copy its `script` shape rather than guessing.
4. **Check bonus key support** in:
   - [src/app/utils/create-raw-total-bonus.ts](src/app/utils/create-raw-total-bonus.ts) — registered keys
   - [src/app/models/equipment-summary.model.ts](src/app/models/equipment-summary.model.ts) — typed keys
   - [src/app/api-services/valid-bonuses.ts](src/app/api-services/valid-bonuses.ts) — allowed classes for `USED[...]`
     If a key the source description needs is not present, FLAG it to the user before making it up.

---

## 2. Item JSON shape

`src/assets/demo/data/item.json` is a flat object keyed by stringified item ID.

```json
"1234567": {
  "id": 1234567,
  "aegisName": "Aegis_Name",
  "name": "Display Name [1]",
  "unidName": "Unidentified Name",
  "resName": "Sprite_Name",
  "description": "<Thai/original text, preserve \\n line breaks and ^RRGGBB color tags>",
  "slots": 1,
  "itemTypeId": 2,
  "itemSubTypeId": 511,
  "itemLevel": null,
  "attack": null,
  "defense": 0,
  "weight": 10,
  "requiredLevel": 100,
  "location": null,
  "compositionPos": null,
  "usableClass": ["all"],
  "script": { ... }
}
```

### `itemTypeId`

- `2` = Armor / Garment / Accessory / Shoes / Headgear
- `5` = Weapon
- `6` = Card
- `10` = Shadow / Costume / Special

### `itemSubTypeId` (common)

- `510` = Accessory (Right)
- `511` = Accessory (Left)
- `517` = Accessory (generic, no L/R)
- `525` ShadowWeapon · `526` ShadowArmor · `527` ShadowShield · `528` ShadowBoot · `529` ShadowEarring · `530` ShadowPendant

### `usableClass`

Use `ClassName` values from [src/app/jobs/\_class-name.ts](src/app/jobs/_class-name.ts), e.g. `["all"]`, `["Only 3rd Cls"]`, `["4th"]`, `["RuneKnight"]`, `["Mage","Wizard"]`.

### `description`

Copy verbatim from the source (Thai/original). Preserve `\n`, `^RRGGBB...^000000` color tags, and the final `ประเภท / น้ำหนัก / เลเวลที่ต้องการ / อาชีพที่ใส่ได้` footer.

---

## 3. Script bonus syntax

`script` is `Record<string, string[]>`. Each array element is an independent bonus line with optional condition prefixes; multiple conditions chain by concatenation.

### Operators

- `===N` → fixed value `N` (when condition passes)
- `---N` → stepped multiplier; floor(condition value / divisor) × N. `----N` = negative stepped.
- Plain `N` (no operator) → unconditional value `N`

### Common condition prefixes (chain in order shown when combined)

| Prefix                                            | Meaning                            | Example                                             |
| ------------------------------------------------- | ---------------------------------- | --------------------------------------------------- |
| `TIME[YYYY-MM-DD]`                                | Bonus expires after this date      | `"TIME[2026-07-15]20"`                              |
| `LEVEL[min-max]` or `LEVEL[min]`                  | Base level range                   | `"LEVEL[200-260]===66"`                             |
| `level:N`                                         | Stepped by level / N               | `"level:10---2"` (floor(lv/10)\*2)                  |
| `level:N(offset)`                                 | Stepped from offset                | `"level:10(151)----2"` (penalty per 10 lv past 150) |
| `REFINE[N]` or `REFINE[part==N]`                  | Refine ≥ N                         | `"REFINE[headUpper==11]===20"`                      |
| `REFINE_NAME[Item==N]`                            | Refine of named item ≥ N           | `"REFINE_NAME[Falken Shooter==3]---15"`             |
| `GRADE[part==C]`                                  | Grade ≥ given letter               | `"GRADE[weapon==C]===5"`                            |
| `EQUIP[A]`, `EQUIP[A&&B]`, `EQUIP[A\|\|B]`        | Item equipped (AND/OR)             | `"EQUIP[Thanos Bow-AD]===10"`                       |
| `LEARN_SKILL[Name==Lv]`                           | Skill learned ≥ Lv                 | `"LEARN_SKILL[Full Throttle==5]===10"`              |
| `LEARN_SKILL[Name==1]---N`                        | Per learned level × N              | `"LEARN_SKILL[Full Throttle==1]---2"`               |
| `ACTIVE_SKILL[Name]`                              | Skill currently active/buffed      | `"ACTIVE_SKILL[Full Throttle]===15"`                |
| `USED[Job1\|\|Job2]`                              | Class is one of these              | `"USED[Swordman\|\|Merchant\|\|Thief]===8"`         |
| `POS[accLeft]`                                    | Equipped in this slot              | `"POS[accRight]50"`                                 |
| `ITEM_LV[me==2]`                                  | Item level                         | `"ITEM_LV[me==2]===8"`                              |
| `SUM[stat==N]`                                    | Total stat ≥ N                     | `"SUM[agi==110]===7"`                               |
| `chance__<attr>` / `cd__<Skill>` / `acd__<Skill>` | Chance-based or cooldown reduction | `"cd__Adoramus": ["1---0.5"]`                       |

Prefixes stack: `"EQUIP[A]REFINE[shadowWeapon,shadowShield==1]---1"` means "Item A equipped AND combined refine ≥ 1".

### Time-limited bonuses

Wrap each entry that should expire with `TIME[YYYY-MM-DD]` (use Gregorian, even if changelog uses พ.ศ. dates). Bonuses without `TIME[...]` remain permanent.

```json
"atk": ["TIME[2026-07-15]20"],
"p_race_all": ["TIME[2026-07-15]EQUIP[Other Item]10"]
```

### Set bonuses

Place `EQUIP[A&&B]===value` lines on **one** side only (e.g., the pendant). The calculator's `isAreadyCalcCombo` already prevents double-counting same-id/attr/line, but writing once is clearer and avoids confusion.

---

## 4. Bonus key cheat sheet

Always read [src/app/utils/create-raw-total-bonus.ts](src/app/utils/create-raw-total-bonus.ts) to confirm a key exists. Frequently used:

| Key                                                  | Meaning                                            |
| ---------------------------------------------------- | -------------------------------------------------- |
| `atk`, `matk`, `atkPercent`, `matkPercent`           | ATK / MATK flat & %                                |
| `pAtk`, `sMatk`                                      | Trait P.ATK / S.MATK                               |
| `cri`, `criDmg`, `aspd`, `aspdPercent`               | Crit & ASPD                                        |
| `vct`, `fct`, `acd`                                  | Cast and after-cast delay                          |
| `hpPercent`, `spPercent`, `mhpPercent`               | HP/SP                                              |
| `p_class_all`, `m_class_all`                         | Phys/Magic dmg vs all class                        |
| `p_pene_class_all`, `m_pene_class_all`               | Phys/Magic class penetration                       |
| `p_class_normal`, `p_class_boss`, `p_class_<class>`  | Class-specific dmg                                 |
| `p_race_all`, `m_race_all`, `p_race_<race>`          | Race dmg                                           |
| `p_pene_race_all`, `m_pene_race_all`                 | Race penetration                                   |
| `p_size_all`, `m_size_all`, `p_size_<size>`          | Size dmg                                           |
| `p_element_all`, `m_element_all`, `m_my_element_all` | Element dmg                                        |
| `melee`, `range`                                     | Phys melee / ranged dmg                            |
| `expBonus`                                           | EXP gain %                                         |
| `<SkillName>`                                        | Skill-specific dmg, key is the skill name verbatim |
| `cd__<SkillName>`, `acd__<SkillName>`                | Cooldown / after-cast reduction for a skill        |
| `chance__<attr>`                                     | Probabilistic bonus accumulator                    |
| `x_race_<race>_atk`                                  | Mastery-style flat ATK vs race                     |

Skill names must match the constants in [src/app/constants/skill-name.ts](src/app/constants/skill-name.ts) **exactly** — including intentional typos like `Fatal Manace`, `Lightening Bolt`. If a needed skill is missing, see step 6.

---

## 5. Item image

Save the icon to `src/assets/demo/images/items/{itemId}.png`. Divine Pride mirror:

```powershell
Invoke-WebRequest -Uri "https://www.divine-pride.net/img/items/item/thROG/{id}" `
  -OutFile "src\assets\demo\images\items\{id}.png"
```

Verify file size is non-zero. The build step copies assets to `docs/` automatically — do NOT edit `docs/` by hand.

---

## 6. Skill / class registration (only when needed)

If the bonus references a skill not yet in [src/app/constants/skill-name.ts](src/app/constants/skill-name.ts):

1. Add the exact skill name string to the `ACTIVE_PASSIVE_SKILL_NAMES` array (preserve original spelling).
2. If the skill should be selectable as a learned/active toggle for a job, add a `PassiveSkillModel` / `ActiveSkillModel` entry to that job's `_passiveSkillList` / `_activeSkillList` in [src/app/jobs/](src/app/jobs/).
3. For skills shared across many jobs (e.g., 3rd-class commons like `Full Throttle`), register them centrally in [src/app/jobs/\_character-base.abstract.ts](src/app/jobs/_character-base.abstract.ts) and gate by `this.classNames.includes(ClassName.Only_3rd)` (or the relevant tier).

If a `usableClass` entry references a `ClassName` not yet exported, add it to [src/app/jobs/\_class-name.ts](src/app/jobs/_class-name.ts) AND ensure the value matches the string used in `usableClass`.

---

## 7. Editing `item.json` safely

The file is very large (>180k lines). Tools to prefer/avoid:

- **PREFER**: targeted PowerShell one-liners that match a uniquely-identifying multi-line block and use `Set-Content -Encoding UTF8`. Always include neighbouring lines (`"id"`, `"name"`, surrounding `script` keys) in the search string so the replacement is unique.
- **AVOID**: generic single-line replacements such as `"atk": ["20"]` — they will silently match many unrelated items. (This has happened; always audit.)
- **AVOID** `apply_patch` on `item.json` — it has failed with stack overflows on this file. Use it freely on the smaller TypeScript / Markdown files.

After ANY scripted edit, audit:

```powershell
git diff -- src/assets/demo/data/item.json |
  Select-String -Pattern '^@@|^[-+]' | Select-Object -First 200
```

Confirm the diff is scoped to the intended item ID block(s).

---

## 8. Validate

Run these every time before reporting done:

```powershell
python -c "import json; json.load(open('src/assets/demo/data/item.json', encoding='utf-8-sig')); print('JSON VALID')"
```

If TypeScript files changed (skill list, class name, job file):

```powershell
npm run build
```

If only `item.json` and images changed, `npm run build` is still a good sanity check but optional.

---

## 9. Changelog & topbar

Add a short entry to:

- [CHANGELOG.md](CHANGELOG.md) — under a new or existing `## Extra vX.Y (DD-MM-YYYY)` section (Buddhist year, e.g. `2569`). English bullets.
- [src/app/layout/app.topbar.component.ts](src/app/layout/app.topbar.component.ts) — prepend an entry to the `updates` array. Thai bullets. Keep version + date in sync with `CHANGELOG.md`.

Both files are small — use `apply_patch` / `multi_replace_string_in_file`.

---

## 10. Final report

Tell the user:

- Item IDs added (with English name)
- Whether icons were downloaded
- Any skill / class / bonus-key additions
- Validation results (`JSON VALID`, `npm run build` status)
- Any conditions you could not encode and why

---

## Anti-patterns (do NOT do these)

- Inventing a bonus key that is not in `create-raw-total-bonus.ts`.
- Renaming a skill to "fix" a typo — preserve the in-game spelling.
- Editing `docs/` directly — it is regenerated by the build.
- Replacing generic JSON snippets like `"atk": ["20"]` globally.
- Adding the same `EQUIP[A&&B]` set bonus line to both A and B.
- Changing `--base-href` or removing `src/CNAME` — both are required for the custom domain deploy.
- Skipping `python -c "import json..."` validation.
