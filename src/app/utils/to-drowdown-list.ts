import { ItemDropdownModel } from '../models/dropdown.model';

/** Marker prefix added to labels of items only privileged users can see. */
const PREMIUM_MARK = '⭐ ';
/** Marker prefix added to labels of items not yet released (auto-removed once releaseDate passes). */
const UNRELEASED_MARK = '🔒 ';

export const toDropdownList = <T extends Record<string, any>>(
  list: T[],
  labelKey: keyof T,
  valueKey: keyof T,
  elementKey?: keyof T,
  extraKeys?: (keyof T)[],
): ItemDropdownModel[] => {
  const now = Date.now();

  return list.map<ItemDropdownModel>((a) => {
    const ex = (extraKeys || []).reduce<T>((extraAttr, key) => {
      extraAttr[key] = a[key];

      return extraAttr;
    }, {} as T);

    const baseLabel = a[labelKey];
    const isUnreleased = !!a['releaseDate'] && Date.parse(a['releaseDate']) > now;
    const isPremium = !!a['isPremium'];
    const prefix = (isUnreleased ? UNRELEASED_MARK : '') + (isPremium ? PREMIUM_MARK : '');

    return {
      label: prefix ? `${prefix}${baseLabel}` : baseLabel,
      value: a[valueKey],
      usableClass: a['usableClass'] || undefined,
      unusableClass: a['unusableClass'] || undefined,
      element: elementKey ? a[elementKey] || '' : undefined,
      lv200ClassName: a['requiredLevel'] >= 200 ? 'lv200' : '',
      ...ex,
    };
  });
};
