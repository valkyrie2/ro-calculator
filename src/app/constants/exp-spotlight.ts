export interface SpotlightMonster {
  monsterId: number;
  monsterName: string;
  /** EVENT EXP column from spotlight announcement */
  eventBaseExp: number;
  /** EVENT JOB EXP column from spotlight announcement */
  eventJobExp: number;
  /** Monster level — required for monsters not in the local database */
  monsterLevel?: number;
}

export interface SpotlightEvent {
  id: string;
  name: string;
  /** ISO date string YYYY-MM-DD (inclusive) */
  startDate: string;
  /** ISO date string YYYY-MM-DD (inclusive) */
  endDate: string;
  monsters: SpotlightMonster[];
}

export const SPOTLIGHT_EVENTS: SpotlightEvent[] = [
  {
    id: 'monster-spotlight-summer-2026',
    name: 'Monster Spotlight Summer 2026',
    startDate: '2026-03-25',
    endDate: '2026-04-29',
    // Source: official event banner (25 Mar – 29 Apr 2026)
    monsters: [
      // --- Monsters NOT in local DB (synthetic IDs 90001-90012, monsterLevel required) ---
      { monsterId: 90001, monsterName: 'Galapago',       monsterLevel: 45,  eventBaseExp: 1476,  eventJobExp: 1204  },
      { monsterId: 90002, monsterName: 'Sea Otter',      monsterLevel: 48,  eventBaseExp: 1516,  eventJobExp: 1312  },
      { monsterId: 90003, monsterName: 'Leaf Cat',       monsterLevel: 64,  eventBaseExp: 2520,  eventJobExp: 2176  },
      { monsterId: 90004, monsterName: 'Kraben',         monsterLevel: 70,  eventBaseExp: 2440,  eventJobExp: 2616  },
      { monsterId: 90005, monsterName: 'Rafflesia',      monsterLevel: 86,  eventBaseExp: 4344,  eventJobExp: 3880  },
      { monsterId: 90006, monsterName: 'Breeze',         monsterLevel: 92,  eventBaseExp: 4952,  eventJobExp: 4668  },
      { monsterId: 90007, monsterName: 'Gazeti',         monsterLevel: 106, eventBaseExp: 7296,  eventJobExp: 6952  },
      { monsterId: 90008, monsterName: 'Ice Titan',      monsterLevel: 110, eventBaseExp: 7632,  eventJobExp: 7288  },
      { monsterId: 90009, monsterName: 'Green Ferus',    monsterLevel: 126, eventBaseExp: 15280, eventJobExp: 13992 },
      { monsterId: 90010, monsterName: 'Gold Acidus',    monsterLevel: 130, eventBaseExp: 14956, eventJobExp: 14392 },
      { monsterId: 90011, monsterName: 'Blue Teddy Bear',monsterLevel: 157, eventBaseExp: 73200, eventJobExp: 84940 },
      { monsterId: 90012, monsterName: 'Red Teddy Bear', monsterLevel: 160, eventBaseExp: 79888, eventJobExp: 90012 },
      // --- Monsters in local DB ---
      { monsterId: 20531, monsterName: 'Chaos Poporing',             eventBaseExp: 375504,  eventJobExp: 262852  },
      { monsterId: 20525, monsterName: 'Chaos Baphomet Jr.',         eventBaseExp: 384644,  eventJobExp: 269168  },
      { monsterId: 20530, monsterName: 'Chaos Killer Mantis',        eventBaseExp: 384788,  eventJobExp: 269512  },
      { monsterId: 20604, monsterName: 'Angelgolt',                  eventBaseExp: 717004,  eventJobExp: 501904  },
      { monsterId: 20605, monsterName: 'Angelgolt',                  eventBaseExp: 716864,  eventJobExp: 501904  },
      { monsterId: 20606, monsterName: 'Holy Frus',                  eventBaseExp: 734912,  eventJobExp: 514440  },
      { monsterId: 20607, monsterName: 'Holy Skogul',                eventBaseExp: 738760,  eventJobExp: 517132  },
      { monsterId: 21525, monsterName: 'Ice Gangu',                  eventBaseExp: 1079652, eventJobExp: 781728  },
      { monsterId: 21522, monsterName: 'Calmaring',                  eventBaseExp: 1103552, eventJobExp: 788488  },
      { monsterId: 21526, monsterName: 'Primitive Rgan',             eventBaseExp: 1275004, eventJobExp: 892504  },
      { monsterId: 21527, monsterName: 'Lowest Rgan',                eventBaseExp: 1334000, eventJobExp: 928224  },
      { monsterId: 21520, monsterName: 'Limacina',                   eventBaseExp: 1209060, eventJobExp: 833540  },
      { monsterId: 21540, monsterName: 'Cave Calmaring',             eventBaseExp: 1485081, eventJobExp: 1034358 },
      { monsterId: 21541, monsterName: 'Cave Flower',                eventBaseExp: 1535277, eventJobExp: 1068279 },
      { monsterId: 21538, monsterName: 'Discarded Primitive Rgan',   eventBaseExp: 1577745, eventJobExp: 1097826 },
      { monsterId: 21543, monsterName: 'Hallucigenia Baby',          eventBaseExp: 1540515, eventJobExp: 1075668 },
      { monsterId: 21544, monsterName: 'One Eye Dollocaris',         eventBaseExp: 2122530, eventJobExp: 1478343 },
      { monsterId: 21542, monsterName: 'Hallucigenia',               eventBaseExp: 2122530, eventJobExp: 1478343 },
      { monsterId: 21545, monsterName: 'Two Eyes Dollocaris',        eventBaseExp: 2189229, eventJobExp: 1523310 },
      { monsterId: 21539, monsterName: 'Discarded Intermediate Rgan',eventBaseExp: 2189229, eventJobExp: 1523310 },
      { monsterId: 20941, monsterName: 'Grote',                      eventBaseExp: 1039866, eventJobExp: 727905  },
      { monsterId: 20936, monsterName: 'Disguiser',                  eventBaseExp: 1007868, eventJobExp: 705507  },
      { monsterId: 20940, monsterName: 'Blue Moon Loli Ruri',        eventBaseExp: 1019355, eventJobExp: 713550  },
      { monsterId: 20942, monsterName: 'Pierrotzoist',               eventBaseExp: 1018353, eventJobExp: 712848  },
      { monsterId: 20179, monsterName: 'Sieglouse',                  eventBaseExp: 2228400, eventJobExp: 1555986 },
      { monsterId: 20176, monsterName: 'Erzsebet',                   eventBaseExp: 2246364, eventJobExp: 1571673 },
      { monsterId: 20175, monsterName: 'Extra Joker',                eventBaseExp: 2266656, eventJobExp: 1582698 },
      { monsterId: 20177, monsterName: 'Jennifer',                   eventBaseExp: 2266656, eventJobExp: 1582698 },
      { monsterId: 20178, monsterName: 'General Orc',                eventBaseExp: 2301450, eventJobExp: 1601397 },
      { monsterId: 21549, monsterName: 'Plain Pinguicula',           eventBaseExp: 3925485, eventJobExp: 2734098 },
      { monsterId: 21552, monsterName: 'Plain Savage',               eventBaseExp: 4010133, eventJobExp: 2790333 },
      { monsterId: 21554, monsterName: 'Plain Hill Wind',            eventBaseExp: 3983766, eventJobExp: 2781675 },
      { monsterId: 21551, monsterName: 'Plain Rocker',               eventBaseExp: 4041759, eventJobExp: 2829231 },
      { monsterId: 21548, monsterName: 'Plain Cornus',               eventBaseExp: 4141551, eventJobExp: 2899086 },
      { monsterId: 21553, monsterName: 'Plain Flora',                eventBaseExp: 4058655, eventJobExp: 2826855 },
      { monsterId: 21550, monsterName: 'Plain Hunter Fly',           eventBaseExp: 4119639, eventJobExp: 2882313 },
    ],
  },
];

/** Returns the currently active spotlight event, or null if none is active. */
export function getActiveSpotlightEvent(date: Date = new Date()): SpotlightEvent | null {
  const today = date.toISOString().substring(0, 10);
  return SPOTLIGHT_EVENTS.find((e) => today >= e.startDate && today <= e.endDate) ?? null;
}

/**
 * Returns the spotlight EXP data for a specific monster in the active event.
 * Returns null if no active event or monster is not in the spotlight list.
 */
export function getSpotlightMonster(monsterId: number, date: Date = new Date()): SpotlightMonster | null {
  const event = getActiveSpotlightEvent(date);
  if (!event) return null;
  return event.monsters.find((m) => m.monsterId === monsterId) ?? null;
}
