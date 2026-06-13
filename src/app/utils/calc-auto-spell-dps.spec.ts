import { calcAutoSpellDps, getDmgPerCast } from './calc-auto-spell-dps';

describe('getDmgPerCast', () => {
  it('returns skillDps / skillHitsPerSec when hitsPerSec > 0', () => {
    const dmg = { skillDps: 1000, skillHitsPerSec: 4, skillTotalHit: 3, skillMinDamage: 10, skillMaxDamage: 20 } as any;
    expect(getDmgPerCast(dmg)).toBe(250);
  });

  it('falls back to totalHit * avg(min,max) when hitsPerSec is 0', () => {
    const dmg = { skillDps: 0, skillHitsPerSec: 0, skillTotalHit: 3, skillMinDamage: 10, skillMaxDamage: 20 } as any;
    // 3 * ((10 + 20) / 2) = 45
    expect(getDmgPerCast(dmg)).toBe(45);
  });

  it('falls back when skillHitsPerSec is undefined', () => {
    const dmg = { skillDps: 0, skillTotalHit: 2, skillMinDamage: 5, skillMaxDamage: 5 } as any;
    expect(getDmgPerCast(dmg)).toBe(10);
  });
});

describe('calcAutoSpellDps', () => {
  it('multiplies dmgPerCast by casts/sec and chance fraction, floored', () => {
    // 250 * 6 * 0.30 = 450
    expect(calcAutoSpellDps({ dmgPerCast: 250, mainCastsPerSec: 6, chancePercent: 30 })).toBe(450);
  });

  it('floors the result', () => {
    // 100 * 6.6 * 0.30 = 198
    expect(calcAutoSpellDps({ dmgPerCast: 100, mainCastsPerSec: 6.6, chancePercent: 30 })).toBe(198);
  });

  it('returns 0 when chance is 0', () => {
    expect(calcAutoSpellDps({ dmgPerCast: 250, mainCastsPerSec: 6, chancePercent: 0 })).toBe(0);
  });
});
