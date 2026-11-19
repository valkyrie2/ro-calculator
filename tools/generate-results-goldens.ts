import '@angular/compiler';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RoCalculatorComponent } from '../src/app/layout/pages/ro-calculator/ro-calculator.component';
import { CalcBreakdownComponent } from '../src/app/layout/pages/ro-calculator/calc-breakdown/calc-breakdown.component';
import { Calculator } from '../src/app/layout/pages/ro-calculator/calculator';
import { getClassDropdownList } from '../src/app/jobs/_class-list';
import { createMainModel } from '../src/app/utils';
import { ItemTypeId } from '../src/app/constants/item.const';
import { JobBuffs } from '../src/app/constants/job-buffs';
import { FoodStatList } from '../src/app/constants/food-stat-list';
import { AspdPotionList2, extrabuff } from '../src/app/constants/aspd-potion-list';

const NEW = 'C:/Users/charg/ro-calculator2';
const readJson = (p: string) => {
  const t = readFileSync(p, 'utf-8');
  return JSON.parse(t.charCodeAt(0) === 0xfeff ? t.slice(1) : t);
};
const items = readJson(join(NEW, 'data/source/item.json'));
const monsters = readJson(join(NEW, 'data/source/monster.json'));
const hpSpTable = readJson(join(NEW, 'data/source/hp_sp_table.json'));
const classEntry = (id: number) => getClassDropdownList().find((c) => c.value === id)!;
const off = (s: any) => s.dropdown.find((o: any) => !o.isUse)?.value ?? 0;
const STACK = new Set([...AspdPotionList2, ...extrabuff].map((o: any) => o.value));
const prepare = (RoCalculatorComponent.prototype as any).prepare;
const getOptionScripts = (RoCalculatorComponent.prototype as any).getOptionScripts;

function stubFor(classId: number, model: any, monsterId: number, chances: string[] = []) {
  const c: any = Object.create(RoCalculatorComponent.prototype);
  Object.assign(c, {
    model, items, selectedCharacter: classEntry(classId).instant, skillBuffs: JobBuffs,
    monsterDataMap: monsters, selectedMonster: monsterId, customBonuses: [], customItemScript: null,
    customCardId: null, selectedChances: chances, compareItemNames: undefined, getOptionScripts,
  });
  return c;
}

/** The new Build v4 fields, turned into the old model's shape (consumables / consumables2 / aspdPotions split). */
function toOldModel(b: any, engine: { active: Record<string, number>; passive: Record<string, number> }) {
  const inst = classEntry(b.classId).instant;
  const model: any = createMainModel();
  Object.assign(model, { class: b.classId, level: b.level, jobLevel: b.jobLevel }, b.stats, b.traits, b.equipment);
  // As the old app's setJobBonus (ro-calculator.component.ts:2021-2036, run on load and on every job change).
  const { str, agi, vit, int, dex, luk, pow, sta, wis, spl, con, crt } = inst.getJobBonusStatus(b.jobLevel);
  Object.assign(model, {
    jobStr: str, jobAgi: agi, jobVit: vit, jobInt: int, jobDex: dex, jobLuk: luk,
    jobPow: pow, jobSta: sta, jobWis: wis, jobSpl: spl, jobCon: con, jobCrt: crt,
  });
  for (const [slot, g] of Object.entries(b.grades)) model[`${slot}Grade`] = g;
  model.selectedAtkSkill = b.selectedAtkSkill;
  model.rawOptionTxts = [...b.options];
  model.propertyAtk = b.elementConverter;
  model.activeSkills = inst.activeSkills.map((s: any) => engine.active[s.name] ?? off(s));
  model.passiveSkills = inst.passiveSkills.map((s: any) => engine.passive[s.name] ?? off(s));
  model.consumables = b.consumables.filter((id: number) => items[id]?.itemTypeId === ItemTypeId.CONSUMABLE);
  model.consumables2 = FoodStatList.map((g: any[]) => b.consumables.find((id: number) => g.some((o) => o.value === id)));
  model.aspdPotions = b.consumables.filter((id: number) => STACK.has(id));
  model.aspdPotion = b.aspdPotion;
  model.skillBuffs = JobBuffs.map((j: any) => b.partyBuffs[j.name] ?? 0);
  return model;
}

function run(b: any, engine: any) {
  const model = toOldModel(b, engine);
  const calc = new Calculator();
  calc.setMasterItems(items).setHpSpTable(hpSpTable).setClass(classEntry(b.classId).instant);
  calc.setModel(model);
  return prepare.call(stubFor(b.classId, model, b.monsterId, b.chances ?? []), calc);
}

// Harness check: the same path must reproduce an existing 2b snapshot exactly, or nothing below is trusted.
// Compared with CRLF normalised to LF on both sides: this checkout has core.autocrlf=true, so the
// committed snapshot reads back with \r\n while a freshly written string here has \n; that is a
// checkout artifact, not a content difference (git stores/diffs it as identical either way).
const norm = (s: string) => s.replace(/\r\n/g, '\n');
const harnessEq = readJson(join(NEW, 'tests/goldens/equipment/fixtures.json')).equipped.find((s: any) => s.name === 'rune-knight-geared');
const check = JSON.stringify(run({ ...harnessEq, partyBuffs: {}, consumables: [], aspdPotion: 0 }, { active: {}, passive: {} }).getTotalSummary(), null, 2) + '\n';
if (norm(check) !== norm(readFileSync(join(NEW, 'tests/snapshots/equipped-rune-knight-geared.snap.json'), 'utf-8'))) {
  throw new Error('harness does not reproduce equipped-rune-knight-geared; fix the stub before trusting any output');
}

const J = (x: unknown) => JSON.parse(JSON.stringify(x));

function tablesFor(total: any) {
  const c: any = Object.create(RoCalculatorComponent.prototype);
  c.totalSummary = total;
  c.setElementTable(); c.setRaceTable(); c.setSizeTable(); c.setMonsterTypeTable(); c.setAtkTypeTable(); c.setSkillTable();
  return J({ element: c.elementTable, race: c.raceTable, size: c.sizeTable, class: c.classTable, atkType: c.atkTypeTable,
    skillMultiplier: c.skillMultiplierTable, peneRace: c.peneRaceTable, peneClass: c.peneClassTable });
}

function stepsFor(breakdown: any, total: any) {
  const c: any = Object.create(CalcBreakdownComponent.prototype);
  c.breakdownData = breakdown; c.totalSummary = total; c.steps = [];
  c.buildSteps();
  return J(c.steps);
}

const eq = readJson(join(NEW, 'tests/goldens/equipment/fixtures.json')).equipped
  .map((s: any) => ({ name: `equipped-${s.name}`, build: { ...s, partyBuffs: {}, consumables: [], aspdPotion: 0, chances: [] }, engine: { active: {}, passive: {} } }));
const bf = readJson(join(NEW, 'tests/goldens/buffs/fixtures.json')).scenarios
  .map((s: any) => ({ name: `buffs-${s.name}`, build: { ...s.build, chances: [] }, engine: s.engine }));
const rs = readJson(join(NEW, 'tests/goldens/results/fixtures.json')).scenarios
  .map((s: any) => ({ ...s, name: `results-${s.name}` }));

const out = [...eq, ...bf, ...rs].map((s: any) => {
  const calc = run(s.build, s.engine);
  const total = J(calc.getTotalSummary());
  const breakdown = J(calc.getBreakdownData());
  if (s.name.startsWith('results-')) {
    writeFileSync(join(NEW, `tests/snapshots/${s.name}.snap.json`), JSON.stringify(calc.getTotalSummary(), null, 2) + '\n');
  }
  return {
    name: s.name, total, breakdown,
    chanceList: calc.chanceList.map((c: any) => ({ name: c.name, label: c.label, label2: c.label2 })),
    tables: tablesFor(total), steps: stepsFor(breakdown, total),
  };
});
writeFileSync(join(NEW, 'tests/goldens/results/results.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${out.length} entries to tests/goldens/results/results.json`);
