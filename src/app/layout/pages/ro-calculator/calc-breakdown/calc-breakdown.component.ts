import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HighlightService } from './highlight.service';

export interface BreakdownStep {
  key: string;
  label: string;
  value: string;
  detail?: string;
  isHighlighted?: boolean;
}

@Component({
  selector: 'app-calc-breakdown',
  templateUrl: './calc-breakdown.component.html',
  styleUrls: ['./calc-breakdown.component.css'],
})
export class CalcBreakdownComponent implements OnInit, OnDestroy {
  @Input() totalSummary: any;
  @Input() breakdownData: any;
  @Input() model: any;
  @Input() isCalculating = false;

  steps: BreakdownStep[] = [];
  private sub: Subscription;

  constructor(public highlightService: HighlightService) {}

  ngOnInit() {
    this.sub = this.highlightService.state$.subscribe(() => {
      this.updateHighlights();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  ngOnChanges() {
    this.buildSteps();
    this.updateHighlights();
  }

  onStepMouseEnter(step: BreakdownStep) {
    this.highlightService.highlight('formula', step.key);
  }

  onStepMouseLeave() {
    this.highlightService.clear();
  }

  private updateHighlights() {
    for (const step of this.steps) {
      step.isHighlighted = this.highlightService.isFormulaHighlighted(step.key);
    }
  }

  private fmt(n: number | undefined | null, decimals = 0): string {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  private pct(n: number | undefined | null): string {
    return this.fmt(n) + '%';
  }

  private buildSteps() {
    const bd = this.breakdownData;
    const ts = this.totalSummary;
    if (!bd || !ts) {
      this.steps = [];
      return;
    }

    const isMagical = ts.calcSkill?.dmgType === 'Magical';
    const steps: BreakdownStep[] = [];

    // Step 1: Status ATK / MATK
    if (isMagical) {
      steps.push({
        key: 'statusAtk',
        label: 'Step 1: Status MATK',
        value: this.fmt(bd.statusMatk),
        detail: `floor(BaseLv/4 + INT + INT/2 + DEX/5 + LUK/3) + SPL×5`,
      });
    } else {
      steps.push({
        key: 'statusAtk',
        label: 'Step 1: Status ATK',
        value: this.fmt(bd.statusAtk),
        detail: `floor(BaseLv/4 + ${bd.weaponTypeName === 'bow' ? 'DEX' : 'STR'} + ... + LUK/3) + POW×5`,
      });
    }

    // Step 2: Weapon ATK / MATK
    if (isMagical) {
      steps.push({
        key: 'weaponAtk',
        label: 'Step 2: Weapon MATK',
        value: `${this.fmt(bd.weaponMinMatk)} ~ ${this.fmt(bd.weaponMaxMatk)}`,
        detail: `Base MATK + Refine(${this.fmt(bd.weaponRefine)}) + HighUpg(${this.fmt(bd.weaponHighUpgrade)}) ± Variance`,
      });
    } else {
      const minWeaAtk = bd.weaponBaseAtk - bd.weaponVariance;
      const maxWeaAtk = bd.weaponBaseAtk + bd.weaponVariance;
      steps.push({
        key: 'weaponAtk',
        label: 'Step 2: Weapon ATK',
        value: `${this.fmt(Math.max(0, minWeaAtk))} ~ ${this.fmt(maxWeaAtk)}`,
        detail: `Base(${this.fmt(bd.weaponBaseAtk)}) Lv${bd.weaponLevel} + Refine(${this.fmt(bd.weaponRefine)}) + Over(${this.fmt(bd.weaponOverUpgrade)}) ± Variance(${this.fmt(bd.weaponVariance, 1)})`,
      });
    }

    // Step 3: Extra ATK (Equipment)
    if (isMagical) {
      steps.push({
        key: 'extraAtk',
        label: 'Step 3: Equipment MATK',
        value: `+${this.fmt(bd.extraMatk)}`,
        detail: `From equipment & mastery`,
      });
    } else {
      steps.push({
        key: 'extraAtk',
        label: 'Step 3: Equipment ATK',
        value: `+${this.fmt(bd.extraAtkTotal)}`,
        detail: `Equip(${this.fmt(bd.equipAtk)}) + Ammo(${this.fmt(bd.ammoAtk)}) + Skill(${this.fmt(bd.skillAtk)}) + Striking(${this.fmt(bd.strikingAtk)})`,
      });
    }

    // Step 4: Mastery ATK
    if (!isMagical) {
      steps.push({
        key: 'masteryAtk',
        label: 'Step 4: Mastery ATK',
        value: `+${this.fmt(bd.masteryTotal)}`,
        detail: `Skill(${this.fmt(bd.masterySkillAtk)}) + Buff(${this.fmt(bd.masteryBuffAtk)}) + UI(${this.fmt(bd.masteryUi)}) + Hidden(${this.fmt(bd.masteryHidden)})`,
      });
    }

    // Step 5: ATK% / MATK%
    steps.push({
      key: 'atkPercent',
      label: isMagical ? 'Step 5: MATK%' : 'Step 5: ATK%',
      value: `×${this.pct(100 + (isMagical ? bd.matkPercent : bd.atkPercent))}`,
      detail: `Bonus: ${isMagical ? this.pct(bd.matkPercent) : this.pct(bd.atkPercent)}`,
    });

    // Step 6: Race / Size / Element / Class multipliers
    const raceM = isMagical ? bd.raceMultM : bd.raceMultP;
    const sizeM = isMagical ? bd.sizeMultM : bd.sizeMultP;
    const eleM = isMagical ? bd.elementMultM : bd.elementMultP;
    const clsM = isMagical ? bd.classMultM : bd.classMultP;
    steps.push({
      key: 'raceMul',
      label: 'Step 6: Race Bonus',
      value: `×${this.pct(raceM)}`,
      detail: `vs ${ts.monster?.race || '-'}`,
    });
    steps.push({
      key: 'sizeMul',
      label: 'Step 7: Size Bonus',
      value: `×${this.pct(sizeM)}`,
      detail: `vs ${ts.monster?.size || '-'}`,
    });
    steps.push({
      key: 'elementMul',
      label: 'Step 8: Element Bonus',
      value: `×${this.pct(eleM)}`,
      detail: `vs ${ts.monster?.element || '-'}`,
    });
    steps.push({
      key: 'classMul',
      label: 'Step 9: Class Bonus',
      value: `×${this.pct(clsM)}`,
      detail: `vs ${ts.monster?.type || '-'}`,
    });

    // Step 10: Property Multiplier
    steps.push({
      key: 'propertyMul',
      label: 'Step 10: Property Multiplier',
      value: `×${(bd.propertyMultiplier ?? 0).toFixed(2)}`,
      detail: `${ts.calcSkill?.propertySkill || ts.propertyAtk || '-'} → ${ts.monster?.elementName || '-'}`,
    });

    // Step 11: Size Penalty (physical only)
    if (!isMagical) {
      steps.push({
        key: 'sizePenalty',
        label: 'Step 11: Size Penalty',
        value: `${this.pct(bd.sizePenalty)}`,
        detail: `${bd.weaponTypeName} vs ${ts.monster?.size || '-'}`,
      });
    }

    // Step 12: Trait Bonus (P.ATK / S.MATK)
    if (isMagical) {
      steps.push({
        key: 'traitBonus',
        label: `Step ${isMagical ? 11 : 12}: S.MATK`,
        value: `+${this.fmt(bd.sMatk)}`,
        detail: `floor(SPL/3) + floor(CON/5) + equip`,
      });
    } else {
      steps.push({
        key: 'traitBonus',
        label: 'Step 12: P.ATK',
        value: `+${this.fmt(bd.pAtk)}`,
        detail: `floor(POW/3) + floor(CON/5) + equip`,
      });
    }

    // Step 13: DEF/MDEF Reduction
    steps.push({
      key: 'defReduction',
      label: isMagical ? `Step ${isMagical ? 12 : 13}: MDEF Reduction` : 'Step 13: DEF Reduction',
      value: isMagical
        ? `Hard(${this.fmt(bd.monsterMdef)}) / Soft(${ts.monster?.softMDef || 0})`
        : `Hard(${this.fmt(bd.monsterDef)}) / Soft(${this.fmt(bd.monsterSoftDef)})`,
      detail: isMagical
        ? `Pene: ${this.pct(bd.magicalPene)} | MRes Pene: ${this.pct(bd.peneMres)}`
        : `Pene: ${this.pct(bd.physicalPene)} | Res Pene: ${this.pct(bd.peneRes)}`,
    });

    // Step 14: Skill Damage
    if (ts.calcSkill?.baseSkillDamage) {
      steps.push({
        key: 'skillBonus',
        label: isMagical ? 'Step 13: Skill Damage' : 'Step 14: Skill Damage',
        value: `×${this.pct(ts.calcSkill.baseSkillDamage)}`,
        detail: `Bonus from equipment: +${this.pct(ts.dmg?.skillBonusFromEquipment || 0)}`,
      });
    }

    // Step 15: Range/Melee bonus (physical)
    if (!isMagical) {
      const isRange = ts.calcSkill?.dmgType === 'Range';
      steps.push({
        key: 'rangeMelee',
        label: 'Step 15: ' + (isRange ? 'Range%' : 'Melee%'),
        value: `×${this.pct((isRange ? bd.rangePercent : bd.meleePercent) + 100)}`,
        detail: `${isRange ? 'Range' : 'Melee'} damage: +${this.pct(isRange ? bd.rangePercent : bd.meleePercent)}`,
      });
    }

    // Step 16: Final Multipliers
    const allFinals = [...(bd.finalMultipliers || []), ...(isMagical ? bd.finalMagicMultipliers || [] : bd.finalPhyMultipliers || [])];
    if (allFinals.length > 0) {
      steps.push({
        key: 'finalMul',
        label: isMagical ? 'Step 14: Final Multipliers' : 'Step 16: Final Multipliers',
        value: allFinals.map((f: number) => `×${this.pct(f + 100)}`).join(' '),
        detail: `${allFinals.length} modifier(s) applied`,
      });
    }

    // Step 17: ASPD & DPS
    steps.push({
      key: 'aspd',
      label: 'ASPD / Hits per sec',
      value: `${ts.calc?.totalAspd || 0} / ${ts.calc?.hitPerSecs || 0} Hits/s`,
      detail: ts.calcSkill?.totalHitPerSec ? `Skill: ${ts.calcSkill.totalHitPerSec} Hits/s` : '',
    });

    // Final result
    if (ts.dmg?.skillMinDamage != null) {
      steps.push({
        key: 'result',
        label: '★ Final Damage',
        value: `${this.fmt(ts.dmg.skillMinDamage)} ~ ${this.fmt(ts.dmg.skillMaxDamage)}`,
        detail: `DPS: ${this.fmt(ts.dmg.skillDps)}` + (ts.calcSkill?.totalHits > 1 ? ` (×${ts.calcSkill.totalHits} hits)` : ''),
      });
    } else if (ts.dmg?.basicMinDamage != null) {
      steps.push({
        key: 'result',
        label: '★ Basic Damage',
        value: `${this.fmt(ts.dmg.basicMinDamage)} ~ ${this.fmt(ts.dmg.basicMaxDamage)}`,
        detail: `DPS: ${this.fmt(ts.dmg.basicDps)}`,
      });
    }

    this.steps = steps;
  }
}
