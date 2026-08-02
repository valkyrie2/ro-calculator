export interface ScenarioFixture {
  name: string;
  classId: number; // matches getClassDropdownList() value
  level: number;
  jobLevel: number;
  stats: { str: number; agi: number; vit: number; int: number; dex: number; luk: number };
  traits?: { pow: number; sta: number; wis: number; spl: number; con: number; crt: number };
  monsterId: number;
  equipment: Record<string, number>; // itemTypeName -> itemId
  refines: Record<string, number>; // itemTypeName -> refine level
  learnedSkills: [string, number][]; // skill name -> level
  activeSkillNames: string[];
  selectedAtkSkill: string; // e.g. 'Hundred Spears==10'
  aspdPotion: number;
  isUseHpL: boolean;
  /**
   * Passed to CharacterBase.setLearnSkills before the Calculator chain runs. Both default to
   * `[]` (via `?? []` in generate-snapshots.ts) so existing fixtures are unaffected.
   *
   * THESE ARE NOT SKILL IDS OR LIST INDICES INTO A FLAT LOOKUP -- verified by reading
   * setLearnSkills/getSkillBonusAndName in src/app/jobs/_character-base.abstract.ts:
   * each array is *positionally* aligned to the class's own `activeSkills`/`passiveSkills`
   * getters (CharacterBase._activeSkillList / _passiveSkillList, built up by successive
   * `inheritSkills()` calls through the job's inheritance chain, base class first). Element
   * `i` of the array is matched against `dropdown.value` on the skill at index `i` of that
   * same list (`skill.dropdown.find(x => x.value === activeSkillIds[i])`) -- so the value at
   * each position is whatever that particular skill's dropdown uses to mean "selected" (an
   * "on" sentinel like 5 or 1 for selectButton-type skills, or a literal skill level 1-10 for
   * dropdown/level-type ones), not a global skill ID. A short array is safe: unset trailing
   * indices resolve to `undefined`, which matches no dropdown entry and is treated as "off".
   */
  activeSkillIds?: number[];
  passiveSkillIds?: number[];
}

// Priority jobs from $OLD/CONTEXT.md: RuneKnight, Ranger, ArchBishop.
// Class IDs verified against src/app/jobs/_class-list.ts (getClassDropdownList()).
//
// selectedAtkSkill values verified against the actual job files (not assumed from the
// task brief, which had one wrong name):
//   - RuneKnight: brief suggested 'Hundred Spear==10'. The real skill, defined in
//     src/app/jobs/RuneKnight.ts, is named 'Hundred Spears' (plural) -- confirmed also
//     in src/app/constants/skill-name.ts and src/app/layout/app.topbar.component.ts.
//     Using 'Hundred Spears==10'.
//   - Ranger: 'Arrow Storm==10' confirmed present (not commented out) in
//     src/app/jobs/Ranger.ts.
//   - ArchBishop: 'Adoramus==10' confirmed present (not commented out) in
//     src/app/jobs/ArchBishop.ts. Note there is a second, distinct entry
//     '[Improved] Adoramus Ancilla==10' for the Ancilla-buffed variant -- not used here.
//
// Equipment IDs must exist in item.json -- verify each before committing. These scenarios
// start bare (no equipment) to exercise the full damage pipeline without needing to vet
// specific item IDs; equipment can be added in a follow-up scenario once the port is proven.
export const SCENARIOS: ScenarioFixture[] = [
  {
    name: 'rune-knight-hundred-spear',
    classId: 12,
    level: 200, jobLevel: 70,
    stats: { str: 130, agi: 90, vit: 100, int: 1, dex: 110, luk: 40 },
    monsterId: 1634,
    equipment: {}, refines: {},
    learnedSkills: [['Hundred Spears', 10]],
    activeSkillNames: [],
    selectedAtkSkill: 'Hundred Spears==10',
    aspdPotion: 0,
    isUseHpL: false,
  },
  {
    name: 'ranger-arrow-storm',
    classId: 2,
    level: 200, jobLevel: 70,
    stats: { str: 1, agi: 120, vit: 90, int: 60, dex: 130, luk: 40 },
    monsterId: 1634,
    equipment: {}, refines: {},
    learnedSkills: [['Arrow Storm', 10]],
    activeSkillNames: [],
    selectedAtkSkill: 'Arrow Storm==10',
    aspdPotion: 0,
    isUseHpL: false,
  },
  {
    name: 'arch-bishop-adoramus',
    classId: 7,
    level: 200, jobLevel: 70,
    stats: { str: 1, agi: 60, vit: 90, int: 130, dex: 120, luk: 40 },
    monsterId: 1634,
    equipment: {}, refines: {},
    learnedSkills: [['Adoramus', 10]],
    activeSkillNames: [],
    selectedAtkSkill: 'Adoramus==10',
    aspdPotion: 0,
    isUseHpL: false,
  },
  // Task 3b: identical twin of `rune-knight-hundred-spear` above, except this one actually
  // learns/activates the skills that gate an entire tier of RuneKnight job-bonus code (Rune
  // Mastery, Dragon Training, Ride Dragon, Aura Blade) which the empty-selections baseline
  // above never touches. Positions verified by reading RuneKnight.ts / LordKnight.ts /
  // Swordman.ts and walking the `inheritSkills()` push order (Swordman's own list first,
  // then LordKnight's Hi-class list, then RuneKnight's 3rd-job list -- each `inheritSkills`
  // call appends to the same `_activeSkillList`/`_passiveSkillList` arrays):
  //
  // _activeSkillList (index: name, dropdown "on" value):
  //   0 Skill Version, 1 Magnum Break (Swordman) | 2 Two hand Quicken, 3 Aura Blade (=5),
  //   4 Spear Dynamo (LordKnight Hi) | 5 Enchant Blade, 6 Ride Dragon (=5), 7 Current HP,
  //   8 Turisus Runestone, 9 Lux Anima Runestone, 10 Asir Runestone (=1) (RuneKnight 3rd)
  //
  // _passiveSkillList (index: name, level chosen):
  //   0 Sword Mastery, 1 Two-Handed Sword Mastery, 2 Bash, 3 Increase HP Recovery (Swordman)
  //   | 4 Spear Mastery, 5 Cavalier Mastery, 6 Two hand Quicken, 7 Clashing Spiral
  //   (LordKnight Hi) | 8 Ignition Break, 9 Dragon Training (=3), 10 Dragon Breath,
  //   11 Dragon Breath - WATER, 12 Rune Mastery (=10) (RuneKnight 3rd)
  //
  // Asir Runestone is included even though Step 3 named only Rune Mastery/Dragon
  // Training/Ride Dragon/Aura Blade: `learnLv('Rune Mastery')` (RuneKnight.ts:527) has
  // exactly one consumer in the whole codebase, and it is inside
  // `if (this.isSkillActive('Asir Runestone'))` -- with no weapon equipped and no items
  // (this fixture has none), Rune Mastery is otherwise a dead value with zero effect on any
  // output number, so Asir Runestone is required, not optional, for that gate's coverage to
  // be real. Lux Anima Runestone is deliberately left off: its only job-bonus-gated code
  // (RuneKnight.ts's `calcPostSkillDamgeDragonBreath` element selection) is reachable solely
  // through the Dragon Breath skill family, which this fixture's fixed
  // `selectedAtkSkill: 'Hundred Spears==10'` never casts -- selecting it here would add a
  // false coverage claim, not real coverage.
  //
  // Turisus Runestone IS included (fix round, generate-snapshots.ts): its `bonus` object
  // (`{ flatBasicDmg: 250, str: 30, melee: 15 }`, none of them `atk`/`matk`) has nothing to do
  // with the Dragon Breath element-selection logic above -- it's a plain equip-sourced skill
  // bonus, merged generically in calculator.ts's `equipAtkSkillBonus` loop (~1189-1213), which
  // only surfaces at all once the harness forwards `getSkillBonusAndName()`'s `equipAtks`
  // return value into `setEquipAtkSkillAtk` instead of discarding it. Cheap to add and
  // exercises a second, independent bonus-merge path (equip-sourced, non-atk attrs) alongside
  // Asir Runestone's (mastery-sourced, atk-only, read via damage-calculator.ts's
  // `getMasteryAtk()`).
  {
    name: 'rune-knight-hundred-spears-buffed',
    classId: 12,
    level: 200, jobLevel: 70,
    stats: { str: 130, agi: 90, vit: 100, int: 1, dex: 110, luk: 40 },
    monsterId: 1634,
    equipment: {}, refines: {},
    learnedSkills: [['Hundred Spears', 10]],
    activeSkillNames: [],
    // index: 0  1  2  3  4  5  6  7  8  9 10
    activeSkillIds:  [0, 0, 0, 5, 0, 0, 5, 0, 1, 0, 1], // 3=Aura Blade, 6=Ride Dragon, 8=Turisus Runestone, 10=Asir Runestone
    // index: 0  1  2  3  4  5  6  7  8  9  10 11 12
    passiveSkillIds: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 10], // 9=Dragon Training Lv3, 12=Rune Mastery Lv10
    selectedAtkSkill: 'Hundred Spears==10',
    aspdPotion: 0,
    isUseHpL: false,
  },
];
