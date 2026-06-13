import { floor } from './floor';

interface AutoSpellDmgInput {
  skillDps: number;
  skillHitsPerSec?: number;
  skillTotalHit: number;
  skillMinDamage: number;
  skillMaxDamage: number;
}

/**
 * ดาเมจเฉลี่ยต่อการร่าย 1 ครั้งของสกิล (รวมทุก hit + crit/แม่นแล้ว)
 * ปกติ = skillDps / skillHitsPerSec (หาร rate ออก เหลือดาเมจต่อ cast)
 * fallback กันหารศูนย์ = skillTotalHit * ค่าเฉลี่ย(min,max)
 */
export const getDmgPerCast = (dmg: AutoSpellDmgInput): number => {
  if (dmg.skillHitsPerSec && dmg.skillHitsPerSec > 0) {
    return dmg.skillDps / dmg.skillHitsPerSec;
  }

  return dmg.skillTotalHit * ((dmg.skillMinDamage + dmg.skillMaxDamage) / 2);
};

/**
 * DPS ส่วนเสริมจาก autospell
 * = ดาเมจต่อ cast ของ ABC * อัตราการร่ายสกิลหลัก/วิ * (chance/100)
 */
export const calcAutoSpellDps = (params: {
  dmgPerCast: number;
  mainCastsPerSec: number;
  chancePercent: number;
}): number => {
  const { dmgPerCast, mainCastsPerSec, chancePercent } = params;

  return floor(dmgPerCast * mainCastsPerSec * (chancePercent / 100));
};
