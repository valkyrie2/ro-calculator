import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Observable, Subscription, take, tap } from 'rxjs';
import { AuthService, PresetModel, PresetService } from 'src/app/api-services';
import { ClassIcon } from 'src/app/jobs';
import { JobBuffs } from 'src/app/constants';
import { toRawOptionTxtList, floor } from 'src/app/utils';
import { getClassDropdownList } from 'src/app/jobs/_class-list';
import { Calculator } from '../calculator';
import { ItemModel } from 'src/app/models/item.model';
import { MonsterModel } from 'src/app/models/monster.model';
import { HpSpTable } from 'src/app/models/hp-sp-table.model';
import { DropdownModel } from 'src/app/models/dropdown.model';
import { SelectItemGroup } from 'primeng/api';
import { CharacterBase, AtkSkillModel } from 'src/app/jobs';

interface MonsterSelectItemGroup extends SelectItemGroup {
  items: any[];
}

interface PresetOption {
  label: string;
  value: string;
  icon: number;
  model?: PresetModel;
  source: 'cloud' | 'local';
}

interface SideSummary {
  className: string;
  classIcon: number;
  presetLabel: string;
  selectedAtkSkill: string;
  skillLabel: string;
  totalSummary: any;
  atkSkills: AtkSkillModel[];
  model: any;
}

const Characters = getClassDropdownList();
const skillBuffs = JobBuffs;

@Component({
  selector: 'app-dps-compare',
  templateUrl: './dps-compare.component.html',
  styleUrls: ['./dps-compare.component.scss'],
})
export class DpsCompareComponent implements OnInit, OnDestroy, OnChanges {
  @Input() items: Record<number, ItemModel>;
  @Input() monsterDataMap: Record<number, MonsterModel>;
  @Input() hpSpTable: HpSpTable;
  @Input() groupMonsterList: MonsterSelectItemGroup[];
  @Input() monsterList: DropdownModel[];
  @Input() presetUpdated$: Observable<void>;

  presetOptions: PresetOption[] = [];
  isLoading = false;

  // Side A
  selectedPresetA: string;
  sideA: SideSummary | null = null;
  selectedSkillA: string;

  // Side B
  selectedPresetB: string;
  sideB: SideSummary | null = null;
  selectedSkillB: string;

  // Shared
  selectedMonster = Number(localStorage.getItem('monster')) || 21067;

  isLoggedIn = false;
  private subs: Subscription[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly presetService: PresetService,
  ) {}

  ngOnInit() {
    const sub = this.authService.loggedInEvent$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      this.loadPresetOptions();
    });
    this.subs.push(sub);

    if (this.presetUpdated$) {
      const presetSub = this.presetUpdated$.subscribe(() => this.loadPresetOptions());
      this.subs.push(presetSub);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['presetUpdated$'] && !changes['presetUpdated$'].firstChange) {
      // Re-subscribe if the observable reference changes
      if (this.presetUpdated$) {
        const presetSub = this.presetUpdated$.subscribe(() => this.loadPresetOptions());
        this.subs.push(presetSub);
      }
    }
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  loadPresetOptions() {
    const options: PresetOption[] = [];

    // Local presets
    const localPresets = JSON.parse(localStorage.getItem('presets') || '[]') || [];
    if (Array.isArray(localPresets)) {
      for (const p of localPresets) {
        options.push({
          label: `[Local] ${p.label || p.value}`,
          value: `local::${p.value}`,
          icon: ClassIcon[p.model?.class],
          model: p.model,
          source: 'local',
        });
      }
    }

    if (this.isLoggedIn) {
      this.isLoading = true;
      this.presetService
        .getEntirePresets()
        .pipe(
          take(1),
          tap((presets) => {
            for (const p of presets) {
              options.push({
                label: p.label,
                value: `cloud::${p.id}`,
                icon: ClassIcon[p.model?.class],
                model: p.model,
                source: 'cloud',
              });
            }
            this.presetOptions = options;
            this.isLoading = false;
          }),
        )
        .subscribe();
    } else {
      this.presetOptions = options;
    }
  }

  onPresetChange(side: 'A' | 'B') {
    const key = side === 'A' ? this.selectedPresetA : this.selectedPresetB;
    const preset = this.presetOptions.find((p) => p.value === key);
    if (!preset?.model) return;

    const model = preset.model;
    const charEntry = Characters.find((c) => c.value === model.class);
    const character = (charEntry?.instant || Characters[0].instant) as CharacterBase;
    const atkSkills = character.atkSkills || [];
    const selectedAtkSkill = model.selectedAtkSkill || atkSkills[0]?.value;

    const skillLabel = this.getSkillLabel(selectedAtkSkill);

    const summary: SideSummary = {
      className: charEntry?.label || 'Unknown',
      classIcon: Number(charEntry?.icon || charEntry?.value || 0),
      presetLabel: preset.label,
      selectedAtkSkill,
      skillLabel,
      totalSummary: null,
      atkSkills,
      model,
    };

    if (side === 'A') {
      this.sideA = summary;
      this.selectedSkillA = selectedAtkSkill;
    } else {
      this.sideB = summary;
      this.selectedSkillB = selectedAtkSkill;
    }
  }

  onSkillChange(side: 'A' | 'B') {
    const summary = side === 'A' ? this.sideA : this.sideB;
    const skill = side === 'A' ? this.selectedSkillA : this.selectedSkillB;
    if (summary) {
      summary.selectedAtkSkill = skill;
      summary.skillLabel = this.getSkillLabel(skill);
    }
  }

  compare() {
    if (!this.sideA || !this.sideB) return;

    const presetA = this.presetOptions.find((p) => p.value === this.selectedPresetA);
    const presetB = this.presetOptions.find((p) => p.value === this.selectedPresetB);
    if (!presetA?.model || !presetB?.model) return;

    this.sideA.totalSummary = this.runCalculation(presetA.model, this.selectedSkillA);
    this.sideB.totalSummary = this.runCalculation(presetB.model, this.selectedSkillB);
  }

  private runCalculation(model: PresetModel, selectedAtkSkill: string): any {
    const calc = new Calculator();
    calc.setMasterItems(this.items).setHpSpTable(this.hpSpTable);

    const charEntry = Characters.find((c) => c.value === model.class);
    const character = (charEntry?.instant || Characters[0].instant) as CharacterBase;

    const { activeSkills, passiveSkills } = model;
    const { equipAtks, masteryAtks, activeSkillNames, learnedSkillMap } = character
      .setLearnSkills({
        activeSkillIds: activeSkills || [],
        passiveSkillIds: passiveSkills || [],
      })
      .getSkillBonusAndName();

    const { consumables, consumables2, aspdPotion, aspdPotions } = model;
    const usedSupBattlePill = (consumables || []).includes(12792);
    const usedHpL = (consumables || []).includes(12424);
    const consumeData = [...(consumables || []), ...(consumables2 || []), ...(aspdPotions || [])]
      .filter(Boolean)
      .filter((id) => !usedSupBattlePill || (usedSupBattlePill && id !== 12791))
      .map((id) => this.items[id]?.script)
      .filter(Boolean);

    const buffEquips = {};
    const buffMasterys = {};
    skillBuffs.forEach((skillBuff, i) => {
      const buffVal = (model.skillBuffs || [])[i];
      const buff = skillBuff.dropdown.find((a) => a.value === buffVal);
      if (buff?.isUse && !activeSkillNames.has(skillBuff.name)) {
        if ((skillBuff as any).isMasteryAtk) {
          buffMasterys[skillBuff.name] = buff.bonus;
        } else {
          buffEquips[skillBuff.name] = buff.bonus;
        }
      }
    });

    const modelCopy = { ...model } as any;
    modelCopy.rawOptionTxts = toRawOptionTxtList(modelCopy, this.items);

    calc
      .setClass(character)
      .loadItemFromModel(modelCopy)
      .setMonster(this.monsterDataMap[this.selectedMonster])
      .setEquipAtkSkillAtk(equipAtks)
      .setBuffBonus({ masteryAtk: buffMasterys, equipAtk: buffEquips })
      .setMasterySkillAtk(masteryAtks)
      .setConsumables(consumeData)
      .setAspdPotion(aspdPotion || 0)
      .setExtraOptions(this.getOptionScripts(modelCopy.rawOptionTxts))
      .setUsedSkillNames(activeSkillNames)
      .setLearnedSkills(learnedSkillMap)
      .setOffensiveSkill(selectedAtkSkill)
      .prepareAllItemBonus()
      .calcAllAtk()
      .setSelectedChances([])
      .calcAllDefs()
      .calculateHpSp({ isUseHpL: usedHpL })
      .calculateAllDamages(selectedAtkSkill);

    return calc.getTotalSummary();
  }

  private getOptionScripts(rawOptionTxts: any[]): Record<string, number>[] {
    return (rawOptionTxts || [])
      .map((a) => {
        if (typeof a !== 'string' || a === '') return '';
        const match = a.match(/(.+):(\d+)/);
        if (match) {
          const [, attr, value] = match;
          return { [attr]: Number(value) };
        }
        return '';
      })
      .filter(Boolean) as Record<string, number>[];
  }

  private getSkillLabel(skillValue: string): string {
    if (!skillValue) return '-';
    const [name, level] = skillValue.split('==');
    return level ? `${name} Lv.${level}` : name;
  }

  get monsterName(): string {
    return this.monsterDataMap?.[this.selectedMonster]?.name || '';
  }

  get hasComparison(): boolean {
    return !!(this.sideA?.totalSummary && this.sideB?.totalSummary);
  }

  get comparisons(): { label: string; diffValue: number; diffPercent: string; diffClass: string; prefix: string }[] {
    if (!this.hasComparison) return [];

    const a = this.sideA.totalSummary;
    const b = this.sideB.totalSummary;

    const items: { label: string; valA: number; valB: number }[] = [];

    // Skill Damage (average)
    const skillAvgA = ((a.dmg?.skillMinDamage || 0) + (a.dmg?.skillMaxDamage || 0)) / 2 * (a.calcSkill?.totalHits || 1);
    const skillAvgB = ((b.dmg?.skillMinDamage || 0) + (b.dmg?.skillMaxDamage || 0)) / 2 * (b.calcSkill?.totalHits || 1);
    items.push({ label: a.dmg?.skillDamageLabel || 'SkillDmg', valA: skillAvgA, valB: skillAvgB });

    // Skill DPS
    items.push({ label: 'Skill DPS', valA: a.dmg?.skillDps || 0, valB: b.dmg?.skillDps || 0 });

    // Basic DPS
    items.push({ label: 'Basic DPS', valA: a.dmg?.basicDps || 0, valB: b.dmg?.basicDps || 0 });

    return items.map(({ label, valA, valB }) => {
      const diff = valB - valA;
      const pct = valA !== 0 ? (diff / valA) * 100 : 0;
      const isPositive = diff > 0;
      const isNegative = diff < 0;

      return {
        label,
        diffValue: Math.round(diff),
        diffPercent: `${isPositive ? '+' : ''}${floor(pct, 1)}%`,
        diffClass: isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-color-secondary',
        prefix: isPositive ? '+' : '',
      };
    });
  }
}
