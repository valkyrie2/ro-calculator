import { RuneAgi, RuneDex, RuneInt, RuneLuk, RuneStr, RuneVit, ea15, ef15, em15 } from './_basic';

export const heroCapeSlot2 = [
  "Spirit_Of_Star_03_CN",
  "Spirit_Of_Star_04_CN",
  "Spirit_Of_Star_05_CN",
  "Spirit_Of_Star_06_CN",
  "Spirit_Of_Star_07_CN",
];

export const heroCapeSlot3 = [...ea15, ...ef15, ...em15];

export const heroCapeSlot4 = [
  ...heroCapeSlot3,
  RuneStr._1,
  RuneAgi._1,
  RuneVit._1,
  RuneInt._1,
  RuneDex._1,
  RuneLuk._1,
];
