import '@angular/compiler'; // required: lets bun load the Angular component classes (verified 2026-09-25)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { RoCalculatorComponent } from '../src/app/layout/pages/ro-calculator/ro-calculator.component';
import { EquipmentComponent } from '../src/app/layout/pages/ro-calculator/equipment/equipment.component';
import { EquipmentShadowComponent } from '../src/app/layout/pages/ro-calculator/equipment-shadow/equipment-shadow.component';
import { Calculator } from '../src/app/layout/pages/ro-calculator/calculator';
import { getClassDropdownList } from '../src/app/jobs/_class-list';
import { createMainModel, createNumberDropdownList, toRawOptionTxtList } from '../src/app/utils';
import { ItemTypeId } from '../src/app/constants/item.const';
import { AllowLeftWeaponMapper } from '../src/app/constants/allow-left-weapon-mapper';

// Inputs come from the NEW repo so both sides compute from identical data.
const NEW = 'C:/Users/charg/ro-calculator2';
const OUT = join(NEW, 'tests/goldens/equipment');
const readJson = (p: string) => {
  const t = readFileSync(p, 'utf-8');
  return JSON.parse(t.charCodeAt(0) === 0xfeff ? t.slice(1) : t);
};
const items = readJson(join(NEW, 'data/source/item.json'));
const monsters = readJson(join(NEW, 'data/source/monster.json'));
const hpSpTable = readJson(join(NEW, 'data/source/hp_sp_table.json'));
const fx = readJson(join(OUT, 'fixtures.json'));

const LISTS = [
  'weaponList', 'leftWeaponList', 'weaponCardList', 'ammoList', 'headUpperList', 'headMiddleList', 'headLowerList',
  'headCardList', 'armorList', 'armorCardList', 'shieldList', 'shieldCardList', 'garmentList', 'garmentCardList',
  'bootList', 'bootCardList', 'accLeftList', 'accLeftCardList', 'accRightList', 'accRightCardList', 'petList',
  'costumeUpperList', 'costumeMiddleList', 'costumeLowerList', 'costumeGarmentList', 'costumeEnhUpperList',
  'costumeEnhUpper2List', 'costumeEnhMiddleList', 'costumeEnhLowerList', 'costumeEnhGarmentList',
  'costumeEnhGarment2List', 'costumeEnhGarment4List', 'shadowArmorList', 'shadowShieldList', 'shadowBootList',
  'shadowEarringList', 'shadowPendantList', 'shadowWeaponList',
];
const FILTERED = LISTS.filter((l) => !/Card|ammo|pet|costumeEnh/.test(l));

const classEntry = (id: number) => getClassDropdownList().find((c) => c.value === id)!;

/** A component instance with only the fields setItemList/setItemDropdownList touch. */
function roCalc() {
  const c: any = Object.create(RoCalculatorComponent.prototype);
  c.items = items;
  c.itemList = {};
  c.env = { production: true };
  c.onClassChangedSubject = { next() {} };
  // Object.create skips field initialisers; `enchants` (class field `= []`) is read by
  // setEquipableItems() (called from setItemDropdownList()) even though setItemList()/
  // setItemDropdownList() never assign it themselves.
  c.enchants = [];
  c.setItemList();
  return c;
}

// --- slot-lists.json
const base = roCalc();
const lists = Object.fromEntries(LISTS.map((l) => [l, base.itemList[l].map((o: any) => [o.value, o.label])]));
const byClass: Record<string, Record<string, number[]>> = {};
for (const id of [12, 2, 7, 5, 30]) {
  const c = roCalc();
  c.selectedCharacter = classEntry(id).instant;
  c.setItemDropdownList();
  byClass[id] = Object.fromEntries(FILTERED.map((l) => [l, c[l].map((o: any) => o.value)]));
}
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'slot-lists.json'), JSON.stringify({ lists, byClass }) + '\n');

// --- item-rules.json
// Built exactly as ro-calculator.component.ts builds mapEnchant (~line 765).
const mapEnchant = new Map(
  Object.values<any>(items).filter((i) => i.itemTypeId === ItemTypeId.ENCHANT).map((i) => [i.aegisName, i]),
);
// Object.create skips field initialisers, so every EventEmitter the components emit on is missing.
const stubEmitters = (o: any) => {
  for (const k of ['itemIdChange', 'itemRefineChange', 'itemGradeChange', 'gradeChange', 'selectItemChange',
    'card1IdChange', 'card2IdChange', 'card3IdChange', 'card4IdChange', 'enchant1IdChange', 'enchant2IdChange',
    'enchant3IdChange', 'enchant4IdChange', 'optionChange', 'optionValueChange', 'clearItemEvent']) o[k] = { emit() {} };
};
const rules = fx.ruleSamples.map(({ slot, itemId }: { slot: string; itemId: number }) => {
  const shadow = slot.startsWith('shadow');
  const e: any = Object.create((shadow ? EquipmentShadowComponent : EquipmentComponent).prototype);
  stubEmitters(e);
  Object.assign(e, { itemType: slot, items, mapEnchant, itemId, itemTypeMap: {},
    refineList: createNumberDropdownList({ from: 0, to: shadow ? 10 : 18 }) });
  e.onSelectItem('itemId', itemId, 0, false);
  const ids = (l: any[] | undefined) => (l ?? []).map((o) => o.value);
  return {
    slot, itemId,
    enchants: shadow ? [[], ids(e.enchant2List), ids(e.enchant3List), ids(e.enchant4List)]
      : [ids(e.enchant1List), ids(e.enchant2List), ids(e.enchant3List), ids(e.enchant4List)],
    gradeable: !shadow && (e.gradeList?.length ?? 0) > 0,
    cardSlots: shadow ? 0 : (e.totalCardSlots ?? 0),
    // Weapons: totalExtraOption is 3, plus the always-shown 4th select (equipment.component.html ~line 381).
    optionCount: shadow ? 1 : e.isWeapon ? 4 : (e.totalExtraOption ?? 0),
    refineMax: e.refineList.length ? e.refineList.at(-1).value : 0,
  };
});
writeFileSync(join(OUT, 'item-rules.json'), JSON.stringify(rules, null, 2) + '\n');

// --- slot-rules.json
function calcFor(classId: number, equip: Record<string, unknown>) {
  const calc = new Calculator();
  calc.setMasterItems(items).setHpSpTable(hpSpTable).setClass(classEntry(classId).instant);
  const model: any = { ...createMainModel(), class: classId, ...equip };
  calc.setModel(model);
  calc.loadItemFromModel(model);
  return { calc, model };
}
const slotRules = fx.slotRuleCases.map(({ classId, weaponId }: { classId: number; weaponId: number | null }) => {
  const { calc } = calcFor(classId, weaponId ? { weapon: weaponId } : {});
  const c = roCalc();
  c.calculator = calc;
  c.setAmmoDropdownList();
  const allowShield = calc.isAllowShield();
  return {
    classId, weaponId,
    allowAmmo: !!calc.isAllowAmmo(),
    allowShield,
    // showLeftWeapon (component ~line 500) AND the template's `!model.weapon` guard.
    allowLeftWeapon: !!(AllowLeftWeaponMapper as any)[classEntry(classId).instant.className] && !!weaponId && allowShield,
    ammoIds: c.ammoList.map((o: any) => o.value),
  };
});
writeFileSync(join(OUT, 'slot-rules.json'), JSON.stringify(slotRules, null, 2) + '\n');

// --- equipped damage snapshots: mirrors ro-calculator.component.ts prepare() (non-compare branch)
// with no skills, consumables or buffs, i.e. what the new calculate() does.
const getOptionScripts = (RoCalculatorComponent.prototype as any).getOptionScripts;
for (const s of fx.equipped) {
  const entry = classEntry(s.classId);
  const model: any = createMainModel();
  Object.assign(model, { class: s.classId, level: s.level, jobLevel: s.jobLevel }, s.stats, s.traits, s.equipment);
  // As the old app's setJobBonus (ro-calculator.component.ts:2021-2036, run on load and on every job change).
  const { str, agi, vit, int, dex, luk, pow, sta, wis, spl, con, crt } = entry.instant.getJobBonusStatus(s.jobLevel);
  Object.assign(model, {
    jobStr: str, jobAgi: agi, jobVit: vit, jobInt: int, jobDex: dex, jobLuk: luk,
    jobPow: pow, jobSta: sta, jobWis: wis, jobSpl: spl, jobCon: con, jobCrt: crt,
  });
  for (const [slot, g] of Object.entries(s.grades)) model[`${slot}Grade`] = g;
  model.selectedAtkSkill = s.selectedAtkSkill;
  model.rawOptionTxts = [...s.options];
  model.rawOptionTxts = toRawOptionTxtList(model, items);

  const { equipAtks, masteryAtks, activeSkillNames, learnedSkillMap } = entry.instant
    .setLearnSkills({ activeSkillIds: [], passiveSkillIds: [] })
    .getSkillBonusAndName();
  const calc = new Calculator();
  calc.setMasterItems(items).setHpSpTable(hpSpTable).setClass(entry.instant);
  calc.setModel(model);
  calc.loadItemFromModel(model);
  calc
    .setMonster(monsters[s.monsterId])
    .setEquipAtkSkillAtk(equipAtks)
    .setBuffBonus({ masteryAtk: {}, equipAtk: {} })
    .setMasterySkillAtk(masteryAtks)
    .setConsumables([])
    .setAspdPotion(0)
    .setExtraOptions(getOptionScripts.call(null, model.rawOptionTxts))
    .setUsedSkillNames(activeSkillNames)
    .setLearnedSkills(learnedSkillMap)
    .setOffensiveSkill(s.selectedAtkSkill)
    .prepareAllItemBonus()
    .calcAllAtk()
    .setSelectedChances([])
    .calcAllDefs()
    .calculateHpSp({ isUseHpL: false })
    .calculateAllDamages(s.selectedAtkSkill);
  writeFileSync(join(NEW, `tests/snapshots/equipped-${s.name}.snap.json`), JSON.stringify(calc.getTotalSummary(), null, 2) + '\n');
  console.log(`wrote equipped-${s.name}.snap.json`);
}
