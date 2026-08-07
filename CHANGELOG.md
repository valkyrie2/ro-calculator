# Changelog

## Extra v62.1 (24-06-2569)

- Added 12 equipment items from the 05-08 thROG history: Thought Ring [1] (32245, Accessory Left — ASPD+5% plus the Lord Knight / High Wizard / High Priest / Assassin Cross / Sniper / MasterSmith card combos), Thought Ring-LT [1] (491086, ATK/MATK+10% and again at Base Lv.200, -7% Global Cooldown, ASPD+10%, plus 12 card set bonuses including the six True Bio-lab cards with their Ignition Break / Crimson Rock / Adoramus / Cross Ripper Slasher / Arrow Storm / Axe Tornado cooldown cuts)
- Added Snow Aura-LT (420930, Lower headgear): All Status +5 and a per-piece Glacier / Dim Glacier set bonus for every Armor, Robe, Boots, Shoes, Manteau and Muffler, plus the Snow Fox-LT combo (+15% phys/magic dmg vs all race, 10% RES/MRES penetration)
- Added Ghost Fire (420199, Lower headgear): -8% variable cast, -5% Global Cooldown, -0.1s fixed cast, and the New Wave Sunglasses combo that scales off POW/STA/WIS/SPL/CON/CRT in steps of 18
- Added Aladdin Shoes-LT [1] (470460) and Ragnarok Stars 2026 Cape [1] (480908), both with their full refine and Grade D–A option blocks; the cape's refine-12 block covers all 19 listed skills
- Added the six Thanatos masks (436000–436005): Maeror = MATK+3%, Despero = ATK+3%, Odium = MaxHP+5%. Their "+10% damage vs Player" / "-5% damage taken from Player" lines are PvP-only and are not modeled, and the calculator has no combined Upper-Middle-Lower slot, so they are registered as Upper headgear
- Skipped from the same history page: cosmetic-only costumes (20049, 400414–400415, 410062–410456, 420201, 480286), pet eggs, consumables, quest materials and cash packages — the calculator has no slots for them. Kiel Effect (300566) and the 39 enchants at 315344–315382 (ILL_SU / ILL_STAR / TAEK series) were skipped because Divine Pride has no effect data for them on any server
- EP20 "The Immortal" enchants were already complete — every Glacier Flower and Snake God option on the official enchant list is already wired to the Glacier / Dim Glacier armor, garment, shoes, shield and accessory slots
- Added 4 Q-Pet eggs: Copo Egg (9145, ATK/MATK +2%), Grey Icewind Egg (9146, ATK +3% / POW +2), Icewind Egg (9147, MATK +3% / SPL +2) and Celine Kimi Egg (9195, +5% phys/magic dmg vs all element, -3% variable cast, -2% Global Cooldown). As with the existing eggs, the script holds the top (Loyal) intimacy tier — the lower tiers are shown in the description only. Celine Kimi Egg has no thROG text on Divine Pride, so its Thai description is translated from the Korean original
- Added Assassin Cross Card (4359), MasterSmith Card (4361) and Sniper Card (4367), which completes the six-card combo table on Thought Ring [1] and Thought Ring-LT [1]. Their own effects (Cloaking Lv.3 grant, equipment-break chance, 5%/20% HP leech) are not modeled, so their scripts are empty — same as High Priest Card
- Rechecked every card-range ID on the 05-08 history page: 21 of 22 were already in the calculator. The remaining one, Kiel Effect (300566), has no name, slot or effect data on any Divine Pride server and is still skipped
- Rechecked the 24-06 thROG history items against official Divine Pride API data
- Corrected 491066: previously added as a predicted "Orrivane Ring (Shadow Cross)", it is actually **Furious Ring (Dragon Knight)** — official stats, sets with Furious Slayer (ATK+100, POW+10, CRI+15, +15% phys dmg vs all class; refine 10 / Grade C / Grade B add +20% Servant Weapon & Hack and Slasher, Grade C also -0.5s Hack and Slasher cooldown). Note: Grade B "can use Dark Claw/Power" and the 30% auto-attack/autospell procs are not modeled
- Added Orrivane Ring (Shadow Cross) (491067), Orrivane Ring (Biolo) (491068), Orrivane Ring (Shinkiro & Shiranui) (491069) with official stats and Orrivane Crown set bonuses
- Added Robot Spark Shield [1] (460175) for Meister (RES/MRES+15, refine 7/9/11/12 bonuses incl. Spark Blaster cooldown/damage and ranged dmg, Grade D–A options). Damage-taken reduction vs normal/boss is not modeled
- Added Furious Ring enchants (FuriousRing_DK): slot 2 = Warrior/Shooter/Magician Orb Lv.15; slot 3 = Spell 3/5, Attack Delay 2/4, Expert Archer/Fighter/Magician 3/5; slot 4 = all 13 POW/SPL/STA/WIS/CON/CRT Assistance & Enforcement stat enchants
- Added 4 stat enchant items (Base Lv.240+, capped at 100 base stat): POW Assistance (313131, RES+1/DEF+3 per 7 POW), SPL Assistance (313133, MRES+1/MDEF+3 per 7 SPL), CRT Assistance (313142, HIT+5/FLEE+5 per 7 CRT), WIS Enforcement (313138, MSP+1% per 10 WIS — MSP% not modeled, no DPS effect)
- Corrected Orrivane Orb (Shadow Cross): replaced predicted 315324 with official 315361 — cooldown reduction is on Dark Claw (not Shadow Exceed), Savage Impact cooldown is 0.35s (was 0.5s); removed the future release-date lock
- Added Orrivane Orb (Biolo) (315362) and Orrivane Orb (Shinkiro & Shiranui) (315363) with official weapon set bonuses, and wired enchant slots 2/3/4 for Orrivane Ring (Biolo) and (Shinkiro & Shiranui) — slot 2 = class Orrivane Orb, slot 3 = Varmundt Acc, slot 4 = Dim Glacier Ring — matching the other Orrivane Rings
- Added 3 event -LT items (01-07 thROG history), all stronger than their base counterparts: Feather Shield-LT (460176), Ayothaya Adventurer's Boots-LT (470456), and 6th Anniversary Ayothaya Ring-LT (491070); the boots/ring set bonus references the -LT partner. Ring-LT reuses the base Ayothaya Ring enchant slots (slot 2 Biosphere Gem, slot 3 Star series, slot 4 Varmundt Acc). Chance-based leech/heal procs, status resist, and Boss/RES/Perfect-Dodge grade options are not modeled
- Added 17 4th-class Garment upgrade cards from the 22-07 thROG history (300912–300914, 300917–300929, 315411): +5% damage per 3 garment refine, All Status +20 / All Trait +5 at Base Lv.200 and again at garment refine 10, plus a class-locked block (+20% race damage, ATK or MATK +100, MaxHP +20%; hybrid classes get 15% and both ATK and MATK)
- Added 3 Orrivane Orbs — Cardinal (315412), Sky Emperor (315413), Hyper Novice (315414) — and 3 Orrivane Rings — Cardinal (491076), Sky Emperor (491077), Hyper Novice (491078) — with their Orrivane weapon/crown set bonuses and autospell procs
- Added White Furious Ring (Elemental Master) (491074, sets with Furious Master Spellbook) and White Furious Ring (Dragon Knight) (491075, sets with Furious Trident, incl. the Grade B Madness Crusher autospell)
- Added Ignis Flame Guard [1] (460178) and Ignis Flame Guard-LT [1] (460179) for Arch Mage, and Forbidden Grimoire-LT [1] (460180) for Elemental Master
- Added ROS 2026 Pheonix Glory Crown [1] (401483), Ragnarok Stars 2026 Card (300934) and Ragnarok Stars 2026 Ring (Right) (491079)
- Wired enchant slots for the 3 new Orrivane Rings, matching the existing ones: slot 2 = the class Orrivane Orb, slot 3 = Varmundt Acc, slot 4 = Dim Glacier Ring
- Not modeled from the 22-07 batch: Star Burst and Flying Kick on Orrivane Orb (Sky Emperor) (skills absent from the calculator), "can use skill X" grants, HP/SP recovery and drop-rate procs, and the Elemental summon cooldowns on Forbidden Grimoire-LT. Cosmetic-only costumes (20344, 420831, 480747) and consumables from the same history page were skipped — the calculator has no slots for them. Divine Pride has no icon for 401483; the upgrade cards reuse the generic unnamed-card icon
- Added Baby Gray Wolf In Mouth-LT (420864), Lower headgear: -10% Global Cooldown, +10% EXP; Gray Wolf Manteau/Muffler set (EXP +4%, +1% per 2 garment refine, +4% phys/magic dmg vs all size per 3 refine); Gray Wolf Suit/Robe set (+10% phys/magic dmg vs all race, -2% GCD per 2 armor refine, P.ATK/S.MATK +2 per 3 refine); garment refine 11+ adds +10% phys/magic dmg vs all element and 30% phys/magic race penetration. Chance-based HP/SP leech, magic-kill recovery, and drop rate are not modeled

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
