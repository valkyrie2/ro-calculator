import { Component, EventEmitter, Output } from '@angular/core';
import { SelectItemGroup } from 'primeng/api';

export interface CustomBonusRow {
  attr: string;
  value: number;
}

const BONUS_GROUPS: SelectItemGroup[] = [
  {
    label: 'Offensive',
    items: [
      { label: 'ATK', value: 'atk' },
      { label: 'ATK %', value: 'atkPercent' },
      { label: 'MATK', value: 'matk' },
      { label: 'MATK %', value: 'matkPercent' },
      { label: 'Melee %', value: 'melee' },
      { label: 'Long Range %', value: 'range' },
      { label: 'CRI Damage %', value: 'criDmg' },
      { label: 'Hit Damage %', value: 'hitDmg' },
      { label: 'Flat Damage', value: 'flatDmg' },
      { label: 'Damage %', value: 'dmg' },
    ],
  },
  {
    label: 'Stats',
    items: [
      { label: 'STR', value: 'str' },
      { label: 'AGI', value: 'agi' },
      { label: 'VIT', value: 'vit' },
      { label: 'INT', value: 'int' },
      { label: 'DEX', value: 'dex' },
      { label: 'LUK', value: 'luk' },
      { label: 'All Stats', value: 'allStatus' },
    ],
  },
  {
    label: 'Trait Stats',
    items: [
      { label: 'POW', value: 'pow' },
      { label: 'STA', value: 'sta' },
      { label: 'WIS', value: 'wis' },
      { label: 'SPL', value: 'spl' },
      { label: 'CON', value: 'con' },
      { label: 'CRT', value: 'crt' },
      { label: 'P.ATK', value: 'pAtk' },
      { label: 'S.MATK', value: 'sMatk' },
      { label: 'C.Rate', value: 'cRate' },
      { label: 'H.PLUS', value: 'hplus' },
      { label: 'All Trait', value: 'allTrait' },
    ],
  },
  {
    label: 'Speed / Accuracy',
    items: [
      { label: 'ASPD', value: 'aspd' },
      { label: 'ASPD %', value: 'aspdPercent' },
      { label: 'CRI Rate', value: 'cri' },
      { label: 'HIT', value: 'hit' },
      { label: 'FLEE', value: 'flee' },
      { label: 'Perfect HIT', value: 'perfectHit' },
      { label: 'Perfect Dodge', value: 'perfectDodge' },
      { label: 'VCT %', value: 'vct' },
      { label: 'FCT %', value: 'fct' },
      { label: 'After Cast Delay %', value: 'acd' },
    ],
  },
  {
    label: 'Defense',
    items: [
      { label: 'DEF', value: 'def' },
      { label: 'DEF %', value: 'defPercent' },
      { label: 'MDEF', value: 'mdef' },
      { label: 'MDEF %', value: 'mdefPercent' },
      { label: 'Soft DEF', value: 'softDef' },
      { label: 'Soft MDEF', value: 'softMdef' },
      { label: 'RES', value: 'res' },
      { label: 'MRES', value: 'mres' },
    ],
  },
  {
    label: 'HP / SP',
    items: [
      { label: 'HP', value: 'hp' },
      { label: 'HP %', value: 'hpPercent' },
      { label: 'SP', value: 'sp' },
      { label: 'SP %', value: 'spPercent' },
    ],
  },
  {
    label: 'P. Size %',
    items: [
      { label: 'P. Size All', value: 'p_size_all' },
      { label: 'P. Size Small', value: 'p_size_s' },
      { label: 'P. Size Medium', value: 'p_size_m' },
      { label: 'P. Size Large', value: 'p_size_l' },
    ],
  },
  {
    label: 'P. Race %',
    items: [
      { label: 'P. Race All', value: 'p_race_all' },
      { label: 'P. Race Formless', value: 'p_race_formless' },
      { label: 'P. Race Undead', value: 'p_race_undead' },
      { label: 'P. Race Brute', value: 'p_race_brute' },
      { label: 'P. Race Plant', value: 'p_race_plant' },
      { label: 'P. Race Insect', value: 'p_race_insect' },
      { label: 'P. Race Fish', value: 'p_race_fish' },
      { label: 'P. Race Demon', value: 'p_race_demon' },
      { label: 'P. Race DemiHuman', value: 'p_race_demihuman' },
      { label: 'P. Race Angel', value: 'p_race_angel' },
      { label: 'P. Race Dragon', value: 'p_race_dragon' },
    ],
  },
  {
    label: 'P. Element %',
    items: [
      { label: 'P. Element All', value: 'p_element_all' },
      { label: 'P. Element Neutral', value: 'p_element_neutral' },
      { label: 'P. Element Water', value: 'p_element_water' },
      { label: 'P. Element Earth', value: 'p_element_earth' },
      { label: 'P. Element Fire', value: 'p_element_fire' },
      { label: 'P. Element Wind', value: 'p_element_wind' },
      { label: 'P. Element Poison', value: 'p_element_poison' },
      { label: 'P. Element Holy', value: 'p_element_holy' },
      { label: 'P. Element Dark', value: 'p_element_dark' },
      { label: 'P. Element Ghost', value: 'p_element_ghost' },
      { label: 'P. Element Undead', value: 'p_element_undead' },
    ],
  },
  {
    label: 'P. Class %',
    items: [
      { label: 'P. Class All', value: 'p_class_all' },
      { label: 'P. Class Normal', value: 'p_class_normal' },
      { label: 'P. Class Boss', value: 'p_class_boss' },
    ],
  },
  {
    label: 'P. Final %',
    items: [
      { label: 'P. Final Damage %', value: 'p_final' },
      { label: 'Ignore Size Penalty', value: 'ignore_size_penalty' },
    ],
  },
  {
    label: 'M. Size %',
    items: [
      { label: 'M. Size All', value: 'm_size_all' },
      { label: 'M. Size Small', value: 'm_size_s' },
      { label: 'M. Size Medium', value: 'm_size_m' },
      { label: 'M. Size Large', value: 'm_size_l' },
    ],
  },
  {
    label: 'M. Race %',
    items: [
      { label: 'M. Race All', value: 'm_race_all' },
      { label: 'M. Race Formless', value: 'm_race_formless' },
      { label: 'M. Race Undead', value: 'm_race_undead' },
      { label: 'M. Race Brute', value: 'm_race_brute' },
      { label: 'M. Race Plant', value: 'm_race_plant' },
      { label: 'M. Race Insect', value: 'm_race_insect' },
      { label: 'M. Race Fish', value: 'm_race_fish' },
      { label: 'M. Race Demon', value: 'm_race_demon' },
      { label: 'M. Race DemiHuman', value: 'm_race_demihuman' },
      { label: 'M. Race Angel', value: 'm_race_angel' },
      { label: 'M. Race Dragon', value: 'm_race_dragon' },
    ],
  },
  {
    label: 'M. Element %',
    items: [
      { label: 'M. Element All', value: 'm_element_all' },
      { label: 'M. Element Neutral', value: 'm_element_neutral' },
      { label: 'M. Element Water', value: 'm_element_water' },
      { label: 'M. Element Earth', value: 'm_element_earth' },
      { label: 'M. Element Fire', value: 'm_element_fire' },
      { label: 'M. Element Wind', value: 'm_element_wind' },
      { label: 'M. Element Poison', value: 'm_element_poison' },
      { label: 'M. Element Holy', value: 'm_element_holy' },
      { label: 'M. Element Dark', value: 'm_element_dark' },
      { label: 'M. Element Ghost', value: 'm_element_ghost' },
      { label: 'M. Element Undead', value: 'm_element_undead' },
    ],
  },
  {
    label: 'M. Class %',
    items: [
      { label: 'M. Class All', value: 'm_class_all' },
      { label: 'M. Class Normal', value: 'm_class_normal' },
      { label: 'M. Class Boss', value: 'm_class_boss' },
    ],
  },
  {
    label: 'M. Final %',
    items: [
      { label: 'M. Final Damage %', value: 'm_final' },
    ],
  },
  {
    label: 'P. Penetration %',
    items: [
      { label: 'P. Pene Race All', value: 'p_pene_race_all' },
      { label: 'P. Pene Race Formless', value: 'p_pene_race_formless' },
      { label: 'P. Pene Race Undead', value: 'p_pene_race_undead' },
      { label: 'P. Pene Race Brute', value: 'p_pene_race_brute' },
      { label: 'P. Pene Race Plant', value: 'p_pene_race_plant' },
      { label: 'P. Pene Race Insect', value: 'p_pene_race_insect' },
      { label: 'P. Pene Race Fish', value: 'p_pene_race_fish' },
      { label: 'P. Pene Race Demon', value: 'p_pene_race_demon' },
      { label: 'P. Pene Race DemiHuman', value: 'p_pene_race_demihuman' },
      { label: 'P. Pene Race Angel', value: 'p_pene_race_angel' },
      { label: 'P. Pene Race Dragon', value: 'p_pene_race_dragon' },
      { label: 'P. Pene Class All', value: 'p_pene_class_all' },
      { label: 'P. Pene Class Normal', value: 'p_pene_class_normal' },
      { label: 'P. Pene Class Boss', value: 'p_pene_class_boss' },
    ],
  },
  {
    label: 'M. Penetration %',
    items: [
      { label: 'M. Pene Race All', value: 'm_pene_race_all' },
      { label: 'M. Pene Race Formless', value: 'm_pene_race_formless' },
      { label: 'M. Pene Race Undead', value: 'm_pene_race_undead' },
      { label: 'M. Pene Race Brute', value: 'm_pene_race_brute' },
      { label: 'M. Pene Race Plant', value: 'm_pene_race_plant' },
      { label: 'M. Pene Race Insect', value: 'm_pene_race_insect' },
      { label: 'M. Pene Race Fish', value: 'm_pene_race_fish' },
      { label: 'M. Pene Race Demon', value: 'm_pene_race_demon' },
      { label: 'M. Pene Race DemiHuman', value: 'm_pene_race_demihuman' },
      { label: 'M. Pene Race Angel', value: 'm_pene_race_angel' },
      { label: 'M. Pene Race Dragon', value: 'm_pene_race_dragon' },
      { label: 'M. Pene Class All', value: 'm_pene_class_all' },
      { label: 'M. Pene Class Normal', value: 'm_pene_class_normal' },
      { label: 'M. Pene Class Boss', value: 'm_pene_class_boss' },
    ],
  },
  {
    label: 'RES/MRES Penetration %',
    items: [
      { label: 'Pene RES', value: 'pene_res' },
      { label: 'Pene MRES', value: 'pene_mres' },
    ],
  },
];

@Component({
  selector: 'app-custom-bonus',
  templateUrl: './custom-bonus.component.html',
  styleUrls: ['./custom-bonus.component.css'],
})
export class CustomBonusComponent {
  @Output() bonusChange = new EventEmitter<CustomBonusRow[]>();

  bonusGroups = BONUS_GROUPS;
  rows: CustomBonusRow[] = [];

  addRow() {
    this.rows = [...this.rows, { attr: '', value: 0 }];
  }

  removeRow(index: number) {
    this.rows = this.rows.filter((_, i) => i !== index);
    this.emitChange();
  }

  clearAll() {
    this.rows = [];
    this.emitChange();
  }

  onRowChange() {
    this.emitChange();
  }

  trackByIndex(index: number) {
    return index;
  }

  private emitChange() {
    this.bonusChange.emit(this.rows.filter((r) => r.attr && r.value !== 0));
  }
}
