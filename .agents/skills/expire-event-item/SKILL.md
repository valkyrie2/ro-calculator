---
name: expire-event-item
description: Add, change, or remove a `TIME[YYYY-MM-DD]` expiry on bonuses of an existing item in `src/assets/demo/data/item.json`. Use when the user asks to "ใส่วันหมดอายุ", "set expiry", "expire bonus", "ทำให้บอนัสกิจกรรมหมดอายุ", "extend event", or wants to add/remove a time gate on event-only bonuses (e.g., Sessrumnir, anniversary rings, commemoration items).
---

# Expire (or un-expire) an Item's Event Bonuses

Narrow, scoped workflow for the common task: an existing item has both **permanent** and **event-only** bonuses, and only the event-only ones should expire on a given date. The risk is touching unrelated items in the huge `item.json` file — this skill enforces the scoping pattern that prevents that.

> For brand-new items, use the **add-item** skill instead.

---

## Inputs

- **Item ID** (numeric) — required
- **Expiry date** — Gregorian `YYYY-MM-DD`. If user gives พ.ศ. (e.g., 15/07/2569), convert by subtracting 543.
- **Which bonuses expire** — usually "event bonuses only". Ask if ambiguous; never assume all bonuses expire.

---

## 1. Locate the item block

```powershell
# Show line range of the target block to confirm scope
Select-String -Path "src\assets\demo\data\item.json" -Pattern '"(\d+)":\s*\{' |
  Where-Object { $_.Matches[0].Groups[1].Value -ge 490550 -and $_.Matches[0].Groups[1].Value -le 490570 } |
  Select-Object LineNumber, Line
```

Read the full block once with `read_file` so you can decide which lines should get `TIME[...]`. Identify:

- Which `script` entries are **permanent** (mention in item description as base effect) → leave alone
- Which are **event/commemoration** (mention "event", "anniversary", "ครบรอบ", or only appear in set with a "Pope Card"-style combo) → wrap with `TIME[...]`

If unsure, **ask the user** which specific keys to expire before editing.

---

## 2. The `TIME[...]` syntax

Wrap each affected entry inside its array:

```jsonc
// before
"atk": ["20"],
"p_race_all": ["EQUIP[Pope Card]===10"]

// after
"atk": ["TIME[2026-07-15]20"],
"p_race_all": ["TIME[2026-07-15]EQUIP[Pope Card]===10"]
```

Rules:

- `TIME[YYYY-MM-DD]` is a **prefix**. It stacks with other prefixes — always place it **first** in the string.
- Format is Gregorian only.
- Only affects the single array element it prefixes. Other elements in the same array stay permanent.
- Removing the prefix re-activates the bonus permanently.

---

## 3. Scoped edit (the only safe way)

`item.json` is >180k lines. Generic string replaces will silently hit dozens of unrelated items — this has happened before.

**Use a line-walker PowerShell script that enters at the item header and exits at the next item header.** Never use `.Replace()` on the whole file.

```powershell
$path  = "src\assets\demo\data\item.json"
$id    = "490557"          # target item
$next  = "490565"          # next item id in file (find via grep)
$time  = "TIME[2026-07-15]"

$lines    = Get-Content $path -Encoding UTF8
$inBlock  = $false
$changed  = 0

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\s*`"$id`"\s*:\s*\{") { $inBlock = $true;  continue }
    if ($lines[$i] -match "^\s*`"$next`"\s*:\s*\{") { $inBlock = $false; continue }
    if (-not $inBlock) { continue }

    # List ONLY the keys that should expire:
    if ($lines[$i] -match '^\s*"(atk|matk|cri|aspdPercent|vct|expBonus|p_race_all|m_race_all|p_size_all|m_size_all|p_element_all|m_element_all)"\s*:\s*\[\s*"([^"]+)"\s*\]') {
        $key = $Matches[1]; $val = $Matches[2]
        if ($val -notlike "TIME[*") {
            $lines[$i] = $lines[$i] -replace [regex]::Escape("`"$val`""), "`"$time$val`""
            $changed++
        }
    }
}

Set-Content -Path $path -Value $lines -Encoding UTF8
"Lines changed: $changed"
```

Notes:

- The `next` ID is whichever entry follows the target in the file (use `grep_search` to confirm; it is NOT always `id + 1`).
- Tailor the key list to exactly what should expire. Default to listing keys explicitly rather than wildcarding.
- For multi-element arrays (e.g., `"p_race_all": ["10", "EQUIP[X]===5"]`) the simple regex above won't match — switch to a per-element loop or hand-edit those lines with `multi_replace_string_in_file` using 3+ lines of unique context.

### Removing an expiry

Same script, but replace `TIME[YYYY-MM-DD]` with empty string. Use the exact date you applied — never blanket-strip all `TIME[...]` from a block.

### Changing an expiry date

Run the removal pass with the old date, then the apply pass with the new date. Do not do both in one regex — easy to corrupt.

---

## 4. MANDATORY audit

Before validating, look at the diff and confirm it is scoped:

```powershell
git diff -- src/assets/demo/data/item.json |
  Select-String -Pattern '^@@|^[-+]' | Select-Object -First 200
```

Checklist:

- All `@@` hunks fall inside the target item's line range.
- Each `+` line is an expected key.
- No `+`/`-` pair changed a value other than adding/removing the `TIME[...]` prefix.
- Count of `+` lines == count of `-` lines == expected key count.

If anything looks off, **revert immediately** (`git checkout -- src/assets/demo/data/item.json`) and redo with a tighter scope.

---

## 5. Validate

```powershell
python -c "import json; json.load(open('src/assets/demo/data/item.json', encoding='utf-8-sig')); print('JSON VALID')"
```

`npm run build` is optional for pure JSON edits, but recommended if the user is about to deploy.

---

## 6. Changelog & topbar

Both files get a short entry — see the **add-item** skill, section 9. Suggested wording:

- `CHANGELOG.md`: `- Set Sessrumnir Commemoration Ring [1] event bonuses to expire on 2026-07-15.`
- `app.topbar.component.ts` (Thai): `'แหวน Sessrumnir ใส่วันหมดอายุบอนัสกิจกรรม 15/07/2026'`

Match version/date between the two.

---

## 7. Final report

- Item ID + name
- Expiry date applied (Gregorian + พ.ศ. if user used พ.ศ.)
- Exact list of keys that were wrapped
- Keys deliberately left permanent (and why)
- Diff scope confirmation ("only N lines inside block {id} changed")
- `JSON VALID` result

---

## Anti-patterns

- Running `(Get-Content ...).Replace('"atk": ["20"]', '"atk": ["TIME[...]20"]')` against the whole file — will hit every item with `"atk": ["20"]`. Always scope by entry block.
- Using พ.ศ. in `TIME[...]`. Always Gregorian.
- Stripping `TIME[...]` globally to "reset" an item — you will remove expiries from other items too.
- Wrapping permanent base bonuses by accident. When in doubt, ask the user.
- Skipping the `git diff` audit. It is the only line of defence against silent over-matches.
