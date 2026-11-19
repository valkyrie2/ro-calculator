import { ItemDropdownModel } from '../models/dropdown.model';

/** Marker prefix added to labels of items only privileged users can see. */
const PREMIUM_MARK = '⭐ ';
/** Marker prefix added to labels of items not yet released (auto-removed once releaseDate passes). */
const UNRELEASED_MARK = '🔒 ';
/** Marker prefix added to virtual "expired simulation" entries (simulates the item after TIME[] expires). */
const EXPIRED_SIM_MARK = '[Expired] ';
/** Marker prefix added to items whose addDate is within the last month (auto-removed after that). */
const NEW_MARK = '[NEW] ';

export const isNewItem = (addDate: string | undefined, now = Date.now()): boolean => {
  if (!addDate) return false;
  const until = new Date(addDate);
  until.setMonth(until.getMonth() + 1);
  return now >= Date.parse(addDate) && now < until.getTime();
};

export const toDropdownList = <T extends Record<string, any>>(
  list: T[],
  labelKey: keyof T,
  valueKey: keyof T,
  elementKey?: keyof T,
  extraKeys?: (keyof T)[],
): ItemDropdownModel[] => {
  const now = Date.now();

  const newItems: ItemDropdownModel[] = [];
  const others: ItemDropdownModel[] = [];

  for (const a of list) {
    const ex = (extraKeys || []).reduce<T>((extraAttr, key) => {
      extraAttr[key] = a[key];

      return extraAttr;
    }, {} as T);

    const baseLabel = a[labelKey];
    const isUnreleased = !!a['releaseDate'] && Date.parse(a['releaseDate']) > now;
    const isPremium = !!a['isPremium'];
    const isExpiredSim = !!a['isExpiredSim'];
    const isNew = isNewItem(a['addDate'], now);
    const prefix = (isNew ? NEW_MARK : '') + (isUnreleased ? UNRELEASED_MARK : '') + (isPremium ? PREMIUM_MARK : '') + (isExpiredSim ? EXPIRED_SIM_MARK : '');

    (isNew ? newItems : others).push({
      label: prefix ? `${prefix}${baseLabel}` : baseLabel,
      value: a[valueKey],
      usableClass: a['usableClass'] || undefined,
      unusableClass: a['unusableClass'] || undefined,
      element: elementKey ? a[elementKey] || '' : undefined,
      lv200ClassName: a['requiredLevel'] >= 200 ? 'lv200' : '',
      ...ex,
    });
  }

  return [...newItems, ...others];
};
