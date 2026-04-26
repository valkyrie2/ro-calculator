export interface MonsterModel {
  id: number;
  dbname: string;
  name: string;
  spawn: string;
  stats: Stats;
  /**
   * When true, this monster is hidden from non-premium users. Only admins
   * and users with a non-expired premium grant see it in monster dropdowns.
   */
  isPremium?: boolean;
  /**
   * ISO timestamp. Monsters with a future `releaseDate` are hidden from
   * regular users (admins and active-premium users see them, marked as
   * upcoming). Once the date passes, the monster is visible to everyone
   * and the upcoming marker disappears automatically.
   */
  releaseDate?: string;
}

export interface Stats {
  attackRange: number;
  level: number;
  health: number;
  sp: number;
  str: number;
  int: number;
  vit: number;
  dex: number;
  agi: number;
  luk: number;
  rechargeTime: number;
  atk1: number;
  atk2: number;
  attack: Attack;
  magicAttack: MagicAttack;
  defense: number;
  baseExperience: number;
  jobExperience: number;
  aggroRange: number;
  escapeRange: number;
  movementSpeed: number;
  attackSpeed: number;
  attackedSpeed: number;
  element: number;
  elementName: string;
  elementShortName: string;
  scale: number;
  scaleName: string;
  race: number;
  raceName: string;
  magicDefense: number;
  hit: number;
  flee: number;
  ai: string;
  mvp: number;
  class: number;
  attr: number;
  res: number;
  mres: number;
  dmgtaken: number;
}

export interface Attack {
  minimum: number;
  maximum: number;
}

export interface MagicAttack {
  minimum: number;
  maximum: number;
}
