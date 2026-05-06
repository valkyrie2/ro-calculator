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
  RuneStr._1, RuneStr._2, RuneStr._3,
  RuneAgi._1, RuneAgi._2, RuneAgi._3,
  RuneVit._1, RuneVit._2, RuneVit._3,
  RuneInt._1, RuneInt._2, RuneInt._3,
  RuneDex._1, RuneDex._2, RuneDex._3,
  RuneLuk._1, RuneLuk._2, RuneLuk._3,
];
