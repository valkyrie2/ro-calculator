import { ItemModel } from '../models/item.model';

/** Minimal shape any restrictable record (item, monster, ...) must expose. */
interface Restrictable {
  isPremium?: boolean;
  releaseDate?: string;
}

/**
 * Returns true when an entry should be hidden from regular (non-privileged)
 * users. Currently: entries flagged `isPremium`, or entries with a future
 * `releaseDate`.
 */
export function isRestricted(entry: Restrictable | undefined): boolean {
  if (!entry) return false;
  if (entry.isPremium) return true;
  if (entry.releaseDate) {
    const ts = Date.parse(entry.releaseDate);
    if (Number.isFinite(ts) && ts > Date.now()) return true;
  }
  return false;
}

/** Backwards-compatible alias for item-only callers. */
export const isRestrictedItem = (item: ItemModel | undefined) => isRestricted(item);

/**
 * Strips entries the viewer is not allowed to see (premium-only / not yet
 * released) from a master dictionary keyed by id.
 *
 * Defense-in-depth filter: restricted entries still ship in the static JSON,
 * but non-privileged clients never list them in dropdowns, never apply their
 * bonuses/effects, and don't render their tooltips. A preset that references
 * a restricted entry simply shows that slot/target as empty for the viewer.
 */
export function filterRestricted<T extends Record<number, Restrictable>>(
  entries: T,
  canSeeRestricted: boolean,
): T {
  if (canSeeRestricted) return entries;

  const out: Record<number, Restrictable> = {};
  for (const [id, entry] of Object.entries(entries)) {
    if (isRestricted(entry)) continue;
    out[+id] = entry;
  }
  return out as T;
}

/** Backwards-compatible alias — prefer `filterRestricted`. */
export const filterRestrictedItems = filterRestricted;
/** Backwards-compatible alias — prefer `filterRestricted`. */
export const filterPremiumItems = filterRestricted;
