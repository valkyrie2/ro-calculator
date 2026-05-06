import { ItemModel } from 'src/app/models/item.model';

/**
 * Subset of fields divine-pride.net's `/api/database/Item/:id` endpoint
 * actually returns (all keys are camelCase in the real response).
 * We only declare what we map; the real payload has more keys
 * (Identifier flags, NPC pricing, etc.) we don't care about.
 */
export interface DivinePrideItemResponse {
  id: number;
  aegisName?: string;
  name?: string;
  unidName?: string;
  resName?: string;
  description?: string;
  slots?: number;
  itemTypeId?: number;
  itemSubTypeId?: number;
  attack?: number | null;
  matk?: number | null;
  defense?: number | null;
  weight?: number;
  equipLevelMin?: number;
  requiredLevel?: number;
  location?: string | null;
  compositionPos?: number | null;
  cardPrefix?: string;
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
  const id = payload.id;

  return {
    id,
    aegisName: payload.aegisName ?? `Custom_${id}`,
    name: payload.name ?? `Custom Item ${id}`,
    unidName: payload.unidName ?? '',
    resName: payload.resName ?? '',
    description: payload.description ?? '',
    slots: payload.slots ?? 0,
    itemTypeId: payload.itemTypeId ?? DEFAULT_ITEM_TYPE_ID,
    itemSubTypeId: payload.itemSubTypeId ?? DEFAULT_ITEM_SUBTYPE_ID,
    itemLevel: null,
    attack: payload.attack ?? null,
    defense: payload.defense ?? null,
    weight: payload.weight ?? 0,
    requiredLevel: payload.equipLevelMin ?? payload.requiredLevel ?? 1,
    location: (payload.location ?? null) as any,
    compositionPos: (payload.compositionPos ?? null) as any,
    ...(payload.cardPrefix ? { cardPrefix: payload.cardPrefix } : {}),
    script: {},
  } as ItemModel;
}

/** Public CDN URL where divine-pride hosts the item icon. */
export function divinePrideItemImageUrl(id: number): string {
  return `https://static.divine-pride.net/images/items/item/${id}.png`;
}
