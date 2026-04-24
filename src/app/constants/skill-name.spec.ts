import { OFFENSIVE_SKILL_NAMES } from './skill-name';

/**
 * Regression guards for skill-name typos that we've historically mis-fixed.
 * The in-game data (item.json) uses these EXACT strings — if the code diverges,
 * the RoService invalidBonusSet validator will flag items at runtime.
 *
 * We cast to `string[]` so we can assert the *absence* of the correctly-spelled
 * variants; the source array is `as const` and TS would otherwise reject
 * non-member literals passed to `toContain`.
 */
describe('OFFENSIVE_SKILL_NAMES', () => {
  const names = OFFENSIVE_SKILL_NAMES as readonly string[];

  it('keeps the canonical (typoed) "Fatal Manace" spelling that matches item.json script keys', () => {
    expect(names).toContain('Fatal Manace');
    expect(names).not.toContain('Fatal Menace');
  });

  it('keeps the canonical (typoed) "Lightening Bolt" spelling', () => {
    expect(names).toContain('Lightening Bolt');
    expect(names).not.toContain('Lightning Bolt');
  });

  it('has no duplicate entries', () => {
    const dupes = names.filter((name, i) => names.indexOf(name) !== i);
    expect(dupes).toEqual([]);
  });
});
