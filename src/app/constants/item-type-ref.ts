/**
 * Master reference data for itemTypeId and itemSubTypeId.
 * Source of truth: item.const.ts, item-sub-type.enum.ts, weapon-type-mapper.ts
 */

// ---------------------------------------------------------------------------
// itemTypeId  (field: ItemModel.itemTypeId)
// ---------------------------------------------------------------------------

export const ITEM_TYPE_ID_TABLE: {
  id: number;
  name: string;
  description: string;
}[] = [
  { id: 1,  name: 'Weapon',     description: 'Weapons (all weapon sub-types)' },
  { id: 2,  name: 'Armor',      description: 'Armor, headgear, garment, footwear, accessories, shadow gear' },
  { id: 3,  name: 'Consumable', description: 'Usable / consumable items' },
  { id: 4,  name: 'Ammo',       description: 'Ammunition (arrows, bullets, cannonballs, kunai)' },
  { id: 5,  name: 'Etc',        description: 'Miscellaneous / etc items' },
  { id: 6,  name: 'Card',       description: 'Cards' },
  { id: 11, name: 'Enchant',    description: 'Enchant stones / enchant items' },
];

// ---------------------------------------------------------------------------
// itemSubTypeId  (field: ItemModel.itemSubTypeId)
// Grouped by parent itemTypeId where applicable.
// ---------------------------------------------------------------------------

export const ITEM_SUB_TYPE_ID_TABLE: {
  id: number;
  name: string;
  parentTypeId: number | null;
  description: string;
}[] = [
  // ── Enchant / generic ────────────────────────────────────────────────────
  { id: 0,    name: 'Enchant',            parentTypeId: 11, description: 'Enchant stone / enchant item' },

  // ── Weapons (itemTypeId = 1) ─────────────────────────────────────────────
  { id: 256,  name: 'Dagger',             parentTypeId: 1,  description: 'Dagger' },
  { id: 257,  name: 'Sword',              parentTypeId: 1,  description: 'One-Handed Sword' },
  { id: 258,  name: 'Two-Handed Sword',   parentTypeId: 1,  description: 'Two-Handed Sword' },
  { id: 259,  name: 'Spear',              parentTypeId: 1,  description: 'One-Handed Spear' },
  { id: 260,  name: 'Two-Handed Spear',   parentTypeId: 1,  description: 'Two-Handed Spear' },
  { id: 261,  name: 'Axe',               parentTypeId: 1,  description: 'One-Handed Axe' },
  { id: 262,  name: 'Two-Handed Axe',    parentTypeId: 1,  description: 'Two-Handed Axe' },
  { id: 263,  name: 'Mace',              parentTypeId: 1,  description: 'One-Handed Mace' },
  { id: 264,  name: 'Two-Handed Mace',   parentTypeId: 1,  description: 'Two-Handed Mace' },
  { id: 265,  name: 'Rod',               parentTypeId: 1,  description: 'One-Handed Rod / Staff' },
  { id: 266,  name: 'Two-Handed Rod',    parentTypeId: 1,  description: 'Two-Handed Rod / Staff' },
  { id: 267,  name: 'Bow',               parentTypeId: 1,  description: 'Bow' },
  { id: 268,  name: 'Fistweapon',        parentTypeId: 1,  description: 'Fist weapon / Knuckle' },
  { id: 269,  name: 'Instrument',        parentTypeId: 1,  description: 'Instrument (Bard)' },
  { id: 270,  name: 'Whip',              parentTypeId: 1,  description: 'Whip (Dancer)' },
  { id: 271,  name: 'Book',              parentTypeId: 1,  description: 'Book' },
  { id: 272,  name: 'Katar',             parentTypeId: 1,  description: 'Katar (Assassin)' },
  { id: 273,  name: 'Revolver',          parentTypeId: 1,  description: 'Revolver (Gunslinger)' },
  { id: 274,  name: 'Rifle',             parentTypeId: 1,  description: 'Rifle (Gunslinger)' },
  { id: 275,  name: 'Gatling Gun',       parentTypeId: 1,  description: 'Gatling Gun (Gunslinger)' },
  { id: 276,  name: 'Shotgun',           parentTypeId: 1,  description: 'Shotgun (Gunslinger)' },
  { id: 277,  name: 'Grenade Launcher',  parentTypeId: 1,  description: 'Grenade Launcher (Gunslinger)' },
  { id: 278,  name: 'Shuriken',          parentTypeId: 1,  description: 'Shuriken / Huuma Shuriken (Ninja)' },

  // ── Shadow Weapon (itemTypeId = 2, shadow sub-set) ───────────────────────
  { id: 280,  name: 'ShadowWeapon',      parentTypeId: 2,  description: 'Shadow Weapon' },

  // ── Accessories (itemTypeId = 2) ─────────────────────────────────────────
  { id: 510,  name: 'Acc_R',             parentTypeId: 2,  description: 'Accessory – Right slot' },
  { id: 511,  name: 'Acc_L',             parentTypeId: 2,  description: 'Accessory – Left slot' },

  // ── Armor slots (itemTypeId = 2) ─────────────────────────────────────────
  { id: 512,  name: 'Upper',             parentTypeId: 2,  description: 'Headgear – Upper' },
  { id: 513,  name: 'Armor',             parentTypeId: 2,  description: 'Body Armor' },
  { id: 514,  name: 'Shield',            parentTypeId: 2,  description: 'Shield' },
  { id: 515,  name: 'Garment',           parentTypeId: 2,  description: 'Garment / Manteau' },
  { id: 516,  name: 'Boot',              parentTypeId: 2,  description: 'Footwear / Boot' },
  { id: 517,  name: 'Acc',              parentTypeId: 2,  description: 'Accessory – generic (both slots)' },
  { id: 518,  name: 'Pet',              parentTypeId: 2,  description: 'Pet equipment' },

  // ── Costume (itemTypeId = 2) ─────────────────────────────────────────────
  { id: 519,  name: 'CostumeUpper',      parentTypeId: 2,  description: 'Costume – Upper' },
  { id: 520,  name: 'CostumeMiddle',     parentTypeId: 2,  description: 'Costume – Middle' },
  { id: 521,  name: 'CostumeLower',      parentTypeId: 2,  description: 'Costume – Lower' },
  { id: 522,  name: 'CostumeGarment',    parentTypeId: 2,  description: 'Costume – Garment' },

  // ── Shadow Gear (itemTypeId = 2) ─────────────────────────────────────────
  { id: 526,  name: 'ShadowArmor',       parentTypeId: 2,  description: 'Shadow Armor' },
  { id: 527,  name: 'ShadowShield',      parentTypeId: 2,  description: 'Shadow Shield' },
  { id: 528,  name: 'ShadowBoot',        parentTypeId: 2,  description: 'Shadow Boot' },
  { id: 529,  name: 'ShadowEarring',     parentTypeId: 2,  description: 'Shadow Earring' },
  { id: 530,  name: 'ShadowPendant',     parentTypeId: 2,  description: 'Shadow Pendant' },

  // ── Special / misc (itemTypeId = 2) ──────────────────────────────────────
  { id: 768,  name: 'Special',           parentTypeId: null, description: 'Special equipment (e.g. wedding costumes)' },

  // ── Costume Enchant sub-types (itemTypeId = 2) ───────────────────────────
  { id: 71,   name: 'CostumeEnhUpper',   parentTypeId: 2,  description: 'Costume Enchant – Upper (type 1)' },
  { id: 72,   name: 'CostumeEnhMiddle',  parentTypeId: 2,  description: 'Costume Enchant – Middle' },
  { id: 73,   name: 'CostumeEnhLower',   parentTypeId: 2,  description: 'Costume Enchant – Lower' },
  { id: 74,   name: 'CostumeEnhGarment', parentTypeId: 2,  description: 'Costume Enchant – Garment (type 1)' },
  { id: 75,   name: 'CostumeEnhGarment4',parentTypeId: 2,  description: 'Costume Enchant – Garment (type 4)' },
  { id: 76,   name: 'CostumeEnhGarment2',parentTypeId: 2,  description: 'Costume Enchant – Garment (type 2)' },
  { id: 77,   name: 'CostumeEnhUpper2',  parentTypeId: 2,  description: 'Costume Enchant – Upper (type 2)' },

  // ── Ammo (itemTypeId = 4) ────────────────────────────────────────────────
  { id: 1024, name: 'Arrow',             parentTypeId: 4,  description: 'Arrow' },
  { id: 1025, name: 'Cannonball',        parentTypeId: 4,  description: 'Cannonball' },
  { id: 1026, name: 'Kunai',             parentTypeId: 4,  description: 'Kunai' },
  { id: 1027, name: 'Bullet',            parentTypeId: 4,  description: 'Bullet' },
];

// ---------------------------------------------------------------------------
// Quick-lookup maps
// ---------------------------------------------------------------------------

export const ItemTypeIdByName = Object.fromEntries(
  ITEM_TYPE_ID_TABLE.map((r) => [r.name, r.id])
) as Record<string, number>;

export const ItemTypeNameById = Object.fromEntries(
  ITEM_TYPE_ID_TABLE.map((r) => [r.id, r.name])
) as Record<number, string>;

export const ItemSubTypeNameById = Object.fromEntries(
  ITEM_SUB_TYPE_ID_TABLE.map((r) => [r.id, r.name])
) as Record<number, string>;

export const ItemSubTypeIdByName = Object.fromEntries(
  ITEM_SUB_TYPE_ID_TABLE.map((r) => [r.name, r.id])
) as Record<string, number>;
