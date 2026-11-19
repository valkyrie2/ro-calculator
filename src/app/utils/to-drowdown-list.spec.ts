import { isNewItem, toDropdownList } from './to-drowdown-list';

describe('NEW item tag', () => {
  const now = Date.parse('2026-11-18');

  it('is new for one month from addDate', () => {
    expect(isNewItem('2026-11-18', now)).toBeTrue();
    expect(isNewItem('2026-10-19', now)).toBeTrue();
    expect(isNewItem('2026-10-18', now)).toBeFalse();
    expect(isNewItem('2026-11-19', now)).toBeFalse();
    expect(isNewItem(undefined, now)).toBeFalse();
  });

  it('lists new items first with a [NEW] prefix', () => {
    const today = new Date().toISOString().slice(0, 10);
    const list = toDropdownList(
      [
        { id: 1, name: 'A' },
        { id: 2, name: 'B', addDate: today },
      ],
      'name',
      'id',
    );
    expect(list.map((a) => a.label)).toEqual(['[NEW] B', 'A']);
  });
});
