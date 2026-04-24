import { AtkSkillModel } from './_character-base.abstract';

/**
 * Builds an `AtkSkillModel` while filling in the repetitive label/value/values scaffolding.
 *
 * Instead of writing:
 * ```ts
 * {
 *   name: 'Banishing Point',
 *   label: 'Banishing Point Lv10',
 *   value: 'Banishing Point==10',
 *   values: ['[Improved] Banishing Point==10'],
 *   acd: 0, fct: 0, vct: 0, cd: 0,
 *   formula: (...) => ...,
 * }
 * ```
 *
 * You can write:
 * ```ts
 * atkSkill({
 *   name: 'Banishing Point',
 *   level: 10,
 *   includeImproved: true,
 *   formula: (...) => ...,
 * })
 * ```
 *
 * Behaviour is identical — no runtime defaults are injected. `acd`, `fct`, `vct`, `cd` still
 * default to 0 (matching the majority of existing hand-written entries), but any field in
 * `overrides` takes precedence.
 */
export interface AtkSkillBuilderInput extends Omit<Partial<AtkSkillModel>, 'name' | 'label' | 'value' | 'values' | 'formula'> {
  name: AtkSkillModel['name'];
  level: number;
  /** When true, adds `[Improved] <name>==<level>` to the `values` list. */
  includeImproved?: boolean;
  /** Append additional entries to `values` (in addition to the `[Improved]` entry if enabled). */
  extraValues?: string[];
  formula: AtkSkillModel['formula'];
}

export function atkSkill(input: AtkSkillBuilderInput): AtkSkillModel {
  const { name, level, includeImproved, extraValues, formula, ...overrides } = input;
  const value = `${name}==${level}`;
  const values: string[] = [];
  if (includeImproved) values.push(`[Improved] ${value}`);
  if (extraValues?.length) values.push(...extraValues);

  return {
    acd: 0,
    fct: 0,
    vct: 0,
    cd: 0,
    ...overrides,
    name,
    label: `${name} Lv${level}`,
    value,
    values: values.length > 0 ? values : undefined,
    formula,
  } as AtkSkillModel;
}
