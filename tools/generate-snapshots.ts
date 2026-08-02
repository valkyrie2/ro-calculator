import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Calculator } from '../src/app/layout/pages/ro-calculator/calculator';
import { getClassDropdownList } from '../src/app/jobs/_class-list';
import { createMainModel } from '../src/app/utils';
import { SCENARIOS, ScenarioFixture } from './scenarios';

const DATA = 'src/assets/demo/data';
const BOM_RE = new RegExp('^' + String.fromCharCode(0xfeff));
const readJson = (f: string) =>
  JSON.parse(readFileSync(join(DATA, f), 'utf-8').replace(BOM_RE, ''));

const items = readJson('item.json');
const monsters = readJson('monster.json');
const hpSpTable = readJson('hp_sp_table.json');

export function runScenario(s: ScenarioFixture) {
  const classEntry = getClassDropdownList().find((c) => c.value === s.classId);
  if (!classEntry) throw new Error(`classId ${s.classId} not found`);

  const model: any = createMainModel();
  model.class = s.classId;
  model.level = s.level;
  model.jobLevel = s.jobLevel;
  Object.assign(model, s.stats, s.traits ?? {});
  for (const [slot, id] of Object.entries(s.equipment)) model[slot] = id;
  for (const [slot, r] of Object.entries(s.refines)) model[`${slot}Refine`] = r;
  model.selectedAtkSkill = s.selectedAtkSkill;

  // The character instance tracks its own `bonuses` (activeSkillNames/learnedSkillMap/etc,
  // read internally by job classes via isSkillActive()/learnLv()), populated only by
  // getSkillBonusAndName(). In production this is always called from
  // ro-calculator.component.ts:865-869 before the Calculator chain runs; skipping it leaves
  // `bonuses` undefined and crashes the first job formula that calls isSkillActive() (e.g.
  // RuneKnight.setAdditionalBonus). This scenario harness has no UI-driven active/passive
  // skill dropdowns, so we run it with empty selections -- the offensive skill itself flows
  // through setOffensiveSkill/calculateAllDamages below, not through this path.
  classEntry.instant
    .setLearnSkills({
      activeSkillIds: s.activeSkillIds ?? [],
      passiveSkillIds: s.passiveSkillIds ?? [],
    })
    .getSkillBonusAndName();

  const calc = new Calculator();
  calc.setMasterItems(items).setHpSpTable(hpSpTable).setClass(classEntry.instant);
  calc.setModel(model);
  calc.loadItemFromModel(model);

  // Mirrors the production call order at
  // src/app/layout/pages/ro-calculator/ro-calculator.component.ts:1010-1029
  calc
    .setMonster(monsters[s.monsterId])
    .setEquipAtkSkillAtk({})
    .setBuffBonus({ masteryAtk: {}, equipAtk: {} })
    .setMasterySkillAtk({})
    .setConsumables([])
    .setAspdPotion(s.aspdPotion)
    .setExtraOptions([])
    .setUsedSkillNames(new Set(s.activeSkillNames))
    .setLearnedSkills(new Map(s.learnedSkills))
    .setOffensiveSkill(s.selectedAtkSkill)
    .prepareAllItemBonus()
    .calcAllAtk()
    .setSelectedChances([])
    .calcAllDefs()
    .calculateHpSp({ isUseHpL: s.isUseHpL })
    .calculateAllDamages(s.selectedAtkSkill);

  return calc.getTotalSummary();
}

mkdirSync('tools/__snapshots__', { recursive: true });
for (const s of SCENARIOS) {
  const out = runScenario(s);
  writeFileSync(`tools/__snapshots__/${s.name}.snap.json`, JSON.stringify(out, null, 2) + '\n', 'utf-8');
  console.log(`wrote ${s.name}.snap.json`);
}
