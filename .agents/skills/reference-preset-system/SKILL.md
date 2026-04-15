---
name: reference-preset-system
description: Reference for the RO Calculator preset system — dual-mode storage (local + cloud), CRUD operations, sync flow, sharing/tagging, and the PresetTable management dialog. Use this skill when working with preset loading, saving, syncing, the preset dropdown, PresetTableComponent, or the DPS compare feature's preset loading.
---

# RO Calculator — Preset System

## 1. Architecture Overview

```
Dual-Mode Storage
├── Local (logged-out)
│   └── localStorage['presets'] → Array<{ label, value, model: PresetModel }>
│       Model is stored inline — available immediately
│
└── Cloud (logged-in)
    └── PresetService API → RoPresetModel (server-side)
        getMyPresets()     → PresetWithTagsModel[] (NO model field — list only)
        getPreset(id)      → RoPresetModel (WITH model — single fetch)
        getEntirePresets() → EntirePresetWithTagsModel[] (WITH model — bulk fetch)

Sync: On login, local presets auto-upload via confirmSync() → bulkCreatePresets()
```

### Key Files

| File | Purpose |
|------|---------|
| `api-services/preset.service.ts` | Cloud preset API client (CRUD, share, tags) |
| `api-services/auth.service.ts` | Auth state, `loggedInEvent$` observable |
| `api-services/base-api.service.ts` | HTTP layer, JWT token management, API endpoints |
| `api-services/models/preset-model.ts` | `PresetModel` — full equipment/stat/skill data |
| `api-services/models/ro-preset-model.ts` | `RoPresetModel` — server wrapper with id, label, model |
| `api-services/models/preset-with-tags-model.ts` | List response (no model, has tags) |
| `api-services/models/entire-preset-with-tags-model.ts` | Bulk response (with model + tags) |
| `ro-calculator.component.ts` | Orchestrator: save, load, sync, dropdown |
| `preset-table/preset-table.component.ts` | Management dialog: rename, delete, share, tags, move-to-cloud |
| `dps-compare/dps-compare.component.ts` | Loads presets for side-by-side DPS comparison |
| `utils/to-upsert-preset-model.ts` | Converts model to cloud-safe format (adds skill maps) |
| `utils/vefify-sync-presets.ts` | Validates local→cloud sync results |

---

## 2. Data Models

### PresetModel — Full Equipment/Stat Snapshot

```typescript
interface PresetModel {
  // Character
  class: number;               // Class ID (matches getClassDropdownList() value)
  level: number;
  jobLevel: number;

  // Base Stats (6 stats + job bonuses)
  str: number;  jobStr: number;
  agi: number;  jobAgi: number;
  vit: number;  jobVit: number;
  int: number;  jobInt: number;
  dex: number;  jobDex: number;
  luk: number;  jobLuk: number;

  // Skill
  selectedAtkSkill: string;    // Format: "SkillName==level"
  propertyAtk: string;         // Weapon element override

  // Equipment: weapon, leftWeapon, shield, headUpper, headMiddle, headLower,
  //   armor, garment, boot, accLeft, accRight, pet, ammo
  // Each slot has: itemId, refine, grade, cards (1-4), enchants (0-3)
  weapon: number;
  weaponRefine: number;
  weaponCard1: number; weaponCard2: number; weaponCard3: number; weaponCard4: number;
  weaponEnchant0: number; weaponEnchant1: number; weaponEnchant2: number; weaponEnchant3: number;
  // ... same pattern for all slots

  // Shadow gear: 6 slots (weapon, armor, shield, boot, earring, pendant)
  //   Each has: itemId, refine, enchant1-3

  // Costume enchants: upper, upper2, middle, lower, garment, garment2, garment4

  // Skill data (index-based arrays + name-based maps)
  skillBuffMap: { [name: string]: number };  // Buff name → dropdown value
  skillBuffs: number[];                       // Index-based buff values
  activeSkillMap: { [name: string]: number }; // Active skill name → level
  activeSkills: number[];                     // Index-based active skill values
  passiveSkillMap: { [name: string]: number };
  passiveSkills: number[];

  // Consumables
  consumables: any[];      // Item IDs
  consumables2: any[];     // Food stat item IDs
  aspdPotion: number;
  aspdPotions: any[];

  rawOptionTxts: any[];    // Extra option strings ("attr:value")
}
```

**Important**: Skill arrays are **index-based** (position in class skill list), while skill maps are **name-based** (portable across class changes). Cloud presets use both — maps for safe restoration, arrays for backward compatibility.

### RoPresetModel — Cloud Preset Wrapper

```typescript
interface RoPresetModel {
  id: string;              // UUID
  userId: string;
  label: string;           // User-given name
  model: PresetModel;      // Full data
  classId: number;         // Denormalized from model.class
  createdAt: string;
  updatedAt: string;
  publishName: string;     // Shared preset display name
  isPublished: boolean;
  publishedAt: string;
}
```

### Response Types

| Type | Has `model`? | Has `tags`? | Used by |
|------|-------------|-------------|---------|
| `GetMyPresetsResponse` = `PresetWithTagsModel[]` | **NO** | Yes | `getMyPresets()` — dropdown list |
| `GetMyEntirePresetsResponse` = `EntirePresetWithTagsModel[]` | **YES** | Yes | `getEntirePresets()` — bulk with data |
| `RoPresetModel` | **YES** | No | `getPreset(id)` — single fetch |

```typescript
// PresetWithTagsModel: for dropdown list (lightweight)
interface PresetWithTagsModel extends Omit<RoPresetModel, 'model' | 'userId'> {
  tags: PresetTagModel[];
}

// EntirePresetWithTagsModel: for bulk fetch with full data
interface EntirePresetWithTagsModel extends Omit<RoPresetModel, 'classId' | 'userId'> {
  tags: PresetTagModel[];
}
```

### PresetTagModel — Sharing Tags

```typescript
interface PresetTagModel {
  id: string;
  label: string;
  classId: number;
  liked: boolean;
  tag: string;
  totalLike: number;
  publisherId: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. PresetService API

```typescript
class PresetService extends BaseAPIService {
  // Single preset (with model)
  getPreset(presetId: string): Observable<RoPresetModel>

  // List presets (NO model — use for dropdown display)
  getMyPresets(): Observable<PresetWithTagsModel[]>

  // Bulk fetch ALL presets (WITH model — use for DPS compare)
  getEntirePresets(): Observable<EntirePresetWithTagsModel[]>

  // CRUD
  createPreset(preset: { label, model }): Observable<RoPresetModel>
  bulkCreatePresets(bulkPreset: { bulkData: any[] }): Observable<RoPresetModel[]>
  updatePreset(id, preset: { label?, model? }): Observable<RoPresetModel>
  deletePreset(id): Observable<RoPresetModel>

  // Sharing
  sharePreset(id, { publishName }): Observable<PresetWithTagsModel>
  unsharePreset(id): Observable<Omit<RoPresetModel, 'model'>>

  // Tags
  addPresetTags(id, { createTags, deleteTags }): Observable<PresetWithTagsModel>
  removePresetTag({ presetId, tagId }): Observable<...>
  likePresetTags(tagId): Observable<LikeTagResponse>
  unlikePresetTag(tagId): Observable<LikeTagResponse>

  // Public presets
  getPublishPresets({ classId, tagName, skip, take }): Observable<PublishPresetsReponse>
}
```

### API Endpoints (BaseAPIService)

```typescript
const API = {
  login:              `${BASE_URL}/login`,
  logout:             `${BASE_URL}/me/logout`,
  refreshToken:       `${BASE_URL}/refresh_token`,
  getMyProfile:       `${BASE_URL}/me`,
  getMyEntirePreset:  `${BASE_URL}/me/ro_entire_presets`,
  getMyPreset:        `${BASE_URL}/me/ro_presets`,      // GET /:id, POST, POST /:id, DELETE /:id
  createMyPreset:     `${BASE_URL}/me/ro_presets`,
  bulkCreateMyPresets:`${BASE_URL}/me/bulk_ro_presets`,
  likePresetTags:     `${BASE_URL}/preset_tags`,
  sharedPresets:      `${BASE_URL}/ro_presets`,
};
```

### Auth & Token Management

```typescript
// BaseAPIService handles JWT automatically:
// - get/post/delete check jwtHelper.isTokenExpired()
// - If expired → refreshToken() → retry
// - 401 errors → clear tokens → throw Unauthorized
// - Auth header: { authorization: `bearer ${token}` }

// AuthService events:
authService.loggedInEvent$: Observable<boolean>  // ReplaySubject(1)
authService.isLoggedIn: boolean                  // Sync property
authService.profileEventObs$: Observable<Profile>
```

---

## 4. Preset Flow in RoCalculatorComponent

### Initialization

```
ngOnInit()
  → initData() → forkJoin([items, monsters, hpSpTable])
  → loadItemSet(localStorage.getItem('ro-set'))    // restore last session
  → authService.loggedInEvent$.subscribe(isLoggedIn => {
      if (isLoggedIn) { confirmSync(); setPresetList(); }
      else            { setPresetList(); }
    })
```

### Dropdown Population — `setPresetList()`

```typescript
// Cloud (logged in): fetches list WITHOUT model data
private setPresetList() {
  if (this.isLoggedIn) {
    const ob = this.presetService.getMyPresets().pipe(
      tap((presets) => {
        this.preSets = presets.map((p) => ({
          label: p.label,
          value: p.id,            // UUID string
          icon: ClassIcon[p.classId],
        }));
      }),
    );
    this.calAPIWithLoading(ob);
  } else {
    // Local: reads from localStorage (has inline model)
    this.preSets = this.getPresetList().map((a) => ({
      ...a,
      icon: ClassIcon[(a as any)?.model?.class],
    }));
  }
}
```

**Dropdown model**: `{ label: string, value: string (id or name), icon: number }`

### Save — `updatePreset(name)` / `createCloudPreset(label)`

```
User types name → clicks Save
  ├── Logged in  → createCloudPreset(label)
  │     → confirm → presetService.createPreset({ label, model: toUpsertPresetModel(model, char) })
  │     → prepend to preSets array
  │
  └── Logged out → updatePreset(name)
        ├── Name exists → confirm → overwrite model in localStorage array
        └── Name new    → createPreset(name) → push to localStorage array
```

### Cloud Update — `updateCloudPreset()`

```typescript
// Triggered via split-button "Update" when selectedPreset is set
updateCloudPreset() {
  const id = this.selectedPreset;
  const label = this.preSets.find(a => a.value === id)?.label;
  // confirm → presetService.updatePreset(id, { label, model: toUpsertPresetModel(...) })
}
```

### Load — `loadPreset(presetName?)`

```
User selects preset → clicks Load
  ├── Cloud: confirm → presetService.getPreset(id) → loadItemSet(preset.model)
  │     Note: getPreset fetches the FULL model (not in dropdown list)
  │
  └── Local: confirm → find in localStorage → loadItemSet(selected.model)
        Model is already inline — no API call needed
```

### Delete — `deletePreset()`

```
Cloud: confirm → presetService.deletePreset(id) → remove from preSets
Local: (disabled — commented out)
```

### loadItemSet() — Applying a Preset Model

```typescript
loadItemSet(presetStrOrModel: string | PresetModel) {
  // 1. Parse: JSON string or object → setModelByJSONString()
  //    Merges with empty model defaults, migrates rawOptionTxts

  // 2. Character: setClassInstant() → Characters.find(a => a.value === model.class)
  //    Sets selectedCharacter, calculator.setClass()

  // 3. Skills: setSkillModelArray() → restore from skillBuffMap/activeSkillMap
  //    setClassSkill() → populate atkSkills, activeSkills, passiveSkills

  // 4. Level: setClassLvl(), setJobBonus()

  // 5. Equipment dropdowns: setItemDropdownList()

  // 6. Restore all items: iterate MainItemWithRelations
  //    For each slot: onSelectItem(itemType, itemId, refine)
  //    For each related slot (cards, enchants): onSelectItem(relType, ...)

  // 7. Trigger recalculation: onBaseStatusChange()

  // Returns Observable — uses mergeMap chain with waitRxjs() yields
}
```

### setModelByJSONString() — Model Parsing & Migration

```typescript
private setModelByJSONString(savedModel: string | any) {
  // 1. Parse JSON string (or use object directly)
  // 2. Create fresh model via createMainModel()
  // 3. Merge saved values with defaults (preserving types, arrays)
  // 4. Migration: rawOptionTxts index 51-56 → 20-25
  // 5. Special: mapPhamacy skill buff → consumable injection
}
```

---

## 5. Local↔Cloud Sync

### confirmSync() — Auto-triggered on Login

```typescript
confirmSync() {
  const total = this.getPresetList().length;
  if (total > 0) {
    this.syncLocalPresetToCloud();  // Auto-sync (no confirmation)
  }
}
```

### syncLocalPresetToCloud()

```
1. Read local presets from localStorage
2. Fix legacy skill values (mapFix: string keys → numeric values)
3. Build name-based skill maps (skillBuffMap, activeSkillMap, passiveSkillMap)
   using CharacterBase instances to resolve index→name mapping
4. presetService.bulkCreatePresets({ bulkData: fixPresets })
5. verifySyncPreset() — logs mismatches between local and cloud
6. deleteLocalPresets() — clears localStorage['presets']
7. Update preSets dropdown with cloud-returned IDs
```

### verifySyncPreset() — Validation Utility

```typescript
// Compares local preset models against cloud-returned models
// Logs per-field mismatches: value differences, array length mismatches
// Used for debugging sync issues (console.log only)
```

---

## 6. toUpsertPresetModel() — Cloud-Safe Conversion

```typescript
// Converts a MainModel to a cloud-safe PresetModel by adding name-based skill maps
toUpsertPresetModel(model: MainModel, cClass: CharacterBase) {
  // Build: skillBuffMap    (JobBuffs[i].name → model.skillBuffs[i])
  // Build: activeSkillMap  (cClass.activeSkills[i].name → model.activeSkills[i])
  // Build: passiveSkillMap (cClass.passiveSkills[i].name → model.passiveSkills[i])
  return { ...model, skillBuffMap, activeSkillMap, passiveSkillMap };
}
```

**Why**: Skill arrays are index-based and break when class skill order changes. Maps provide stable key↔value pairs.

---

## 7. PresetTableComponent — Management Dialog

Opened via `openPresetManagement()` using PrimeNG `DynamicDialog`.

### Injected Data (from parent)

```typescript
data: {
  items: Record<number, ItemModel>,           // Full item database
  presets: DropdownModel[],                    // Local presets
  getPresetFn: () => DropdownModel[],         // Read local presets
  savePresetListFn: (presets) => void,         // Write local presets
  setPresetListFn: () => void,                 // Refresh parent dropdown
  loadPresetFn: (presetName) => void,          // Load preset in parent
  removePresetFromListFn: (presetId) => void,  // Remove from parent dropdown
}
```

### Features

| Feature | Cloud | Local |
|---------|-------|-------|
| Load preset | `loadPresetFn(cloudPreset.id)` | `loadPresetFn(localPreset.value)` |
| Delete | `presetService.deletePreset(id)` | Remove from localStorage array |
| Rename | `presetService.updatePreset(id, { label })` | N/A |
| Share/Unshare | `presetService.sharePreset(id, { publishName })` | N/A |
| Tags | `presetService.addPresetTags(id, { createTags, deleteTags })` | N/A |
| Move to cloud | `presetService.createPreset(local)` → delete local | N/A |
| Class filter | Filters `cloudPresets` by `model.class` | N/A |
| Equipment preview | Displays main/shadow/costume items from `model` | Same |

### Cloud Preset Loading (in dialog)

```typescript
loadFromCloud(isInOtherProcessing: boolean) {
  return this.presetService.getEntirePresets().pipe(
    tap((res) => {
      this.cloudPresets = res.map(a => ({
        ...a, value: a.id, icon: ClassIcon[a.model.class]
      }));
      this.displayCloudPresets = this.cloudPresets;
    }),
  );
}
```

---

## 8. DPS Compare — Preset Loading

The `DpsCompareComponent` loads presets independently for side-by-side comparison:

```typescript
loadPresetOptions() {
  // 1. Local: JSON.parse(localStorage['presets'])
  //    Labeled "[Local] name", model available inline

  // 2. Cloud: presetService.getEntirePresets()
  //    Uses bulk fetch (WITH model) to avoid per-preset API calls

  // Combined into unified PresetOption[] with:
  //   { label, value: "local::name" | "cloud::id", icon, model, source }
}
```

Each side creates its own `Calculator` instance from the preset's model.

---

## 9. localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `'presets'` | `JSON array` | Local preset list `[{ label, value, model }]` |
| `'ro-set'` | `JSON string` | Last active model state (auto-restored on page load) |
| `'monster'` | `string (number)` | Selected monster ID |
| `'monsterIds'` | `JSON array` | Monster IDs for battle comparison table |
| `'battle_cols'` | `JSON array` | Selected battle table columns |
| `'accessToken'` | `string` | JWT access token |
| `'refreshToken'` | `string` | JWT refresh token |

---

## 10. ClassIcon Mapping

```typescript
import { ClassIcon } from 'src/app/jobs';
// ClassIcon: Record<ClassIDEnum, number>
// Maps classId → icon item ID
// Usage: `assets/demo/images/jobs/icon_jobs_${ClassIcon[classId]}.png`
```

---

## 11. UI Components

### Preset Save Bar (top of calculator)

```html
<!-- Input + Save + Settings -->
<div class="p-inputgroup">
  <input #presetName pInputText placeholder="Name" />
  <button pButton label="Save" (click)="updatePreset(presetName.value)"></button>
  <button pButton icon="pi pi-cog" (click)="openPresetManagement()"></button>
</div>

<!-- Dropdown + Load/Update/Delete -->
<div class="p-inputgroup dropdown-joblist">
  <p-dropdown [options]="preSets" [(ngModel)]="selectedPreset" [filter]="true">
    <!-- Templates show job icon + label -->
  </p-dropdown>
  <p-splitButton label="Load" (onClick)="loadPreset()" [model]="loadBtnItems">
    <!-- loadBtnItems: Update, Delete -->
  </p-splitButton>
</div>
```

### Split Button Menu Items

```typescript
loadBtnItems = [
  { label: 'Update', icon: PrimeIcons.SYNC, command: () => updateCloudPreset() || updatePreset() },
  { label: 'Delete', icon: PrimeIcons.TRASH, command: () => deletePreset() },
];
```

---

## 12. Common Patterns

### API Call with Loading State

```typescript
private calAPIWithLoading<T>(fn: Observable<T>) {
  this.isInProcessingPreset = true;
  return fn.pipe(
    catchError(err => this.handleAPIError(err)),
    finalize(() => { this.isInProcessingPreset = false; }),
  ).subscribe();
}
```

### Confirmation Dialog

```typescript
private waitConfirm(message: string): Promise<boolean> {
  return new Promise((res) => {
    this.confirmationService.confirm({
      message, header: 'Confirmation', icon: 'pi pi-exclamation-triangle',
      accept: () => res(true),
      reject: () => res(false),
    });
  });
}
// Usage: this.waitConfirm('Load?').then(ok => { if (ok) ... });
```

### Preset Dropdown Item Structure

```typescript
preSets: (DropdownModel & { icon: string })[]
// {
//   label: "My Preset",
//   value: "uuid-string" (cloud) | "preset-name" (local),
//   icon: ClassIcon[classId]    // → img src path
// }
```
