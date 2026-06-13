export interface AutoSpellOnUse {
  /** SKILL_NAME ที่เป็นทริกเกอร์ — ต้องตรงกับสกิลหลักที่เลือกถึงจะคิด */
  onSkill: string;
  /** SKILL_NAME ที่ถูกร่าย (ABC) */
  skill: string;
  /** โอกาส proc เป็นเปอร์เซ็นต์ เช่น 30 */
  chance: number;
  /** เลเวลตายตัว (ออปชัน); ไม่ใส่ = ใช้เลเวลสูงสุด (value ของ atkSkill ABC) */
  level?: number;
  /** เงื่อนไข gate (ออปชัน) ใช้ไวยากรณ์เดียวกับ script line เช่น "EQUIP[X]GRADE[weapon==C]===1" */
  condition?: string;
}

export interface ItemModel {
  id: number;
  aegisName: string;
  name: string;
  unidName: string;
  resName: string;
  description: string;
  slots: number;
  itemTypeId: number;
  itemSubTypeId: number;
  itemLevel: any;
  attack: any;
  propertyAtk?: any;
  defense: any;
  weight: number;
  requiredLevel: any;
  location: any;
  compositionPos: number;
  isRefinable?: boolean;
  cardPrefix?: string;
  canGrade?: boolean;
  /**
   * When true, this item is hidden from non-premium users. Only admins
   * and users with a non-expired premium grant see it in dropdowns and
   * have its bonuses applied in the calculator.
   */
  isPremium?: boolean;
  /**
   * ISO timestamp. Items with a future `releaseDate` are hidden from
   * regular users (admins and active-premium users see them, marked
   * as upcoming). Once the date passes, the item is visible to everyone
   * and the upcoming marker disappears automatically.
   */
  releaseDate?: string;
  /**
   * When true, this is a synthetic virtual entry that simulates the item
   * after its TIME[YYYY-MM-DD] bonus has expired. Its id is the negative
   * of the original item's id. The script has all TIME[] prefixes replaced
   * with a past date so the time-limited bonuses are never applied.
   */
  isExpiredSim?: boolean;
  script: Record<string, any[]>;
  autoSpellOnUse?: AutoSpellOnUse[];
}
