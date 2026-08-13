const range = (prefix: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`);

/** Slot 2: Star Cluster of Power / Stamina / Concentration / Creative / Spell / Wisdom, Lv1-3. */
export const reDimGlacierArmor2 = ['Pow', 'Sta', 'Con', 'Crt', 'Spl', 'Wis'].flatMap((trait) =>
  range(`Star_Cluster_Of_${trait}`, 1, 3),
);

/**
 * Slot 3: the skill-specific Glacier Flower Spells only.
 * Glacier_F_Orb_150-161 are the ATK/MATK/CRI/race/size/property options, not skills.
 */
export const reDimGlacierArmor3 = [...range('Glacier_F_Orb_', 1, 149), ...range('Glacier_F_Orb_', 162, 191)];

/** Slot 4: Star of ... Lv1-5, plus the flat trait +3 orbs. */
export const reDimGlacierArmor4 = [
  ...['MasterArcher', 'Mettle', 'Sharp', 'Speed', 'Spell', 'Vital', 'Spirit'].flatMap((star) =>
    range(`Star_Of_${star}`, 1, 5),
  ),
  'M_Pow3',
  'M_Sta3',
  'M_Wis3',
  'M_Spl3',
  'M_Con3',
  'M_Crt3',
];
