# Changelog

## Extra v62.1 (24-06-2569)

- Rechecked the 24-06 thROG history items against official Divine Pride API data
- Corrected 491066: previously added as a predicted "Orrivane Ring (Shadow Cross)", it is actually **Furious Ring (Dragon Knight)** — official stats, sets with Furious Slayer (ATK+100, POW+10, CRI+15, +15% phys dmg vs all class; refine 10 / Grade C / Grade B add +20% Servant Weapon & Hack and Slasher, Grade C also -0.5s Hack and Slasher cooldown). Note: Grade B "can use Dark Claw/Power" and the 30% auto-attack/autospell procs are not modeled
- Added Orrivane Ring (Shadow Cross) (491067), Orrivane Ring (Biolo) (491068), Orrivane Ring (Shinkiro & Shiranui) (491069) with official stats and Orrivane Crown set bonuses
- Added Robot Spark Shield [1] (460175) for Meister (RES/MRES+15, refine 7/9/11/12 bonuses incl. Spark Blaster cooldown/damage and ranged dmg, Grade D–A options). Damage-taken reduction vs normal/boss is not modeled
- Added Furious Ring enchants (FuriousRing_DK): slot 2 = Warrior/Shooter/Magician Orb Lv.15; slot 3 = Spell 3/5, Attack Delay 2/4, Expert Archer/Fighter/Magician 3/5; slot 4 = all 13 POW/SPL/STA/WIS/CON/CRT Assistance & Enforcement stat enchants
- Added 4 stat enchant items (Base Lv.240+, capped at 100 base stat): POW Assistance (313131, RES+1/DEF+3 per 7 POW), SPL Assistance (313133, MRES+1/MDEF+3 per 7 SPL), CRT Assistance (313142, HIT+5/FLEE+5 per 7 CRT), WIS Enforcement (313138, MSP+1% per 10 WIS — MSP% not modeled, no DPS effect)
- Corrected Orrivane Orb (Shadow Cross): replaced predicted 315324 with official 315361 — cooldown reduction is on Dark Claw (not Shadow Exceed), Savage Impact cooldown is 0.35s (was 0.5s); removed the future release-date lock
- Added Orrivane Orb (Biolo) (315362) and Orrivane Orb (Shinkiro & Shiranui) (315363) with official weapon set bonuses, and wired enchant slots 2/3/4 for Orrivane Ring (Biolo) and (Shinkiro & Shiranui) — slot 2 = class Orrivane Orb, slot 3 = Varmundt Acc, slot 4 = Dim Glacier Ring — matching the other Orrivane Rings
- Added 3 event -LT items (01-07 thROG history), all stronger than their base counterparts: Feather Shield-LT (460176), Ayothaya Adventurer's Boots-LT (470456), and 6th Anniversary Ayothaya Ring-LT (491070); the boots/ring set bonus references the -LT partner. Ring-LT reuses the base Ayothaya Ring enchant slots (slot 2 Biosphere Gem, slot 3 Star series, slot 4 Varmundt Acc). Chance-based leech/heal procs, status resist, and Boss/RES/Perfect-Dodge grade options are not modeled

## Extra v61.1 (04-06-2569)

- Added enchants for All Above Time(Supreme)-LT: slot 2 Spirit of Knight Lv.3–7, slots 3–4 all gem types Lv.1 (Ruby of Strength / Amethyst of Vitality / Topaz of Agility / Sapphire of Intelligence / Emerald of Dexterity / Diamond of Fatality)
- Added shadow equipment: Limit Break Shadow Weapon (24769) and Limit Break Shadow Shield (24771)
- Added 3 Orrivane Rings: Dragon Knight (491063), Meister (491064), Imperial Guard (491065)
- Added 3 Orrivane Orbs: Dragon Knight (315321), Meister (315322), Imperial Guard (315323)
- Added Soul Demon Shield [1] (460171) and Soul Demon Shield-LT [1] (460174) for Soul Ascetic
- Added Soul Demon Shield-LT: Soul of the Abyss proc (refine 11+ chance → SPL+50, S.MATK+10; Grade B: +50 SPL, +10 S.MATK additional)
- Added Dragon Knight Power skill (Lv 2, Lv 4) with modifyFinalAtk (totalAtk × powerLv × 20%)
- Added enchants for Loyal Servant of Demon God Morocc: slots 2/3/4 all support Dark Lord Essence Force/Intelligence/Speed/Vitality/Concentration/Luck 3
- Added Orrivane Ring (Shadow Cross) (491066) and Orrivane Orb (Shadow Cross) (315324) — estimated stats (no official data yet), restricted via future releaseDate so only admin/premium can see them
- Added Shadow Cross Power skill (Lv 2) to Active Skill list with modifyFinalAtk (totalAtk × powerLv × 20%)
- Fixed "Label has invalid characters" when saving a preset with a Thai (or any non-Latin) name — label/publish-name validation now accepts Unicode letters and combining marks (requires applying migration 20260612000000 with `supabase db push`)

## Extra v60.7 (27-05-2569)

- Added 38 Orrivane weapons (all 4th/5th job classes): Imperial Sword, Biologic Sword, Hyper Sword, Abyss Dagger, Imperial Spear, Saint Book, Elemental Magic/Spell Books, Emperor Star/Noon Books, Saint/Arch/Soul Wands, Soul Stick, Hyper Wand, Spirit Foxtail/Model, Judgment Knuckle/Claw, Musical Violin/Harp/Rope/Ribbon, Mechanical Mace, Biologic Scepter, Dragon Sword, Shadow Katar/Cakram, Mechanical Axe, Dragon Lance, Arch Staff, Wheel/Huuma Shurikens, Abyss/Wind Crossbow, Wind Bow, Night Pistol/Gatling
- Added 18 Orrivane Crowns (Dragon Knight, Imperial Guard, Meister, Biolo, Shadow Cross, Abyss Chaser, Cardinal, Inquisitor, Arch Mage, Elemental Master, Wind Hawk, Troubadour & Trouvere, Sky Emperor, Soul Ascetic, Night Watch, Shinkiro & Shiranui, Hyper Novice, Spirit Handler)
- Added 3 Orrivane Rings (Wind Hawk 491049, Abyss Chaser 491050, Arch Mage 491051) with 3-slot enchants (Orrivane Orb class-specific / Varmundt Acc3 / Dim Ring LT4)
- Added 3 Orrivane Orb enchant items (Wind Hawk 315286, Abyss Chaser 315287, Arch Mage 315288)
- Fixed Orrivane Rings: canGrade set to false
- Added misc items: [6th] Ayothaya Helm (401390), Eye of Necromancer (410657), Falling Star Shield (460166), Ayothaya Adventurer's Boots (470442), 6th Anniversary Ayothaya Ring (490966), Amplify Metal Detector MK47-2 (102126)
- Added skill names: Metalic Fury, Overbrand

## Extra v60.6 (24-05-2569)

- Added item: Costume Poring Noodle Head (400319) with event EXP +20% bonus expiring on 03-06-2569

## Extra v60.5 (20-05-2569)

- Added items: Ring of Liberation (Left) [1] (490633) and Ring of Liberation (Right) [1] (490641)
- Added Full Throttle learned/active skill controls for 3rd class jobs so Ring of Liberation bonuses can be calculated
- Set Sessrumnir Commemoration Ring [1] event bonuses to expire on 15-07-2569

## Extra v60.3 (06-05-2569)

- Added item: All Above Time(Supreme)-LT (420841) — Global Cooldown -10%, melee/range/magic element all +10%; shard set bonuses with Strength/Agility/Intelligence/Vitality/Dexterity/Fatality Shards
- Added item: Sessrumnir Commemoration Ring [1] (490557) — ATK/MATK +5%, CRI +5, ASPD +5%, VCT -5%; event bonuses: ATK/MATK +20, CRI +10, ASPD +10%, VCT -10%, EXP +15%; set bonus with Summer Vacation Pope Card: phys/mag race/size/element all +10%
- Added item: Summer Vacation Pope Card (300549) — melee/range +3%, magic element all +3%; set bonus with Sessrumnir Commemoration Ring: +7% each
- Added Enchant for Hero Mantle Set

## Extra v60.2 (01-05-2569)

- Added item: 6th Anniversary Card (300700) — base P.ATK/S.MATK +6, MHP +666, MSP +66; full set bonuses with 1st/2nd/4th Anniversary Cards
- Added time-limited bonuses (until 26-08-2569): ATK/MATK +166, All Trait +16
- Added items: EXP +2% (29027 Lower / 29145 Middle / 29159 Upper) Costume Enchants — DB lookup only, EXP gain only
- Wrapped Costume Ayothaya Hat (490974) bonuses with TIME[2026-07-15] — auto-expire after server maintenance on 15-07-2569
- Calculator: new TIME[YYYY-MM-DD] script prefix — bonuses auto-expire when current date passes the cutoff
- Fixed Exotic Temporal Young Leaf-LT full 4-piece set bonuses: moved magic element bonus to m_my_element_all, added p/m_pene_race_all 100% and pene_res/pene_mres 30% at combined refine ≥39

## Extra v60.1 (30-04-2569)

- Fixed slot type of 9x Dim Glacier Ring of Resonance items — corrected itemSubTypeId from generic Accessory (517) to Right Accessory (510)
- Fixed 6th Anniversary Ayothaya Ring — added Grade A physical/magical penetration vs all races (40%)

## Extra v60 (29-04-2569)

- Added items: Varmundt Melee Shadow Earring, Varmundt Melee Shadow Pendant
- Added items: Varmundt Range Shadow Earring, Varmundt Range Shadow Pendant
- Added items: Varmundt Magic Shadow Earring, Varmundt Magic Shadow Pendant

## Extra v59.3 (26-04-2569)

- Added item: Ayothaya Helm (refinable up to +20)

## Extra v59.2 (25-04-2569)

- Added item: Costume Ayothaya Hat
- Added item: Experience Shadow Shield

## Extra v59.1 (23-04-2569)

- Added item: 6th Anniversary Ayothaya Ring [1]

## Extra v59 (20-04-2569)

- Added EXP Calculator tab — calculates EXP/Job EXP yield from monsters
- Supported level difference modifier table (Monster Lv. vs Player Lv.)
- Supported all EXP modifiers: Equip Bonus, MR. Kim A.L.F.C, Battle Manual, VIP, Job Manual, Event EXP%, Kafra Buff, EXP Tap
- Added Monster Spotlight Summer 2026 data (25 Mar – 29 Apr 2026)
- Added Spotlight group in monster dropdown for EXP Calculator
- Player level in EXP Calculator is editable / syncs from Calculator tab
- Added expBonus scripts to 26 items

## Extra v58.4 (18-04-2569)

- Added items: Limit Break Shadow Earring, Limit Break Shadow Pendant

## Extra v58.2 (15-04-2569)

- Added custom equipment compare in Custom Bonus tab (calc Proc & damage diff vs current equip)
- Added Compare Preset feature in DPS Compare tab

## Extra v58.1 (14-04-2569)

- Added Custom Bonus tab — manually add bonus stats for testing theorycrafting
- Supported custom item script input in Custom Bonus tab
- Display pseudo damage for verifying base damage with custom bonuses

## Extra v58 (06-04-2569)

- Added Ranger, SR & Sorcerer skill to get bonus
- Added items
- Support 4th slot garment costume

## 1.0.3

- Fixed weapon cannot comparing
- Added items & monsters

## 1.0.2

- Fixed EDP calculation
- Fixed Rolling Cutter to Melee damage

## 1.0.1

- Fixed item bonus
- Fixed Shadow monster calculation
- Update Racing cap & Enchants

## 1.0.0

- Support RG, Arch Bishop, Ranger, Guillotine Cross, SC, Warlock, Sorcerer, Mechanic, SR, Rebellion, Doram
- Support preset saving.
- Support item comparing.
- Strict mode support added.
- Eslint applied.
