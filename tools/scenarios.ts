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
];
