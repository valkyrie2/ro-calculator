import { ItemModel } from 'src/app/models/item.model';

/**
 * Subset of fields divine-pride.net's `/api/database/Item/:id` endpoint
 * actually returns. We only declare what we map; the real payload has
 * more keys (Identifier flags, NPC pricing, etc.) we don't care about.
 */
export interface DivinePrideItemResponse {
  Id: number;
  AegisName?: string;
  Name?: string;
  UnidentifiedDisplayName?: string;
  ResourceName?: string;
  Description?: string;
  Slots?: number;
  Type?: number;
  SubType?: number;
  Attack?: number | null;
  Defense?: number | null;
  Weight?: number;
  EquipLevelMin?: number;
  RequiredLevel?: number;
  Locations?: Record<string, boolean>;
  Script?: string;
}

const DEFAULT_ITEM_TYPE_ID = 5;
const DEFAULT_ITEM_SUBTYPE_ID = 0;

/**
 * Parse a divine-pride.net URL or raw id and return the numeric item id.
 * Examples accepted:
 *   "410193"
 *   "https://www.divine-pride.net/database/item/410193"
 *   "https://www.divine-pride.net/database/item/410193/costume-mini-poring"
 */
export function parseDivinePrideItemRef(input: string): number | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const match = trimmed.match(/\/database\/item\/(\d+)/i);
  if (match) return Number(match[1]);
  return null;
}

/**
 * Map a divine-pride.net Item API response to our internal ItemModel
 * shape. Defaults are filled in for fields the calculator's dropdowns
 * key on so the new item is renderable even when the upstream data is
 * missing pieces. The `script` is left empty here — admins can edit
 * it in the JSON textarea before saving.
 */
export function mapDivinePrideItem(payload: DivinePrideItemResponse): ItemModel {
  const id = payload.Id;
  // Find the equipment slot key from the truthy Locations hash. The app
  // expects a single `location` string (e.g. "Accessory", "Head_Top").
  let location: string | null = null;
  if (payload.Locations) {
    location = Object.keys(payload.Locations).find((k) => payload.Locations![k]) ?? null;
  }

  return {
    id,
    aegisName: payload.AegisName ?? `Custom_${id}`,
    name: payload.Name ?? `Custom Item ${id}`,
    unidName: payload.UnidentifiedDisplayName ?? '',
    resName: payload.ResourceName ?? '',
    description: payload.Description ?? '',
    slots: payload.Slots ?? 0,
    itemTypeId: payload.Type ?? DEFAULT_ITEM_TYPE_ID,
    itemSubTypeId: payload.SubType ?? DEFAULT_ITEM_SUBTYPE_ID,
    itemLevel: null,
    attack: payload.Attack ?? null,
    defense: payload.Defense ?? null,
    weight: payload.Weight ?? 0,
    requiredLevel: payload.EquipLevelMin ?? payload.RequiredLevel ?? 1,
    location: location as any,
    compositionPos: null as any,
    script: {},
  } as ItemModel;
}

/** Public CDN URL where divine-pride hosts the item icon. */
export function divinePrideItemImageUrl(id: number): string {
  return `https://static.divine-pride.net/images/items/item/${id}.png`;
}
