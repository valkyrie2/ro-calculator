import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SelectItemGroup } from 'primeng/api';
import { MonsterModel } from 'src/app/models/monster.model';
import {
  getActiveSpotlightEvent,
  getSpotlightMonster,
  SpotlightEvent,
  SpotlightMonster,
} from 'src/app/constants/exp-spotlight';

/**
 * Level difference modifier: diff = monsterLevel - playerLevel
 * Source: Official RO EXP table
 */
function getLevelDiffMod(diff: number): number {
  if (diff >= 16) return 0.40;
  if (diff === 15) return 1.15;
  if (diff === 14) return 1.20;
  if (diff === 13) return 1.25;
  if (diff === 12) return 1.30;
  if (diff === 11) return 1.35;
  if (diff === 10) return 1.40;
  if (diff === 9) return 1.35;
  if (diff === 8) return 1.30;
  if (diff === 7) return 1.25;
  if (diff === 6) return 1.20;
  if (diff === 5) return 1.15;
  if (diff === 4) return 1.10;
  if (diff === 3) return 1.05;
  if (diff >= -5) return 1.00;
  if (diff >= -10) return 0.95;
  if (diff >= -15) return 0.90;
  if (diff >= -20) return 0.85;
  if (diff >= -25) return 0.60;
  if (diff >= -30) return 0.35;
  return 0.10; // -31 and below
}

export type ManualType = 'none' | 'm50' | 'm55' | 'm100' | 'm200';
export type MalangCanType = 'none' | 'normal' | 'upgraded';

interface MonsterSelectItemGroup extends SelectItemGroup {
  items: any[];
}

interface ExpResult {
  rawBaseExp: number;
  rawJobExp: number;
  finalBaseExp: number;
  finalJobExp: number;
  levelDiffMod: number;
  equipModPercent: number;
  mrkimModPercent: number;
  malangCanModPercent: number;
  eventModPercent: number;
  vipModPercent: number;
  silvervineModPercent: number;
  satanMorrocModPercent: number;
  kafraModPercent: number;
  manualModPercent: number;
  totalBaseMod: number;
  totalJobMod: number;
}

@Component({
  selector: 'app-exp-calculator',
  templateUrl: './exp-calculator.component.html',
  styleUrls: ['./exp-calculator.component.scss'],
})
export class ExpCalculatorComponent implements OnChanges {
  @Input() groupMonsterList: MonsterSelectItemGroup[] = [];
  @Input() monsterDataMap: Record<number, MonsterModel> = {};
  @Input() playerLevel: number = 1;
  /** equip EXP bonus % from main calculator (totalSummary.calc.expBonus) */
  @Input() equipExpBonus: number = 0;

  selectedMonsterId: number = null;

  // --- Modifiers ---
  manualType: ManualType = 'none';
  malangCanType: MalangCanType = 'none';
  isVip = false;
  isMrKim = false;
  isKafraBuff = false;
  isSilvervine = false;
  isSatanMorroc = false;
  isJobManual = false;
  /** Custom event EXP % (auto-filled when spotlight is active) */
  eventExpPercent = 0;
  tapMod = 1;
  /** Override equip bonus manually (instead of using the value from the calculator) */
  overrideEquipBonus: number = null;
  /** Override player level manually (instead of using the value from the calculator) */
  overridePlayerLevel: number = null;

  // --- Results ---
  result: ExpResult | null = null;

  // --- Spotlight ---
  activeSpotlightEvent: SpotlightEvent | null = null;
  spotlightMonsterData: SpotlightMonster | null = null;

  readonly manualOptions: { label: string; value: ManualType }[] = [
    { label: 'None', value: 'none' },
    { label: '+50% Battle Manual', value: 'm50' },
    { label: '+55% Thick Battle Manual', value: 'm55' },
    { label: '+100% HE Battle Manual', value: 'm100' },
    { label: '+200% Battle Manual X3', value: 'm200' },
  ];

  readonly malangCanOptions: { label: string; value: MalangCanType }[] = [
    { label: 'None', value: 'none' },
    { label: 'Malangdo Cat Can +10%', value: 'normal' },
    { label: 'Upgraded Malangdo Cat Can +20%', value: 'upgraded' },
  ];

  readonly tapModOptions = [
    { label: '1×', value: 1 },
    { label: '2×', value: 2 },
    { label: '3×', value: 3 },
  ];

  constructor() {
    this.activeSpotlightEvent = getActiveSpotlightEvent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equipExpBonus'] && this.overrideEquipBonus === null) {
      // sync override field when parent changes and no custom override set
    }
    this.calculate();
  }

  get selectedMonster(): MonsterModel | null {
    if (!this.selectedMonsterId) return null;
    const dbMonster = this.monsterDataMap[this.selectedMonsterId];
    if (dbMonster) return dbMonster;
    // Virtual spotlight-only monster (synthetic ID, not in DB)
    if (this.spotlightMonsterData?.monsterLevel != null) {
      return this.makeVirtualMonster(this.spotlightMonsterData);
    }
    return null;
  }

  get isVirtualMonster(): boolean {
    return !!this.selectedMonsterId &&
      !this.monsterDataMap[this.selectedMonsterId] &&
      !!this.spotlightMonsterData;
  }

  get levelDiff(): number {
    if (!this.selectedMonster) return 0;
    return (this.selectedMonster.stats?.level || 0) - (this.effectivePlayerLevel || 1);
  }

  get effectiveEquipBonus(): number {
    return this.overrideEquipBonus !== null ? this.overrideEquipBonus : this.equipExpBonus;
  }

  get effectivePlayerLevel(): number {
    return this.overridePlayerLevel !== null ? this.overridePlayerLevel : this.playerLevel;
  }

  onMonsterChange(): void {
    if (this.selectedMonsterId) {
      this.spotlightMonsterData = getSpotlightMonster(this.selectedMonsterId);
    } else {
      this.spotlightMonsterData = null;
    }
    this.calculate();
  }

  onModifierChange(): void {
    this.calculate();
  }

  onOverrideEquipBonusChange(value: number): void {
    this.overrideEquipBonus = value;
    this.calculate();
  }

  resetEquipBonus(): void {
    this.overrideEquipBonus = null;
    this.calculate();
  }

  onOverridePlayerLevelChange(value: number): void {
    this.overridePlayerLevel = value;
    this.calculate();
  }

  resetPlayerLevel(): void {
    this.overridePlayerLevel = null;
    this.calculate();
  }

  /** groupMonsterList with Recommended and Spotlight groups prepended */
  get expGroupMonsterList(): MonsterSelectItemGroup[] {
    const playerLv = this.effectivePlayerLevel || 1;
    const groups: MonsterSelectItemGroup[] = [];

    // Build spotlight lookup map (monsterId -> SpotlightMonster)
    const spotlightMap = this.activeSpotlightEvent
      ? new Map(this.activeSpotlightEvent.monsters.map((m) => [m.monsterId, m]))
      : new Map<number, SpotlightMonster>();

    // --- Recommended group: top 5 by baseExp × levelDiffMod ---
    const candidates: { item: any; score: number }[] = [];
    for (const group of this.groupMonsterList) {
      for (const item of group.items) {
        const monsterLevel: number = item.level || 0;
        if (!monsterLevel) continue;
        if (item.mvp) continue; // exclude BOSS/MVP monsters
        if (!this.monsterDataMap[item.value]?.spawn) continue; // exclude monsters with no spawn location
        if (this.isExcludedSpawn(this.monsterDataMap[item.value]?.spawn)) continue; // exclude special instance spawns
        const diff = monsterLevel - playerLv;
        if (Math.abs(diff) > 15) continue; // exclude monsters too far in level
        const mod = getLevelDiffMod(diff);
        const sm = spotlightMap.get(item.value);
        const baseExp = sm
          ? sm.eventBaseExp
          : (this.monsterDataMap[item.value]?.stats?.baseExperience ?? 0);
        const extraFlags = sm ? { isSpotlight: true } : {};
        candidates.push({ item: { ...item, ...extraFlags }, score: baseExp * mod });
      }
    }
    // Include virtual spotlight-only monsters in candidates
    if (this.activeSpotlightEvent) {
      const dbIds = new Set(this.groupMonsterList.flatMap((g) => g.items.map((i) => i.value)));
      for (const sm of this.activeSpotlightEvent.monsters) {
        if (!dbIds.has(sm.monsterId) && sm.monsterLevel != null) {
          const diff = sm.monsterLevel - playerLv;
          if (Math.abs(diff) > 15) continue; // exclude monsters too far in level
          const mod = getLevelDiffMod(diff);
          candidates.push({
            item: {
              label: sm.monsterName,
              name: sm.monsterName,
              value: sm.monsterId,
              level: sm.monsterLevel,
              elementName: '—',
              raceName: '—',
              scaleName: '—',
              searchVal: sm.monsterName,
              isVirtualSpotlight: true,
            },
            score: sm.eventBaseExp * mod,
          });
        }
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    // Pick top 1 per unique spawn group → 5 monsters from different places
    const usedGroups = new Set<string>();
    const recItems: any[] = [];
    for (const c of candidates) {
      const groupKey = (c.item.groups?.[0] ?? c.item.searchVal ?? '').trim();
      if (usedGroups.has(groupKey)) continue;
      usedGroups.add(groupKey);
      recItems.push({ ...c.item, isRecommended: true, recScore: c.score });
      if (recItems.length >= 5) break;
    }
    // Already sorted highest score first
    if (recItems.length > 0) {
      groups.push({
        label: `🔵 Recommended for Lv.${playerLv}`,
        items: recItems,
      });
    }

    // --- Spotlight group ---
    if (this.activeSpotlightEvent && this.activeSpotlightEvent.monsters.length > 0) {
      const spotlightIds = new Set(this.activeSpotlightEvent.monsters.map((m) => m.monsterId));
      const spotlightItems: any[] = [];
      const foundIds = new Set<number>();

      for (const group of this.groupMonsterList) {
        for (const item of group.items) {
          if (spotlightIds.has(item.value)) {
            spotlightItems.push({ ...item, isSpotlight: true });
            foundIds.add(item.value);
          }
        }
      }
      for (const sm of this.activeSpotlightEvent.monsters) {
        if (!foundIds.has(sm.monsterId) && sm.monsterLevel != null) {
          spotlightItems.push({
            label: sm.monsterName,
            name: sm.monsterName,
            value: sm.monsterId,
            level: sm.monsterLevel,
            elementName: '—',
            raceName: '—',
            scaleName: '—',
            searchVal: sm.monsterName,
            isVirtualSpotlight: true,
          });
        }
      }
      spotlightItems.sort((a, b) => (a.level || 0) - (b.level || 0));
      if (spotlightItems.length > 0) {
        groups.push({
          label: '⭐ ' + this.activeSpotlightEvent.name,
          items: spotlightItems,
        });
      }
    }

    // Push normal groups with boss/MVP and no-spawn monsters removed
    for (const group of this.groupMonsterList) {
      const nonBossItems = group.items.filter(
        (item) => !item.mvp
          && !!this.monsterDataMap[item.value]?.spawn
          && !this.isExcludedSpawn(this.monsterDataMap[item.value]?.spawn)
      );
      if (nonBossItems.length > 0) {
        groups.push({ ...group, items: nonBossItems });
      }
    }
    return groups;
  }

  private makeVirtualMonster(sm: SpotlightMonster): MonsterModel {
    return {
      id: sm.monsterId,
      dbname: '',
      name: sm.monsterName,
      spawn: '',
      stats: {
        level: sm.monsterLevel ?? 0,
        baseExperience: sm.eventBaseExp,
        jobExperience: sm.eventJobExp,
        raceName: '—',
        scaleName: '—',
        elementName: '—',
      } as any,
    };
  }

  private readonly excludedSpawnPrefixes = ['1@'];

  private isExcludedSpawn(spawn: string): boolean {
    if (!spawn) return false;
    return this.excludedSpawnPrefixes.some((prefix) =>
      spawn.split(',').every((s) => s.trim().startsWith(prefix))
    );
  }

  formatExp(score: number): string {
    if (score >= 1_000_000) return (score / 1_000_000).toFixed(1) + 'M';
    if (score >= 1_000) return Math.round(score / 1_000) + 'k';
    return String(Math.round(score));
  }

  getLevelDiffLabel(diff: number): string {
    if (diff > 0) return `+${diff} (Monster above)`;
    if (diff < 0) return `${diff} (Monster below)`;
    return `0 (Equal)`;
  }

  getLevelDiffClass(diff: number): string {
    const mod = getLevelDiffMod(diff);
    if (mod >= 1.2) return 'diff-great';
    if (mod >= 1.0) return 'diff-good';
    if (mod >= 0.85) return 'diff-warn';
    return 'diff-bad';
  }

  private getManualMod(): number {
    switch (this.manualType) {
      case 'm50': return 0.50;
      case 'm55': return 0.55;
      case 'm100': return 1.00;
      case 'm200': return 2.00;
      default: return 0;
    }
  }

  private calculate(): void {
    const monster = this.selectedMonster;
    if (!monster) {
      this.result = null;
      return;
    }

    // Use spotlight event EXP if monster is in active spotlight
    const rawBaseExp = this.spotlightMonsterData?.eventBaseExp ?? monster.stats.baseExperience;
    const rawJobExp = this.spotlightMonsterData?.eventJobExp ?? monster.stats.jobExperience;

    const diff = this.levelDiff;
    const levelDiffMod = getLevelDiffMod(diff);

    const equipModPercent = this.effectiveEquipBonus;
    const mrkimModPercent = this.isMrKim ? 60 : 0;
    const malangCanModPercent = this.malangCanType === 'upgraded' ? 20 : this.malangCanType === 'normal' ? 10 : 0;
    const eventModPercent = this.eventExpPercent;
    const vipModPercent = this.isVip ? 50 : 0;
    const silvervineModPercent = this.isSilvervine ? 30 : 0;
    const satanMorrocModPercent = this.isSatanMorroc ? 10 : 0;
    const kafraModPercent = this.isKafraBuff ? 50 : 0;

    const equipMod = equipModPercent / 100;
    const mrkimMod = mrkimModPercent / 100;
    const malangCanMod = malangCanModPercent / 100;
    const eventMod = eventModPercent / 100;
    const vipMod = vipModPercent / 100;
    const silvervineMod = silvervineModPercent / 100;
    const satanMorrocMod = satanMorrocModPercent / 100;
    const kafraMod = kafraModPercent / 100;

    const baseManualMod = this.getManualMod();
    const vipBoost = this.isVip && baseManualMod > 0 ? 0.5 : 0;
    const manualMod = baseManualMod * (1 + vipBoost);
    const manualModPercent = Math.round(manualMod * 100);

    const factorA = 1 + equipMod + mrkimMod + malangCanMod;
    const factorB = 1 + eventMod + vipMod + silvervineMod + satanMorrocMod;

    // Formula: Orig × LvDiff × [(1 + Equip + MrKim + MalangCan) × (1 + Event + VIP + Silvervine + SatanMorroc) + Manual + Kafra] × Tap
    const totalBaseMod = factorA * factorB + manualMod + kafraMod;
    const jobManualMod = this.isJobManual ? (this.isVip ? 0.75 : 0.50) : 0;
    const totalJobMod = factorA * factorB + manualMod + kafraMod + jobManualMod;

    const finalBaseExp = Math.floor(rawBaseExp * levelDiffMod * totalBaseMod * this.tapMod);
    const finalJobExp = Math.floor(rawJobExp * levelDiffMod * totalJobMod * this.tapMod);

    this.result = {
      rawBaseExp,
      rawJobExp,
      finalBaseExp,
      finalJobExp,
      levelDiffMod,
      equipModPercent,
      mrkimModPercent,
      malangCanModPercent,
      eventModPercent,
      vipModPercent,
      silvervineModPercent,
      satanMorrocModPercent,
      kafraModPercent,
      manualModPercent,
      totalBaseMod,
      totalJobMod,
    };
  }
}
