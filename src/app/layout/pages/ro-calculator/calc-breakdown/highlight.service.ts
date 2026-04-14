import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type HighlightSource = 'equipment' | 'formula';

export interface HighlightState {
  source: HighlightSource;
  key: string;
}

/**
 * Maps equipment slots to the formula steps they affect.
 * Maps formula steps to the equipment slots that contribute.
 */
const EQUIPMENT_TO_FORMULA: Record<string, string[]> = {
  weapon: ['statusAtk', 'weaponAtk', 'sizePenalty', 'propertyMul', 'aspd', 'extraAtk'],
  leftWeapon: ['statusAtk', 'weaponAtk', 'aspd'],
  ammo: ['extraAtk', 'propertyMul'],
  headUpper: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul', 'skillBonus', 'finalMul', 'defReduction'],
  headMiddle: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul', 'skillBonus'],
  headLower: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul', 'skillBonus'],
  shield: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul'],
  armor: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul', 'skillBonus'],
  garment: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul', 'skillBonus'],
  boot: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul', 'skillBonus'],
  accLeft: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul', 'skillBonus'],
  accRight: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul', 'skillBonus'],
  pet: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul'],
  costumeUpper: ['extraAtk', 'atkPercent'],
  costumeMiddle: ['extraAtk', 'atkPercent'],
  costumeLower: ['extraAtk', 'atkPercent'],
  costumeGarment: ['extraAtk', 'atkPercent'],
  shadowWeapon: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul'],
  shadowArmor: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul'],
  shadowShield: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul'],
  shadowBoot: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul'],
  shadowEarring: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul'],
  shadowPendant: ['extraAtk', 'atkPercent', 'raceMul', 'sizeMul', 'elementMul', 'classMul'],
};

const FORMULA_TO_EQUIPMENT: Record<string, string[]> = {};

// Build reverse mapping
for (const [equip, formulas] of Object.entries(EQUIPMENT_TO_FORMULA)) {
  for (const formula of formulas) {
    if (!FORMULA_TO_EQUIPMENT[formula]) {
      FORMULA_TO_EQUIPMENT[formula] = [];
    }
    if (!FORMULA_TO_EQUIPMENT[formula].includes(equip)) {
      FORMULA_TO_EQUIPMENT[formula].push(equip);
    }
  }
}

@Injectable()
export class HighlightService {
  private readonly _state$ = new BehaviorSubject<HighlightState | null>(null);
  readonly state$ = this._state$.asObservable();

  highlight(source: HighlightSource, key: string) {
    this._state$.next({ source, key });
  }

  clear() {
    this._state$.next(null);
  }

  /** Given a formula step key, return equipment slots that contribute */
  getEquipmentForFormula(formulaKey: string): string[] {
    return FORMULA_TO_EQUIPMENT[formulaKey] || [];
  }

  /** Given an equipment slot, return formula steps it affects */
  getFormulasForEquipment(equipKey: string): string[] {
    return EQUIPMENT_TO_FORMULA[equipKey] || [];
  }

  /** Check if a formula step should be highlighted based on current state */
  isFormulaHighlighted(formulaKey: string): boolean {
    const state = this._state$.value;
    if (!state) return false;

    if (state.source === 'formula' && state.key === formulaKey) return true;
    if (state.source === 'equipment') {
      return (EQUIPMENT_TO_FORMULA[state.key] || []).includes(formulaKey);
    }
    return false;
  }

  /** Check if an equipment slot should be highlighted based on current state */
  isEquipmentHighlighted(equipKey: string): boolean {
    const state = this._state$.value;
    if (!state) return false;

    if (state.source === 'equipment' && state.key === equipKey) return true;
    if (state.source === 'formula') {
      return (FORMULA_TO_EQUIPMENT[state.key] || []).includes(equipKey);
    }
    return false;
  }
}
