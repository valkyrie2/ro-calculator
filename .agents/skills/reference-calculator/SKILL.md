---
name: reference-calculator
description: Reference for the RO Calculator damage pipeline, equipment/card system, item scripts, and custom bonus system. Use this skill when working with code in `src/app/layout/pages/ro-calculator/`, equipment bonuses, item scripts, damage calculation, or the custom bonus feature.
---

# RO Calculator — Calculator, Equipment & Card System

## 1. Architecture Overview

```
User Input (equipment, stats, skills, monster)
  → RoCalculatorComponent.calculate()
    → prepare(calculator)
      → Calculator fluent chain
        → loadItemFromModel(model)
        → prepareAllItemBonus()     ← item/card/enchant bonus extraction
        → calcAllAtk()              ← DamageCalculator
        → calculateAllDamages()     ← final damage output
    → getTotalSummary()
    → Display (PrimeNG)
```

### Key Files

| File | Purpose |
|------|---------|
| `ro-calculator.component.ts` | Orchestrator: model, items, prepare(), calculate() |
| `calculator.ts` | Fluent calculation engine: bonus accumulation, item loading |
| `damage-calculator.ts` | ATK/MATK → final damage formulas |
| `equipment/equipment.component.ts` | Per-slot equipment UI (item, cards, enchants, options) |
| `custom-bonus/custom-bonus.component.ts` | Custom stat/skill/item/card modifiers |

---

## 2. Calculator Class (`calculator.ts`)

### Fluent API

All methods return `this` for chaining:

```typescript
calculator
  .setClass(characterBase)
  .setMonster(monsterModel)
  .loadItemFromModel(model)
  .setEquipAtkSkillAtk(equipBonusMap)
  .setBuffBonus({ masteryAtk, equipAtk })
  .setMasterySkillAtk(skillBonusMap)
  .setConsumables(itemScriptArray)
  .setAspdPotion(value)
  .setExtraOptions(bonusRowArray)        // ← custom bonuses injected here
  .setUsedSkillNames(activeSkillNamesSet)
  .setLearnedSkills(skillNameToLevelMap)
  .setOffensiveSkill(skillValue)         // "SkillName==level"
  .prepareAllItemBonus()                 // ← MAIN: extracts all bonuses
  .calcAllAtk()
  .setSelectedChances(selectedItemNames)
  .calcAllDefs()
  .calculateHpSp({ isUseHpL })
  .calculateAllDamages(selectedAtkSkill)
```

### Key Internal State

| Field | Type | Purpose |
|-------|------|---------|
| `equipItem` | `Map<ItemTypeEnum, ItemModel>` | All equipped items (main + cards + enchants) |
| `totalEquipStatus` | `EquipmentSummaryModel` | Aggregated bonuses from all gear |
| `equipStatus` | `Record<ItemTypeEnum, EquipmentSummaryModel>` | Per-item bonus breakdown |
| `extraOptions` | `Record<string, number>[]` | Custom/extra bonus rows |
| `weaponData` / `leftWeaponData` | `Weapon` | Parsed weapon info |
| `_chanceList` | `ChanceModel[]` | RNG-based item effects |
| `finalMultipliers` | `number[]` | Final damage % multipliers |
| `items` | `Record<number, ItemModel>` | Master item database (set via `setMasterItems`) |

### Output Methods

| Method | Returns |
|--------|---------|
| `getTotalSummary()` | All aggregated bonuses + damage results |
| `getItemSummary()` | Per-item bonus display |
| `getModelSummary()` | Character model data for display |
| `getBreakdownData()` | Damage breakdown for calc-breakdown component |

---

## 3. Item Model (`item.model.ts`)

```typescript
interface ItemModel {
  id: number;
  aegisName: string;          // internal DB name
  name: string;               // display name
  itemTypeId: number;         // category
  itemSubTypeId: number;      // weapon subtype (dagger, bow, etc.)
  itemLevel: number;
  attack: number;             // base ATK
  defense: number;            // base DEF
  propertyAtk?: ElementType;  // weapon element
  weight: number;
  slots: number;              // card slots (0–4)
  isRefinable?: boolean;
  canGrade?: boolean;         // A/B/C/D grade support
  cardPrefix?: string;        // card display prefix
  script: Record<string, any[]>; // ← bonus scripts (the core data)
}
```

### Script Format

Each key is a bonus attribute name; each value is an array of condition strings:

```json
{
  "atk": ["20", "10===50", "REFINE[weapon==2]---5"],
  "str": ["5"],
  "p_race_demon": ["15"],
  "chance__criDmg": ["20"]
}
```

- **Index 0**: Usually the base bonus (always applied if valid)
- **Index 1+**: Conditional bonuses
- **`chance__` prefix**: Creates a ChanceModel (RNG toggle)

---

## 4. Item Script Condition System

### Constant Bonuses (`===`)

```
REFINE[10]===50              # if refine >= 10, add 50
str:80===20                  # if STR >= 80, add 20
level:125===10               # if level >= 125, add 10
WEAPON_TYPE[bow]===15        # if using bow, add 15
EQUIP[Item1&&Item2]===30     # if both items equipped, add 30
GRADE[weapon==A]===25        # if weapon grade >= A, add 25
ACTIVE_SKILL[Skill Name]===10  # if actively using that skill, add 10
LEVEL[1-129]===5             # if level in range 1–129
```

### Stepped Bonuses (`---`)

```
10---5                       # floor(refine / 10) * 5
dex:10---2                   # floor(dex / 10) * 2
level:1(125)---1             # floor(level / 1) * 1, capped at level 125
SUM[str,luk==80]---6         # floor((str + luk) / 80) * 6
LEARN_SKILL[Skill==5]---1    # floor(skillLevel / 5) * 1
REFINE[boot,armor==1]---3    # floor(totalRefine / 1) * 3
GVALUE[weapon==2]---10       # floor(gradeValue / 2) * 10 (A=4,B=3,C=2,D=1)
```

### Processing Flow

```
FOR EACH attribute IN item.script:
  FOR EACH line IN script[attribute]:
    IF validateCondition(line) passes:
      IF "===" in line → calcConstantBonus(refine, line)
      ELSE IF "---" in line → calcStepBonus(refine, line)
      ELSE → Number(line)
    accumulate into total
  IF attribute starts with "chance__" → create ChanceModel
  ELSE → add to EquipmentSummaryModel
```

---

## 5. Equipment Slot System

### ItemTypeEnum (Main Equipment Slots)

| Slot | Enum Key | Cards | Enchants |
|------|----------|-------|----------|
| Weapon | `weapon` | `weaponCard1–4` | `weaponEnchant0–3` |
| Left Weapon | `leftWeapon` | `leftWeaponCard1–4` | `leftWeaponEnchant0–3` |
| Shield | `shield` | `shieldCard` | `shieldEnchant1–3` |
| Head Upper | `headUpper` | `headUpperCard` | `headUpperEnchant1–3` |
| Head Middle | `headMiddle` | `headMiddleCard` | `headMiddleEnchant1–3` |
| Head Lower | `headLower` | *(none)* | `headLowerEnchant1–3` |
| Armor | `armor` | `armorCard` | `armorEnchant1–3` |
| Garment | `garment` | `garmentCard` | `garmentEnchant1–3` |
| Boots | `boot` | `bootCard` | `bootEnchant1–3` |
| Acc Left | `accLeft` | `accLeftCard` | `accLeftEnchant1–3` |
| Acc Right | `accRight` | `accRightCard` | `accRightEnchant1–3` |
| Pet | `pet` | — | — |
| Shadow * 6 | `shadow{Weapon,Armor,Shield,Boot,Earring,Pendant}` | — | `shadowXEnchant1–3` |
| Costume * 4 | `costume{Upper,Middle,Lower,Garment}` | — | — |

### MainItemWithRelations

Maps each main item type to its related card/enchant item types. Used by `loadItemFromModel()` to load all related items:

```typescript
MainItemWithRelations[ItemTypeEnum.weapon] = [
  weaponCard1, weaponCard2, weaponCard3, weaponCard4,
  weaponEnchant0, weaponEnchant1, weaponEnchant2, weaponEnchant3,
]
// etc. for every main equipment item
```

### Model Fields Per Slot

Each slot has: `{slot}`, `{slot}Refine`, `{slot}Grade`, plus its relations.

---

## 6. Card System

### CardPosition Enum

```typescript
enum CardPosition {
  Weapon  = 0,
  Head    = 769,
  Shield  = 32,
  Armor   = 16,
  Garment = 4,
  Boot    = 64,
  Acc     = 136,
  AccL    = 128,
  AccR    = 8,
  All     = 1021,
}
```

### Card List Building

In `RoCalculatorComponent.buildItemLists()`, items with `itemTypeId === CARD` are sorted by `compositionPos`:

| compositionPos | Card List(s) |
|----------------|-------------|
| `Weapon (0)` | `weaponCardList` |
| `Head (769)` | `headCardList` |
| `Shield (32)` | `shieldCardList` |
| `Armor (16)` | `armorCardList` |
| `Garment (4)` | `garmentCardList` |
| `Boot (64)` | `bootCardList` |
| `Acc/AccL/AccR` | `accCardList`, `accLeftCardList`, `accRightCardList` |
| `All (1021)` | Added to all card lists |

### Card Processing

Cards are stored as item IDs in the model (e.g., `model.weaponCard1 = 4125`). During `loadItemFromModel()`, they are loaded via `setItem()` into `equipItem`. During `prepareAllItemBonus()`, their scripts are processed identically to regular equipment via `calcItemStatus()`.

---

## 7. Equipment Component (`equipment.component.ts`)

### Inputs

```typescript
@Input() itemType: ItemTypeEnum   // which slot
@Input() itemList: DropdownModel[]  // available items
@Input() cardList: DropdownModel[]  // cards for this position
@Input() refineList: DropdownModel[]
@Input() mapEnchant: Map<string, ItemModel>
@Input() itemId, itemRefine, itemGrade
@Input() card1Id, card2Id, card3Id, card4Id
@Input() enchant1Id – enchant4Id
@Input() option1Value – option3Value
```

### Key Behavior

- `totalCardSlots` is derived from `item.slots`
- Card dropdowns are hidden when `totalCardSlots < N`
- Changing the item clears incompatible cards/enchants
- Enchant lists are loaded via `getEnchants(aegisName)`
- Emits `selectItemChange` → triggers `updateItemEvent` → `calculate()`

---

## 8. EquipmentSummaryModel (~120 fields)

| Category | Key Fields |
|----------|-----------|
| ATK / MATK | `atk`, `atkPercent`, `matk`, `matkPercent`, `flatDmg`, `pAtk`, `sMatk` |
| Stats | `str`, `agi`, `vit`, `int`, `dex`, `luk`, `allStatus` |
| Traits | `pow`, `sta`, `wis`, `spl`, `con`, `crt`, `cRate`, `hplus`, `allTrait` |
| Speed | `aspd`, `aspdPercent`, `hit`, `flee`, `cri`, `criDmg`, `hitDmg` |
| Cast | `vct`, `fct`, `acd` |
| Range | `melee`, `range` |
| Defense | `def`, `defPercent`, `mdef`, `mdefPercent`, `softDef`, `softMdef`, `res`, `mres` |
| P. Damage % | `p_race_*`, `p_element_*`, `p_size_*`, `p_class_*`, `p_final` |
| M. Damage % | `m_race_*`, `m_element_*`, `m_size_*`, `m_class_*`, `m_final` |
| Penetration | `p_pene_race_*`, `p_pene_class_*`, `m_pene_race_*`, `m_pene_class_*`, `pene_res`, `pene_mres` |
| HP/SP | `hp`, `hpPercent`, `sp`, `spPercent` |

All fields default to `0`. Custom bonuses and item scripts map directly to these field names.

---

## 9. Custom Bonus System (`custom-bonus.component.ts`)

### Interfaces

```typescript
interface CustomBonusRow {
  attr: string;   // matches EquipmentSummaryModel field names
  value: number;
}

interface CustomBonusOutput {
  rows: CustomBonusRow[];
  itemScript: Record<string, number[]> | null;
  isCompare: boolean;
  replaceSlot: string | null;   // equipment slot to replace
  cardId: number | null;        // card to apply to custom item
}
```

### Bonus Groups (dropdown categories)

Offensive, Skill Damage (OFFENSIVE_SKILL_NAMES), Stats, Trait Stats, Speed/Accuracy, Defense, HP/SP, P.Size%, P.Race%, P.Element%, P.Class%, P.Final%, M.Size%, M.Race%, M.Element%, M.Class%, M.Final%, P.Penetration%, M.Penetration%, RES/MRES Penetration%.

### Slot → Card List Mapping

```typescript
SLOT_CARD_LIST_MAP = {
  weapon: 'weaponCardList',  leftWeapon: 'weaponCardList',
  shield: 'shieldCardList',  headUpper: 'headCardList',
  headMiddle: 'headCardList', armor: 'armorCardList',
  garment: 'garmentCardList', boot: 'bootCardList',
  accLeft: 'accLeftCardList', accRight: 'accRightCardList',
}
```

### How Custom Bonuses Flow Into Calculation

```
CustomBonusComponent.emitChange()
  → RoCalculatorComponent.onCustomBonusChange(output)
    → stores: customBonuses, customItemScript, isCustomCompare, customReplaceSlot, customCardId
    → updateItemEvent.next()
      → calculate()
        → prepare() builds customExtras from:
           1. bonusRows → [{ attr: value }, ...]
           2. itemScript → { attr: [values] } → summed
           3. cardId → items[cardId].script → summed per attr
        → all pushed into setExtraOptions([...optionScripts, ...customExtras])
```

---

## 10. Comparison System

### Equipment Compare (original)

- `model2`: Second set of equipment selections
- `compareItemNames`: Which slots are being compared
- `calcCompare()`: Calls `prepare(calculator2, model2)` → `totalSummary2`
- Uses `prepare()`'s `compareModel` parameter to merge model2 into model

### Custom Compare (custom bonus)

- When `isCustomCompare` is enabled in calculate():
  - **Baseline** (totalSummary): `prepare(calculator, emptyCustom)` — current gear, no custom bonuses
  - **With Custom** (totalSummary2): `prepare(calculator2, baseModel=buildSlotClearModel(slot))` — clears selected slot, applies custom bonuses + card
- `buildSlotClearModel(slotType)`: Copies model, nulls the slot's item/refine/grade and all related cards/enchants
- Both summaries feed into battle-dmg-summary for side-by-side diff display

---

## 11. Damage Calculator (`damage-calculator.ts`)

### Input

```typescript
setArgs({
  equipStatus, totalEquipStatus, model,
  equipAtkSkillBonus, buffMasteryAtkBonus, masteryAtkSkillBonus,
  finalMultipliers, finalPhyMultipliers, finalMagicMultipliers,
  _class, monster, weaponData, leftWeaponData, aspdPotion
})
```

### Output (DamageSummaryModel)

```
BasicDamageSummary: basicMinDamage, basicMaxDamage, criMinDamage, criMaxDamage,
                    basicCriRate, basicDps, accuracy, sizePenalty, propertyMultiplier
SkillDamageSummary: skillMinDamage, skillMaxDamage, skillDps, skillHit, skillCriRate
SkillAspdModel:     cd, vct, fct, acd (raw + reduced), castPeriod, hitPeriod, totalHitPerSec
```

### Calculation Flow

```
calculateAllDamages()
  → calculateBasicDamage()   → min/max/crit with element/race/class multipliers
  → calculateSkillDamage()   → skill formula × modifiers
  → calculateAspd()          → class formula with AGI/DEX + equipment
  → calculateDps()           → (avgDmg × hitsPerSec) × accuracy
```

---

## 12. Data Flow Summary

```
Backend API
  → roService.getItems() → items: Record<number, ItemModel>
  → roService.getMonsters() → monsterDataMap

User selects equipment in dropdown
  → equipment.component emits selectItemChange
  → ro-calculator.component model[slot] = itemId
  → updateItemEvent.next() [debounce 250ms]
  → calculate()

calculate()
  → prepare(calculator)
    → loadItemFromModel(model)        // loads all items + cards + enchants
    → setExtraOptions([...])          // custom bonuses
    → prepareAllItemBonus()           // extract all script bonuses
      → calcItemStatus() per item     // apply conditions (===, ---)
    → calcAllAtk()                    // DamageCalculator
    → calculateAllDamages()           // final output
  → getTotalSummary() → display
```
