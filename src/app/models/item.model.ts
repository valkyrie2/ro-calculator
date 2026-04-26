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
  script: Record<string, any[]>;
}
