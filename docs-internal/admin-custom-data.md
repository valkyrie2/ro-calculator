# Admin Custom Data — Setup & Usage

The Admin tab lets users with `role='admin'` add new items and custom
monsters that get merged into the calculator alongside the static JSON
data shipped in `assets/`. Two Supabase Storage buckets host the images.

## 1. Apply the migration

```bash
supabase db push
# or, if running locally:
supabase migration up
```

The migration `20260429000000_admin_custom_data.sql` creates:

- `public.custom_items` — keyed on item id, jsonb `data`, optional `image_path`
- `public.custom_monsters` — keyed on monster id, same shape
- Storage buckets `custom-item-images` and `custom-monster-images`
  (public-read, admin-only write)

RLS policies allow:

- `SELECT` for anyone (so anon clients merge custom rows on calculator load).
- `INSERT`/`UPDATE`/`DELETE` only when `public.is_admin()` returns true.

## 2. Promote a user to admin

After signing up:

```sql
update public.user_profiles set role = 'admin' where id = '<user-uuid>';
```

The `Admin` topbar tab appears once `AuthService.isAdmin$` flips to `true`.

## 3. Workflows

### Add Item

Route: `/#/admin` → **Add Item** tab.

1. Paste an item JSON object. Both shapes are accepted:
   - `{ "id": 1234567, "aegisName": "...", ... }`
   - `{ "1234567": { "id": 1234567, ... } }` (the on-disk shape from
     `src/assets/demo/data/item.json`).
2. Optionally upload an image; it's stored at
   `custom-item-images/<id>.<ext>` and the row's `image_path` is saved.
3. Click **Save Item** — `AdminService.addItem()` upserts into
   `custom_items`. The next time the calculator subscribes to
   `RoService.getItems()` (e.g. on login state change), the new item
   appears.

### Add Custom Monster

Route: `/#/admin` → **Add Custom Monster** tab.

The form is pre-filled with the example used during development
(`Bio Dark Pinguicula`). Required fields:

| Field | Notes |
|-------|-------|
| ID | numeric, unique |
| Name | display name |
| Level | integer |
| Element | `Neutral` / `Water` / `Fire` / etc. |
| Element Level | 1–4 (combined into `elementName` like `"Poison 3"`) |
| Race | matches `RaceType` enum |
| Size | `Small` / `Medium` / `Large` (`scaleName`) |
| HP / DEF / MDEF / RES / MRES | stat numerics |
| EXP / JEXP | base + job experience |

The form builds a full `MonsterModel` matching the shape of
`monster.json` (atk/range/sp filled with sane defaults), so the
calculator's pipeline (`Monster.toCalcInput` etc.) consumes it
without any special-casing.

## 4. How custom data merges in

`RoService` switches its base HTTP stream into `AdminService` and
shallow-merges custom rows on top:

```ts
this.cachedItems$ = baseItems$.pipe(
  // ...validation tap()...
  switchMap((base) =>
    this.adminService.getCustomItems().pipe(map((custom) => ({ ...base, ...custom }))),
  ),
  shareReplay(1),
);
```

Custom rows therefore override identical built-in IDs. `AdminService`
caches its fetch with `shareReplay(1)` and invalidates the cache after
each write; `RoCalculator` re-subscribes to `RoService` whenever the
viewer's permission changes (`refreshItemsAndMonsters()`), so a fresh
login or page reload picks up the latest admin data.

## 5. Image rendering caveat

`AdminService` attaches a `customImageUrl` field on returned items /
monsters that points at the public Supabase URL. The calculator's
existing `<img src="assets/demo/images/items/{{id|itemImage}}.png">`
pattern still falls back to the assets folder, so for full visual
parity with built-in items you can also drop the file into
`src/assets/demo/images/items/<id>.png` (and `docs/...` when
deploying). The cloud copy is the source of truth; the local file is
only a render shortcut.
