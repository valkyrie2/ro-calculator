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

/**
 * เดินสาย autospell: ใช้สกิล mainName -> autospell สกิลถัดไป ซึ่งนับเป็นการใช้สกิลและ autospell ต่อได้
 * คืนแต่ละ entry ที่ proc พร้อม chanceFraction สะสม (คูณกันตามสาย)
 * visited กันลูป (รวม same-skill self-proc) — แต่ละสกิล autospell ได้ครั้งเดียวต่อสาย
 */
export const resolveAutoSpellChain = <T extends { onSkill: string; skill: string; chance: number }>(
  list: T[],
  mainName: string,
): (T & { chanceFraction: number })[] => {
  const visited = new Set<string>();
  const out: (T & { chanceFraction: number })[] = [];
  let frontier = [{ onSkill: mainName, chanceFraction: 1 }];

  while (frontier.length) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      for (const entry of list.filter((a) => a.onSkill === node.onSkill)) {
        if (visited.has(entry.skill)) continue;
        visited.add(entry.skill);
        const chanceFraction = node.chanceFraction * (entry.chance / 100);
        out.push({ ...entry, chanceFraction });
        next.push({ onSkill: entry.skill, chanceFraction });
      }
    }
    frontier = next;
  }

  return out;
};
