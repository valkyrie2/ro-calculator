import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AdminService, RoService } from 'src/app/api-services';
import { logger } from 'src/app/api-services/logger.service';
import { ElementType } from 'src/app/constants/element-type.const';
import { RaceType } from 'src/app/constants/race-type.const';
import { MonsterModel } from 'src/app/models/monster.model';

interface MonsterFormModel {
  id: number | null;
  name: string;
  level: number | null;
  element: ElementType | null;
  elementLevel: number | null;
  race: RaceType | null;
  scale: 'Small' | 'Medium' | 'Large' | null;
  health: number | null;
  defense: number | null;
  magicDefense: number | null;
  res: number | null;
  mres: number | null;
  baseExperience: number | null;
  jobExperience: number | null;
}

const ELEMENT_NUMERIC: Record<ElementType, number> = {
  [ElementType.Neutral]: 0,
  [ElementType.Water]: 1,
  [ElementType.Earth]: 2,
  [ElementType.Fire]: 3,
  [ElementType.Wind]: 4,
  [ElementType.Poison]: 5,
  [ElementType.Holy]: 6,
  [ElementType.Dark]: 7,
  [ElementType.Ghost]: 8,
  [ElementType.Undead]: 9,
};

const RACE_NUMERIC: Record<RaceType, number> = {
  [RaceType.Formless]: 0,
  [RaceType.Undead]: 1,
  [RaceType.Brute]: 2,
  [RaceType.Plant]: 3,
  [RaceType.Insect]: 4,
  [RaceType.Fish]: 5,
  [RaceType.Demon]: 6,
  [RaceType.DemiHuman]: 7,
  [RaceType.Angel]: 8,
  [RaceType.Dragon]: 9,
};

const SCALE_NUMERIC = { Small: 0, Medium: 1, Large: 2 } as const;

/**
 * Custom monsters live in a high numeric range so they never collide with
 * data ingested from rAthena/Divine-Pride sources, even if those sources
 * grow new IDs over time.
 */
const CUSTOM_ID_FLOOR = 9_000_001;

@Component({
  selector: 'app-admin-add-monster',
  templateUrl: './admin-add-monster.component.html',
})
export class AdminAddMonsterComponent implements OnInit {
  /**
   * The example data the user supplied. Used as input placeholders so the
   * admin sees a worked-out reference row without the form pre-filling
   * (which would otherwise bias every new entry).
   */
  readonly placeholder = {
    name: 'Bio Dark Pinguicula',
    level: '240',
    elementLevel: '3',
    health: '81679820',
    defense: '198',
    magicDefense: '222',
    res: '919',
    mres: '1511',
    baseExperience: '2519017',
    jobExperience: '1861388',
  };

  form: MonsterFormModel = this.emptyForm();

  imageFile: File | null = null;
  imagePreview: string | null = null;
  saving = false;
  loadingId = true;

  elementOptions = Object.values(ElementType).map((v) => ({ label: v, value: v }));
  raceOptions = Object.values(RaceType).map((v) => ({ label: v, value: v }));
  scaleOptions = (['Small', 'Medium', 'Large'] as const).map((v) => ({ label: v, value: v }));
  elementLevelOptions = [1, 2, 3, 4].map((v) => ({ label: String(v), value: v }));

  constructor(
    private readonly adminService: AdminService,
    private readonly roService: RoService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit() {
    this.refreshNextId();
  }

  /**
   * Fetch the merged monster map (static JSON ∪ custom rows) and pick an
   * unused id at or above CUSTOM_ID_FLOOR. We re-run this after each save
   * so consecutive submissions get distinct ids.
   */
  async refreshNextId() {
    this.loadingId = true;
    try {
      const monsters = await firstValueFrom(
        this.roService.getMonsters<Record<number, MonsterModel>>(),
      );
      let next = CUSTOM_ID_FLOOR;
      for (const key of Object.keys(monsters)) {
        const id = Number(key);
        if (Number.isFinite(id) && id >= CUSTOM_ID_FLOOR && id >= next) {
          next = id + 1;
        }
      }
      this.form.id = next;
    } catch (err) {
      logger.error({ refreshNextId: err });
      this.form.id = CUSTOM_ID_FLOOR;
    } finally {
      this.loadingId = false;
    }
  }

  onImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imageFile = file;
    this.imagePreview = file ? URL.createObjectURL(file) : null;
  }

  /**
   * Build a MonsterModel that matches the shape of `assets/demo/data/monster.json`
   * so it slots into the calculator's existing pipeline (`Monster.toCalcInput`
   * etc.) without any special-casing.
   */
  private buildMonster(): MonsterModel {
    const f = this.form;
    if (f.id == null) throw new Error('Monster ID is required.');
    if (!f.name.trim()) throw new Error('Name is required.');
    if (f.level == null) throw new Error('Level is required.');
    if (f.health == null) throw new Error('HP is required.');
    if (!f.element) throw new Error('Element is required.');
    if (f.elementLevel == null) throw new Error('Element Level is required.');
    if (!f.race) throw new Error('Race is required.');
    if (!f.scale) throw new Error('Size is required.');

    const elementName = `${f.element} ${f.elementLevel}`;
    const elementShortName = f.element;
    const raceName = f.race;
    const scaleName = f.scale;

    return {
      id: f.id,
      dbname: f.name.toUpperCase().replace(/\s+/g, '_'),
      name: f.name,
      spawn: 'custom',
      stats: {
        attackRange: 1,
        level: f.level,
        health: f.health,
        sp: 1,
        str: 1,
        int: 1,
        vit: 1,
        dex: 1,
        agi: 1,
        luk: 1,
        rechargeTime: 0,
        atk1: 0,
        atk2: 0,
        attack: { minimum: 0, maximum: 0 },
        magicAttack: { minimum: 0, maximum: 0 },
        defense: f.defense ?? 0,
        baseExperience: f.baseExperience ?? 0,
        jobExperience: f.jobExperience ?? 0,
        aggroRange: 0,
        escapeRange: 0,
        movementSpeed: 0,
        attackSpeed: 0,
        attackedSpeed: 0,
        // rAthena-style packed element value: low nibble = element, high
        // nibble = level. The calculator only reads elementName + element
        // ShortName, but we keep the numeric for parity with monster.json.
        element: ELEMENT_NUMERIC[f.element] + (f.elementLevel << 4),
        scale: SCALE_NUMERIC[f.scale],
        race: RACE_NUMERIC[f.race],
        magicDefense: f.magicDefense ?? 0,
        hit: 0,
        flee: 0,
        ai: 'MONSTER_TYPE_19',
        mvp: 0,
        class: 0,
        attr: 0,
        res: f.res ?? 0,
        mres: f.mres ?? 0,
        elementName,
        elementShortName,
        scaleName,
        raceName,
        dmgtaken: 100,
      },
    };
  }

  async save() {
    this.saving = true;
    try {
      const monster = this.buildMonster();
      await this.adminService.addMonster(monster, this.imageFile);
      this.messageService.add({
        severity: 'success',
        summary: `Saved monster ${monster.id}`,
        detail: monster.name,
      });
      // Reset form + bump id by 1 so consecutive submissions stay unique.
      // RoService caches its merged monster map via shareReplay so
      // re-fetching wouldn't surface the row we just inserted; bumping
      // off the just-saved id is both correct and avoids that staleness.
      const nextId = monster.id + 1;
      this.form = this.emptyForm();
      this.form.id = nextId;
      this.imageFile = null;
      this.imagePreview = null;
    } catch (err: any) {
      logger.error({ saveMonster: err });
      this.messageService.add({ severity: 'error', summary: 'Save failed', detail: err?.message });
    } finally {
      this.saving = false;
    }
  }

  private emptyForm(): MonsterFormModel {
    return {
      id: null,
      name: '',
      level: null,
      element: null,
      elementLevel: null,
      race: null,
      scale: null,
      health: null,
      defense: null,
      magicDefense: null,
      res: null,
      mres: null,
      baseExperience: null,
      jobExperience: null,
    };
  }
}
