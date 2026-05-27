"""Generate item.json entries for the 65 new items from temp_dp_fetch/."""
import json, re, os

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def add(script, key, val):
    script.setdefault(key, []).append(val)

# Map Thai class string from footer → ClassName enum value(s)
CLASS_MAP = {
    "Dragon Knight":        ["DragonKnight"],
    "Imperial Guard":       ["ImperialGuard"],
    "Meister":              ["Meister"],
    "Biolo":                ["Biolo"],
    "Shadow Cross":         ["ShadowCross"],
    "Abyss Chaser":         ["AbyssChaser"],
    "Cardinal":             ["Cardinal"],
    "Inquisitor":           ["Inquisitor"],
    "Arch Mage":            ["ArchMage"],
    "Elemental Master":     ["ElementalMaster"],
    "Wind Hawk":            ["Windhawk"],
    "Troubadour, Trouvere": ["Troubadour", "Trouvere"],
    "Troubadour & Trouvere":["Troubadour", "Trouvere"],
    "Troubadour":           ["Troubadour"],
    "Trouvere":             ["Trouvere"],
    "Sky Emperor":          ["SkyEmperor"],
    "Soul Ascetic":         ["SoulAscetic"],
    "Night Watch":          ["NightWatch"],
    "Shinkiro & Shiranui":  ["Shinkiro", "Shiranui"],
    "Shinkiro":             ["Shinkiro"],
    "Shiranui":             ["Shiranui"],
    "Hyper Novice":         ["HyperNovice"],
    "Spirit Handler":       ["SpiritHandler"],
    "ทุกอาชีพ":              ["all"],
}

ELEM_MAP = {
    "Holy":    "m_element_holy",
    "Neutral": "m_element_neutral",
    "Water":   "m_element_water",
    "Fire":    "m_element_fire",
    "Wind":    "m_element_wind",
    "Earth":   "m_element_earth",
    "Shadow":  "m_element_dark",
    "Poison":  "m_element_poison",
    "Dark":    "m_element_dark",
}

def strip_slots(name):
    return re.sub(r'\s*\[\d+\]$', '', name.strip())

def parse_meta(raw):
    desc = raw.get("description", "")
    # item level
    wlv_m = re.search(r'เลเวลอาวุธ\s*:\s*\^777777(\d+)\^000000', desc)
    alv_m = re.search(r'เลเวล Armor\s*:\s*\^777777(\d+)\^000000', desc)
    item_level = int((wlv_m or alv_m).group(1)) if (wlv_m or alv_m) else None
    # location
    loc_m = re.search(r'ตำแหน่ง\s*:\s*\^777777(\w+)\^000000', desc)
    location = loc_m.group(1) if loc_m else None
    # usable class
    cls_m = re.search(r'อาชีพที่ใส่ได้\s*:\s*\^777777(.+?)\^000000', desc)
    usable = ["all"]
    if cls_m:
        cls_raw = cls_m.group(1).strip()
        usable = CLASS_MAP.get(cls_raw, [cls_raw])
    return item_level, location, usable

def build_base(raw):
    """Return skeleton item from API response."""
    item_level, location, usable = parse_meta(raw)
    return {
        "id": raw["id"],
        "aegisName": raw.get("aegisName") or f"Custom_{raw['id']}",
        "name": raw.get("name", f"Item {raw['id']}"),
        "unidName": raw.get("unidName") or "",
        "resName": raw.get("resName") or raw.get("aegisName") or "",
        "description": raw.get("description", ""),
        "slots": raw.get("slots") or 0,
        "itemTypeId": raw.get("itemTypeId") or 5,
        "itemSubTypeId": raw.get("itemSubTypeId") or 0,
        "itemLevel": item_level,
        "attack": raw.get("attack"),
        "defense": raw.get("defense"),
        "weight": int(raw.get("weight") or 0),
        "requiredLevel": raw.get("requiredLevel") or raw.get("equipLevelMin") or 1,
        "location": location,
        "compositionPos": None,
        "canGrade": True,
        "usableClass": usable,
        "script": {},
    }

# ---------------------------------------------------------------------------
# Orrivane weapon script builder
# ---------------------------------------------------------------------------

def orrivane_weapon_script(
    skill1,           # primary skill name (exactly as in skill-name.ts)
    base_type,        # "atk_pct", "atk_crit", "matk", "matk_per3"
    r7_keys,          # list of (key, val) to add at REFINE>=7
    r9_keys,          # list of (key, val) to add at REFINE>=9
    skill2=None,      # secondary skill (for weapons with two)
    skill1_base=5,    # base value for skill1 (some use 10)
    skill1_r3=2,      # per-3-refine value for skill1 (some use 5)
    skill2_r3=None,   # per-3-refine value for skill2 (if different)
    set_partner=None, # crown name WITHOUT slot suffix
    set_skill1=10,    # skill1 bonus on set equip
    set_skill2=None,  # skill2 bonus on set equip
    set_extra=None,   # (key, val) extra set bonus
    grade_a_set=None, # list of (key, val) for grade-A + combined refine ≥22 bonus
    grade_a_set_cd=None,  # cd__Skill value for grade-A set bonus
):
    s = {}

    if base_type == "atk_pct":
        add(s, "atkPercent", "3")
    elif base_type == "atk_crit":
        add(s, "cri", str(skill1_base == 5 and 5 or 5))  # base CRI is always 5
    elif base_type == "matk":
        add(s, "matk", "200")
        add(s, "matkPercent", "3")
    elif base_type == "matk_300":
        add(s, "matk", "300")
        add(s, "matkPercent", "3")

    # base skill damage
    add(s, skill1, str(skill1_base))
    if skill2:
        add(s, skill2, "5")

    # per-2-refine stepped
    if base_type in ("atk_pct", "atk_crit"):
        add(s, "atk", "REFINE[weapon==2]---10")
        add(s, "atkPercent", "REFINE[weapon==2]---1")
    else:
        add(s, "matk", "REFINE[weapon==2]---10")
        add(s, "matkPercent", "REFINE[weapon==2]---1")

    # per-3-refine stepped skill
    add(s, skill1, f"REFINE[weapon==3]---{skill1_r3}")
    if skill2:
        r3v = skill2_r3 if skill2_r3 is not None else 5
        add(s, skill2, f"REFINE[weapon==3]---{r3v}")

    # refine 7
    for key, val in r7_keys:
        add(s, key, f"7==={val}")

    # refine 9
    for key, val in r9_keys:
        add(s, key, f"9==={val}")

    # refine 11
    add(s, skill1, "11===10")
    if skill2:
        add(s, skill2, "11===20")  # most two-skill weapons have +20 on second at r11

    # set partner bonus
    if set_partner:
        equip = f"EQUIP[{set_partner}]==="
        add(s, skill1, f"{equip}{set_skill1}")
        if skill2 and set_skill2:
            add(s, skill2, f"{equip}{set_skill2}")
        if set_extra:
            for k, v in set_extra:
                add(s, k, f"{equip}{v}")

    # grade A + combined refine ≥22
    if grade_a_set and set_partner:
        cond = f"EQUIP[{set_partner}]GRADE[headUpper==A]REFINE[weapon,headUpper==22]==="
        if grade_a_set_cd:
            add(s, f"cd__{skill1}", f"{cond}{grade_a_set_cd}")
        for k, v in grade_a_set:
            add(s, k, f"{cond}{v}")

    # grade bonuses
    if base_type in ("atk_pct",):
        add(s, "pAtk", "GRADE[me==D]===2")
        add(s, skill1, "GRADE[me==C]===10")
        # grade B depends on r7_keys damage type
        for k, v in r7_keys:
            add(s, k, "GRADE[me==B]===10")
        add(s, "pAtk", "GRADE[me==A]REFINE[weapon==2]---2")

    elif base_type == "atk_crit":
        add(s, "pAtk", "GRADE[me==D]===2")
        add(s, skill1, "GRADE[me==C]===10")
        for k, v in r7_keys:
            add(s, k, "GRADE[me==B]===10")
        add(s, "pAtk", "GRADE[me==A]REFINE[weapon==2]---2")

    elif base_type in ("matk", "matk_300"):
        add(s, "sMatk", "GRADE[me==D]===2")
        add(s, skill1, "GRADE[me==C]===10")
        for k, v in r7_keys:
            add(s, k, "GRADE[me==B]===10")
        add(s, "sMatk", "GRADE[me==A]REFINE[weapon==2]---2")

    return s


def orrivane_crown_script(
    skill1, skill2,
    r7_keys,          # at refine 7
    r9_keys,          # at refine 9
    r11_keys,         # at refine 11
    grade_d,          # list of (key, val)
    grade_b,          # list of (key, val)
    grade_db_both=False, # True if grade D gives both pAtk+sMatk
):
    s = {}

    # per-3-refine: MHP+100, MSP+15
    add(s, "mhp", "REFINE[headUpper==3]---100")
    add(s, "msp", "REFINE[headUpper==3]---15")

    # per-4-refine: skill1 + skill2
    add(s, skill1, "REFINE[headUpper==4]---5")
    add(s, skill2, "REFINE[headUpper==4]---5")

    for k, v in r7_keys:
        add(s, k, f"7==={v}")

    for k, v in r9_keys:
        add(s, k, f"9==={v}")

    for k, v in r11_keys:
        add(s, k, f"11==={v}")

    # Grade bonuses
    for k, v in grade_d:
        add(s, k, f"GRADE[me==D]==={v}")

    add(s, "hpPercent", "GRADE[me==C]===5")
    add(s, "spPercent", "GRADE[me==C]===5")

    for k, v in grade_b:
        add(s, k, f"GRADE[me==B]==={v}")

    return s


# ---------------------------------------------------------------------------
# Build all items
# ---------------------------------------------------------------------------

FETCH_DIR = "temp_dp_fetch"

def load(item_id):
    with open(os.path.join(FETCH_DIR, f"{item_id}.json"), encoding="utf-8-sig") as f:
        return json.load(f)

items = {}

# ===== 38 Orrivane Weapons =================================================

# Helper: physical ACD weapon (ATK+3%, GCD@9+pAtk)
def phys_acd(skill, r7, crown, r11_skill2=None, set_extra=None, grade_a_cd=None, grade_a_extra=None, skill_base=5, skill_r3=2, set_s1=10, set_s2=None):
    grade_a_set = grade_a_extra or [(skill, "10")]
    if grade_a_cd:
        return orrivane_weapon_script(skill, "atk_pct",
            r7_keys=[(r7, "15")], r9_keys=[("acd", "10"), ("pAtk", "3")],
            skill1_base=skill_base, skill1_r3=skill_r3,
            set_partner=crown, set_skill1=set_s1, set_skill2=set_s2, set_extra=set_extra,
            grade_a_set=grade_a_set, grade_a_set_cd=grade_a_cd)
    return orrivane_weapon_script(skill, "atk_pct",
        r7_keys=[(r7, "15")], r9_keys=[("acd", "10"), ("pAtk", "3")],
        skill1_base=skill_base, skill1_r3=skill_r3,
        set_partner=crown, set_skill1=set_s1, set_skill2=set_s2, set_extra=set_extra,
        grade_a_set=grade_a_set)

# Helper: physical VCT weapon (VCT@9+pAtk) - Dragon Lance
def phys_vct(skill, r7, crown, grade_a_extra=None):
    grade_a_set = grade_a_extra or [(skill, "10")]
    return orrivane_weapon_script(skill, "atk_pct",
        r7_keys=[(r7, "15")], r9_keys=[("vct", "10"), ("pAtk", "3")],
        set_partner=crown, set_skill1=10, set_extra=None,
        grade_a_set=grade_a_set)

# Helper: physical CRI weapon (criDmg@7, CRI+cRate@9)
def phys_crit(skill, r7_extra=None, crown=None, set_extra=None, grade_a_extra=None,
              grade_a_cd=None, skill_base=5, set_s1=10, set_s2=None):
    r7 = [("criDmg", "15")]
    if r7_extra:
        r7 += r7_extra
    grade_a_set = grade_a_extra or [(skill, "10")]
    if grade_a_cd:
        return orrivane_weapon_script(skill, "atk_crit",
            r7_keys=r7, r9_keys=[("cri", "10"), ("cRate", "3")],
            skill1_base=skill_base,
            set_partner=crown, set_skill1=set_s1, set_skill2=set_s2, set_extra=set_extra,
            grade_a_set=grade_a_set, grade_a_set_cd=grade_a_cd)
    return orrivane_weapon_script(skill, "atk_crit",
        r7_keys=r7, r9_keys=[("cri", "10"), ("cRate", "3")],
        skill1_base=skill_base,
        set_partner=crown, set_skill1=set_s1, set_skill2=set_s2, set_extra=set_extra,
        grade_a_set=grade_a_set)

# Helper: magic MATK weapon (VCT@9+sMatk)
def magic_matk(skill, r7, crown, element_set=None, grade_a_extra=None, skill_r3=2,
               grade_a_cd=None, skill_base=5, base="matk"):
    grade_a_set = grade_a_extra or [(skill, "10")]
    r7_key = ELEM_MAP.get(r7, r7) if r7 != "m_element_all" else "m_element_all"
    set_extra = [(r7_key, "10")] if element_set else None
    if element_set and element_set != r7:
        set_extra = [(ELEM_MAP.get(element_set, element_set), "10")]
    if grade_a_cd:
        return orrivane_weapon_script(skill, base,
            r7_keys=[(r7_key, "15")], r9_keys=[("vct", "10"), ("sMatk", "3")],
            skill1_base=skill_base, skill1_r3=skill_r3,
            set_partner=crown, set_skill1=10, set_extra=set_extra,
            grade_a_set=grade_a_set, grade_a_set_cd=grade_a_cd)
    return orrivane_weapon_script(skill, base,
        r7_keys=[(r7_key, "15")], r9_keys=[("vct", "10"), ("sMatk", "3")],
        skill1_base=skill_base, skill1_r3=skill_r3,
        set_partner=crown, set_skill1=10, set_extra=set_extra,
        grade_a_set=grade_a_set)

# --- Swords ---
def make_500139():
    raw = load(500139)
    item = build_base(raw)
    # Cross Rain+Genesis Ray, MATK+200+3%, special set
    s = {}
    add(s, "matk", "200"); add(s, "matkPercent", "3")
    add(s, "Cross Rain", "5")
    add(s, "matk", "REFINE[weapon==2]---10"); add(s, "matkPercent", "REFINE[weapon==2]---1")
    add(s, "Cross Rain", "REFINE[weapon==3]---2"); add(s, "Genesis Ray", "REFINE[weapon==3]---5")
    add(s, "m_element_holy", "7===15"); add(s, "m_element_neutral", "7===15")
    add(s, "vct", "9===10"); add(s, "cd__Genesis Ray", "9===1")
    add(s, "Cross Rain", "11===10"); add(s, "Genesis Ray", "11===20")
    c = "Orrivane Crown (Imperial Guard)"
    add(s, "Cross Rain", f"EQUIP[{c}]===10"); add(s, "Genesis Ray", f"EQUIP[{c}]===20")
    add(s, "m_element_holy", f"EQUIP[{c}]===5"); add(s, "m_element_neutral", f"EQUIP[{c}]===5")
    cond = f"EQUIP[{c}]GRADE[headUpper==A]REFINE[weapon,headUpper==22]==="
    add(s, "cd__Cross Rain", f"{cond}1"); add(s, "Cross Rain", f"{cond}10"); add(s, "Genesis Ray", f"{cond}30")
    add(s, "sMatk", "GRADE[me==D]===2"); add(s, "Cross Rain", "GRADE[me==C]===10")
    add(s, "m_element_holy", "GRADE[me==B]===10"); add(s, "m_element_neutral", "GRADE[me==B]===10")
    add(s, "sMatk", "GRADE[me==A]REFINE[weapon==2]---2")
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_500140():
    raw = load(500140)
    item = build_base(raw)
    # CRI+5, Mayhemic Thorns, criDmg@7, CRI+10+cRate@9, set: skill+10+range+5
    s = phys_crit("Mayhemic Thorns", crown="Orrivane Crown (Biolo)",
                  set_extra=[("range", "5")],
                  grade_a_extra=[("Mayhemic Thorns", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_500141():
    raw = load(500141)
    item = build_base(raw)
    # CRI+5 (different: base skill +10!), Mega Sonic Blow
    s = {}
    add(s, "cri", "5"); add(s, "Mega Sonic Blow", "10")
    add(s, "atk", "REFINE[weapon==2]---10"); add(s, "atkPercent", "REFINE[weapon==2]---1")
    add(s, "Mega Sonic Blow", "REFINE[weapon==3]---2")
    add(s, "criDmg", "7===15")
    add(s, "cri", "9===15"); add(s, "cRate", "9===3")  # CRI+15 not +10 here!
    add(s, "Mega Sonic Blow", "11===10")
    c = "Orrivane Crown (Hyper Novice)"
    add(s, "Mega Sonic Blow", f"EQUIP[{c}]===10"); add(s, "melee", f"EQUIP[{c}]===5")
    cond = f"EQUIP[{c}]GRADE[headUpper==A]REFINE[weapon,headUpper==22]==="
    add(s, "Mega Sonic Blow", f"{cond}10")
    add(s, "pAtk", "GRADE[me==D]===2"); add(s, "Mega Sonic Blow", "GRADE[me==C]===10")
    add(s, "melee", "GRADE[me==B]===10"); add(s, "pAtk", "GRADE[me==A]REFINE[weapon==2]---2")
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_510160():
    raw = load(510160)
    item = build_base(raw)
    s = phys_acd("Deft Stab", "melee", "Orrivane Crown (Abyss Chaser)",
                 set_extra=[("melee", "5")], grade_a_extra=[("Deft Stab", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_530083():
    raw = load(530083)
    item = build_base(raw)
    # Overslash+Overbrand, ATK+3%, melee@7, GCD@9
    s = {}
    add(s, "atkPercent", "3"); add(s, "Overslash", "5")
    add(s, "atk", "REFINE[weapon==2]---10"); add(s, "atkPercent", "REFINE[weapon==2]---1")
    add(s, "Overslash", "REFINE[weapon==3]---2"); add(s, "Overbrand", "REFINE[weapon==3]---5")
    add(s, "melee", "7===15")
    add(s, "acd", "9===10"); add(s, "pAtk", "9===3")
    add(s, "Overslash", "11===10"); add(s, "Overbrand", "11===20")
    c = "Orrivane Crown (Imperial Guard)"
    add(s, "Overslash", f"EQUIP[{c}]===10"); add(s, "Overbrand", f"EQUIP[{c}]===20")
    add(s, "melee", f"EQUIP[{c}]===10")
    cond = f"EQUIP[{c}]GRADE[headUpper==A]REFINE[weapon,headUpper==22]==="
    add(s, "cd__Overslash", f"{cond}0.3"); add(s, "Overslash", f"{cond}10"); add(s, "Overbrand", f"{cond}30")
    add(s, "pAtk", "GRADE[me==D]===2"); add(s, "Overslash", "GRADE[me==C]===10")
    add(s, "melee", "GRADE[me==B]===10"); add(s, "pAtk", "GRADE[me==A]REFINE[weapon==2]---2")
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Books ---
def make_540128():
    raw = load(540128)
    item = build_base(raw)
    # CRI+5, Petitio, criDmg@7, CRI+cRate@9, set: Petitio+10+melee+5
    s = phys_crit("Petitio", crown="Orrivane Crown (Cardinal)",
                  set_extra=[("melee", "5")], grade_a_extra=[("Petitio", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_540129():
    raw = load(540129)
    item = build_base(raw)
    # MATK+200+3%, Lightning Land, r7 m_element_all, r3 skill+5%, set: skill+10+Wind+10
    s = magic_matk("Lightning Land", "m_element_all", "Orrivane Crown (Elemental Master)",
                   element_set="Wind", skill_r3=5)
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_540130():
    raw = load(540130)
    item = build_base(raw)
    # MATK+200+3%, Venom Swamp, r7 m_element_all, r3 skill+5%, set: skill+10+Poison+10
    s = magic_matk("Venom Swamp", "m_element_all", "Orrivane Crown (Elemental Master)",
                   element_set="Poison", skill_r3=5)
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_540131():
    raw = load(540131)
    item = build_base(raw)
    # ATK+3%, Star Cannon, melee@7, GCD@9
    # Grade A set: Autospell Twinkling Galaxy (skip - not encodable) + skill+10
    s = phys_acd("Star Cannon", "melee", "Orrivane Crown (Sky Emperor)",
                 set_extra=[("melee", "5")], grade_a_extra=[("Star Cannon", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_540132():
    raw = load(540132)
    item = build_base(raw)
    # CRI+5, Noon Blast, criDmg@7, CRI+cRate@9
    s = phys_crit("Noon Blast", crown="Orrivane Crown (Sky Emperor)",
                  set_extra=[("melee", "5")], grade_a_extra=[("Noon Blast", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Wands/Foxtails ---
def make_550201():
    raw = load(550201)
    item = build_base(raw)
    # MATK+200+3%, Arbitrium, Holy@7, r3+2, set: skill+10+Holy+10, grade_a: cd+0.3+skill+10
    s = {}
    add(s, "matk", "200"); add(s, "matkPercent", "3"); add(s, "Arbitrium", "5")
    add(s, "matk", "REFINE[weapon==2]---10"); add(s, "matkPercent", "REFINE[weapon==2]---1")
    add(s, "Arbitrium", "REFINE[weapon==3]---2")
    add(s, "m_element_holy", "7===15")
    add(s, "vct", "9===10"); add(s, "sMatk", "9===3")
    add(s, "Arbitrium", "11===10")
    c = "Orrivane Crown (Cardinal)"
    add(s, "Arbitrium", f"EQUIP[{c}]===10"); add(s, "m_element_holy", f"EQUIP[{c}]===10")
    cond = f"EQUIP[{c}]GRADE[headUpper==A]REFINE[weapon,headUpper==22]==="
    add(s, "cd__Arbitrium", f"{cond}0.3"); add(s, "Arbitrium", f"{cond}10")
    add(s, "sMatk", "GRADE[me==D]===2"); add(s, "Arbitrium", "GRADE[me==C]===10")
    add(s, "m_element_holy", "GRADE[me==B]===10"); add(s, "sMatk", "GRADE[me==A]REFINE[weapon==2]---2")
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_550202():
    raw = load(550202)
    item = build_base(raw)
    # MATK+200+3%, Crimson Arrow, m_element_all@7, r3+5%, set: skill+10+Fire+10
    s = magic_matk("Crimson Arrow", "m_element_all", "Orrivane Crown (Arch Mage)",
                   element_set="Fire", skill_r3=5)
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_550203():
    raw = load(550203)
    item = build_base(raw)
    # MATK+200+3%, Talisman of Four Bearing God, m_element_all@7, r3+5%, set: skill+10+all+10
    s = magic_matk("Talisman of Four Bearing God", "m_element_all",
                   "Orrivane Crown (Soul Ascetic)", element_set=None, skill_r3=5)
    # fix set_extra - no element, just m_element_all
    s_new = {}
    for k, v in s.items():
        s_new[k] = v[:]
    item["script"] = s_new; item["itemLevel"] = 5
    return item

def make_550204():
    raw = load(550204)
    item = build_base(raw)
    s = magic_matk("Exorcism of Malicious Soul", "m_element_all",
                   "Orrivane Crown (Soul Ascetic)", element_set=None, skill_r3=5)
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_550205():
    raw = load(550205)
    item = build_base(raw)
    # MATK+200+3%, Jack Frost Nova, m_element_all@7, r3+2
    s = magic_matk("Jack Frost Nova", "m_element_all",
                   "Orrivane Crown (Hyper Novice)", element_set=None, skill_r3=2)
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_550206():
    raw = load(550206)
    item = build_base(raw)
    # Hogogong Strike, MATK+200+3%, m_element_all@7, r3+2
    s = magic_matk("Hogogong Strike", "m_element_all",
                   "Orrivane Crown (Spirit Handler)", element_set=None, skill_r3=2)
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_550207():
    raw = load(550207)
    item = build_base(raw)
    # Hyunrok Breeze, MATK+300(!) +3%, m_element_all@7, r3+2
    s = magic_matk("Hyunrok Breeze", "m_element_all",
                   "Orrivane Crown (Spirit Handler)", element_set=None, skill_r3=2,
                   base="matk_300")
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Knuckles ---
def make_560091():
    raw = load(560091)
    item = build_base(raw)
    # ATK+3%, Third Flame Bomb, melee@7, GCD@9
    s = phys_acd("Third Flame Bomb", "melee", "Orrivane Crown (Inquisitor)",
                 set_extra=[("melee", "5")], grade_a_extra=[("Third Flame Bomb", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_560092():
    raw = load(560092)
    item = build_base(raw)
    # CRI+5, Explosion Blaster, criDmg@7, CRI+cRate@9, set: skill+10+range+5
    s = phys_crit("Explosion Blaster", crown="Orrivane Crown (Inquisitor)",
                  set_extra=[("range", "5")], grade_a_extra=[("Explosion Blaster", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Instruments/Whips ---
def make_570094():
    raw = load(570094)
    item = build_base(raw)
    # MATK+200+3%, Metalic Fury, m_element_all@7, r3+5
    s = magic_matk("Metalic Fury", "m_element_all",
                   "Orrivane Crown (Troubadour & Trouvere)", element_set=None, skill_r3=5,
                   grade_a_cd="0.1")
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_570095():
    raw = load(570095)
    item = build_base(raw)
    # ATK+3%, Rhythm Shooting, range@7, GCD@9
    s = phys_acd("Rhythm Shooting", "range", "Orrivane Crown (Troubadour & Trouvere)",
                 set_extra=[("range", "5")], grade_a_extra=[("range", "10"), ("Rhythm Shooting", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_580094():
    raw = load(580094)
    item = build_base(raw)
    # Whip version = same as Harp
    s = phys_acd("Rhythm Shooting", "range", "Orrivane Crown (Troubadour & Trouvere)",
                 set_extra=[("range", "5")], grade_a_extra=[("range", "10"), ("Rhythm Shooting", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_580095():
    raw = load(580095)
    item = build_base(raw)
    # Ribbon = same as Violin (Metalic Fury, MATK)
    s = magic_matk("Metalic Fury", "m_element_all",
                   "Orrivane Crown (Troubadour & Trouvere)", element_set=None, skill_r3=5,
                   grade_a_cd="0.1")
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Maces/Scepters ---
def make_590119():
    raw = load(590119)
    item = build_base(raw)
    # ATK+3%, Spark Blaster, range@7, GCD@9
    s = phys_acd("Spark Blaster", "range", "Orrivane Crown (Meister)",
                 set_extra=[("range", "5")], grade_a_extra=[("Spark Blaster", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_590120():
    raw = load(590120)
    item = build_base(raw)
    # ATK+3%, Explosive Powder, melee@7, GCD@9
    s = phys_acd("Explosive Powder", "melee", "Orrivane Crown (Biolo)",
                 set_extra=[("melee", "5")], grade_a_extra=[("Explosive Powder", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Two-handed swords/Katars ---
def make_600079():
    raw = load(600079)
    item = build_base(raw)
    # CRI+5, Hack and Slasher, criDmg@7, CRI+10+cRate@9, set: skill+10+melee+5, grade_a: cd+0.1+skill+10
    s = phys_crit("Hack and Slasher", crown="Orrivane Crown (Dragon Knight)",
                  set_extra=[("melee", "5")], grade_a_extra=[("Hack and Slasher", "10")],
                  grade_a_cd="0.1")
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_610094():
    raw = load(610094)
    item = build_base(raw)
    # CRI+5, Savage Impact, criDmg@7, CRI+10+cRate@9, grade_a: cd+0.1+skill+10
    s = phys_crit("Savage Impact", crown="Orrivane Crown (Shadow Cross)",
                  set_extra=[("melee", "5")], grade_a_extra=[("Savage Impact", "10")],
                  grade_a_cd="0.1")
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_610095():
    raw = load(610095)
    item = build_base(raw)
    # CRI+5, Eternal Slash, criDmg@7, CRI+10+cRate@9
    s = phys_crit("Eternal Slash", crown="Orrivane Crown (Shadow Cross)",
                  set_extra=[("melee", "5")], grade_a_extra=[("Eternal Slash", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Axes ---
def make_620066():
    raw = load(620066)
    item = build_base(raw)
    # ATK+3%, Mighty Smash, melee@7, GCD@9, grade_a: cd+0.1+skill+10
    s = phys_acd("Mighty Smash", "melee", "Orrivane Crown (Meister)",
                 set_extra=[("melee", "10")], grade_a_extra=[("Mighty Smash", "10")],
                 grade_a_cd="0.1")
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Spears ---
def make_630067():
    raw = load(630067)
    item = build_base(raw)
    # No base ATK%, Dragonic Breath, r3+2, range@7, VCT+pAtk@9
    s = {}
    add(s, "Dragonic Breath", "5")  # base from description
    add(s, "atk", "REFINE[weapon==2]---10"); add(s, "atkPercent", "REFINE[weapon==2]---1")
    add(s, "Dragonic Breath", "REFINE[weapon==3]---2")
    add(s, "range", "7===15")
    add(s, "vct", "9===10"); add(s, "pAtk", "9===3")
    add(s, "Dragonic Breath", "11===10")
    c = "Orrivane Crown (Dragon Knight)"
    add(s, "Dragonic Breath", f"EQUIP[{c}]===10"); add(s, "range", f"EQUIP[{c}]===5")
    cond = f"EQUIP[{c}]GRADE[headUpper==A]REFINE[weapon,headUpper==22]==="
    add(s, "Dragonic Breath", f"{cond}10")
    add(s, "pAtk", "GRADE[me==D]===2"); add(s, "Dragonic Breath", "GRADE[me==C]===10")
    add(s, "range", "GRADE[me==B]===10"); add(s, "pAtk", "GRADE[me==A]REFINE[weapon==2]---2")
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Staves ---
def make_640070():
    raw = load(640070)
    item = build_base(raw)
    # MATK+200+3%, Mystery Illusion, m_element_all@7, r3+2%, set: skill+10+Shadow+10
    s = magic_matk("Mystery Illusion", "m_element_all", "Orrivane Crown (Arch Mage)",
                   element_set="Shadow", skill_r3=2)
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Shurikens/Huuma ---
def make_650063():
    raw = load(650063)
    item = build_base(raw)
    # MATK+200+3%, Cold Blooded Cannon, m_element_all@7, r3+5, set: skill+10+Water+10
    # subTypeId from API is 0, should be Huuma Shuriken type
    raw["itemSubTypeId"] = 278  # correct to Huuma Shuriken
    item = build_base(raw)
    s = magic_matk("Cold Blooded Cannon", "m_element_all",
                   "Orrivane Crown (Shinkiro & Shiranui)", element_set="Water", skill_r3=5)
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_650064():
    raw = load(650064)
    item = build_base(raw)
    # CRI+5, Shadow Flash, criDmg@7, CRI+10+cRate@9, set: skill+10+melee+5
    raw["itemSubTypeId"] = 278
    item = build_base(raw)
    s = phys_crit("Shadow Flash", crown="Orrivane Crown (Shinkiro & Shiranui)",
                  set_extra=[("melee", "5")], grade_a_extra=[("Shadow Flash", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Bows ---
def make_700133():
    raw = load(700133)
    item = build_base(raw)
    # CRI+5, Frenzy Shot, criDmg@7, CRI+10+cRate@9, set: skill+10+range+5
    s = phys_crit("Frenzy Shot", crown="Orrivane Crown (Abyss Chaser)",
                  set_extra=[("range", "5")], grade_a_extra=[("Frenzy Shot", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_700134():
    raw = load(700134)
    item = build_base(raw)
    # ATK+3%, Gale Storm, range@7, GCD@9
    s = phys_acd("Gale Storm", "range", "Orrivane Crown (Wind Hawk)",
                 set_extra=[("range", "5")], grade_a_extra=[("range", "10"), ("Gale Storm", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_700135():
    raw = load(700135)
    item = build_base(raw)
    # ATK+3%, Crescive Bolt, range@7, GCD@9, grade_a: cd+0.1+skill+10
    s = phys_acd("Crescive Bolt", "range", "Orrivane Crown (Wind Hawk)",
                 set_extra=[("range", "5")], grade_a_extra=[("Crescive Bolt", "10")])
    item["script"] = s; item["itemLevel"] = 5
    return item

# --- Guns ---
def make_800050():
    raw = load(800050)
    item = build_base(raw)
    # CRI+5, Magazine for One, criDmg@7, CRI+10+cRate@9, set: skill+5+range+5 (note +5 not +10!)
    s = {}
    add(s, "cri", "5"); add(s, "Magazine for One", "5")
    add(s, "atk", "REFINE[weapon==2]---10"); add(s, "atkPercent", "REFINE[weapon==2]---1")
    add(s, "Magazine for One", "REFINE[weapon==3]---2")
    add(s, "criDmg", "7===15")
    add(s, "cri", "9===10"); add(s, "cRate", "9===3")
    add(s, "Magazine for One", "11===10")
    c = "Orrivane Crown (Night Watch)"
    add(s, "Magazine for One", f"EQUIP[{c}]===5")  # only +5 for set!
    add(s, "range", f"EQUIP[{c}]===5")
    cond = f"EQUIP[{c}]GRADE[headUpper==A]REFINE[weapon,headUpper==22]==="
    add(s, "Magazine for One", f"{cond}10")
    add(s, "pAtk", "GRADE[me==D]===2"); add(s, "Magazine for One", "GRADE[me==C]===10")
    add(s, "range", "GRADE[me==B]===10"); add(s, "pAtk", "GRADE[me==A]REFINE[weapon==2]---2")
    item["script"] = s; item["itemLevel"] = 5
    return item

def make_830048():
    raw = load(830048)
    item = build_base(raw)
    # ATK+3%, The Vigilante at Night, range@7, GCD@9, grade_a: cd+0.1+skill+10
    s = phys_acd("The Vigilante at Night", "range", "Orrivane Crown (Night Watch)",
                 set_extra=[("range", "5")], grade_a_extra=[("The Vigilante at Night", "10")],
                 grade_a_cd="0.1")
    item["script"] = s; item["itemLevel"] = 5
    return item

# ===== 18 Orrivane Crowns ==================================================

def make_crown(item_id, skill1, skill2, r7_keys, r9_keys, r11_keys, grade_d, grade_b, grade_db_both=False):
    raw = load(item_id)
    item = build_base(raw)
    item["itemLevel"] = 2
    item["script"] = orrivane_crown_script(skill1, skill2, r7_keys, r9_keys, r11_keys,
                                            grade_d, grade_b, grade_db_both)
    return item

def crowns():
    c = {}
    # 401265: Dragon Knight - Hack and Slasher + Dragonic Breath
    # r7: melee+range, r9: pAtk+5+atkPct+5, r11: p_size_all+10
    c[401265] = make_crown(401265, "Hack and Slasher", "Dragonic Breath",
        r7_keys=[("melee", "10"), ("range", "10")],
        r9_keys=[("pAtk", "5"), ("atkPercent", "5")],
        r11_keys=[("p_size_all", "10")],
        grade_d=[("pAtk", "5")], grade_b=[("p_race_all", "10")])

    # 401266: Imperial Guard - Overslash + Cross Rain (hybrid)
    # r7: melee+10 + m_element_all+10, r9: pAtk+sMatk+5 + atk+matk+5%, r11: p_size+m_size+10
    c[401266] = make_crown(401266, "Overslash", "Cross Rain",
        r7_keys=[("melee", "10"), ("m_element_all", "10")],
        r9_keys=[("pAtk", "5"), ("sMatk", "5"), ("atkPercent", "5"), ("matkPercent", "5")],
        r11_keys=[("p_size_all", "10"), ("m_size_all", "10")],
        grade_d=[("pAtk", "5"), ("sMatk", "5")], grade_b=[("p_race_all", "10"), ("m_race_all", "10")],
        grade_db_both=True)

    # 401267: Meister - Mighty Smash + Spark Blaster
    c[401267] = make_crown(401267, "Mighty Smash", "Spark Blaster",
        r7_keys=[("melee", "10"), ("range", "10")],
        r9_keys=[("pAtk", "5"), ("atkPercent", "5")],
        r11_keys=[("p_size_all", "10")],
        grade_d=[("pAtk", "5")], grade_b=[("p_race_all", "10")])

    # 401268: Biolo - Explosive Powder + Mayhemic Thorns
    c[401268] = make_crown(401268, "Explosive Powder", "Mayhemic Thorns",
        r7_keys=[("melee", "10"), ("range", "10")],
        r9_keys=[("pAtk", "5"), ("atkPercent", "5")],
        r11_keys=[("p_size_all", "10")],
        grade_d=[("pAtk", "5")], grade_b=[("p_race_all", "10")])

    # 401269: Shadow Cross - Eternal Slash + Savage Impact, r7 melee only
    c[401269] = make_crown(401269, "Eternal Slash", "Savage Impact",
        r7_keys=[("melee", "10")],
        r9_keys=[("pAtk", "5"), ("atkPercent", "5")],
        r11_keys=[("p_size_all", "10")],
        grade_d=[("pAtk", "5")], grade_b=[("p_race_all", "10")])

    # 401270: Abyss Chaser - Deft Stab + Frenzy Shot, r7 melee+range
    c[401270] = make_crown(401270, "Deft Stab", "Frenzy Shot",
        r7_keys=[("melee", "10"), ("range", "10")],
        r9_keys=[("pAtk", "5"), ("atkPercent", "5")],
        r11_keys=[("p_size_all", "10")],
        grade_d=[("pAtk", "5")], grade_b=[("p_race_all", "10")])

    # 401271: Cardinal - Petitio + Arbitrium (hybrid)
    c[401271] = make_crown(401271, "Petitio", "Arbitrium",
        r7_keys=[("melee", "10"), ("range", "10"), ("m_element_all", "10")],
        r9_keys=[("pAtk", "5"), ("sMatk", "5"), ("atkPercent", "5"), ("matkPercent", "5")],
        r11_keys=[("p_size_all", "10"), ("m_size_all", "10")],
        grade_d=[("pAtk", "5"), ("sMatk", "5")], grade_b=[("p_race_all", "10"), ("m_race_all", "10")],
        grade_db_both=True)

    # 401272: Inquisitor - Third Flame Bomb + Explosion Blaster
    c[401272] = make_crown(401272, "Third Flame Bomb", "Explosion Blaster",
        r7_keys=[("melee", "10"), ("range", "10")],
        r9_keys=[("pAtk", "5"), ("atkPercent", "5")],
        r11_keys=[("p_size_all", "10")],
        grade_d=[("pAtk", "5")], grade_b=[("p_race_all", "10")])

    # 401273: Arch Mage - Mystery Illusion + Crimson Arrow (magic only)
    c[401273] = make_crown(401273, "Mystery Illusion", "Crimson Arrow",
        r7_keys=[("m_element_all", "10")],
        r9_keys=[("sMatk", "5"), ("matkPercent", "5")],
        r11_keys=[("m_size_all", "10")],
        grade_d=[("sMatk", "5")], grade_b=[("m_race_all", "10")])

    # 401274: Elemental Master - Lightning Land + Venom Swamp (magic only)
    c[401274] = make_crown(401274, "Lightning Land", "Venom Swamp",
        r7_keys=[("m_element_all", "10")],
        r9_keys=[("sMatk", "5"), ("matkPercent", "5")],
        r11_keys=[("m_size_all", "10")],
        grade_d=[("sMatk", "5")], grade_b=[("m_race_all", "10")])

    # 401275: Wind Hawk - Crescive Bolt + Gale Storm, r7 range only
    c[401275] = make_crown(401275, "Crescive Bolt", "Gale Storm",
        r7_keys=[("range", "10")],
        r9_keys=[("pAtk", "5"), ("atkPercent", "5")],
        r11_keys=[("p_size_all", "10")],
        grade_d=[("pAtk", "5")], grade_b=[("p_race_all", "10")])

    # 401276: Troubadour & Trouvere - Metalic Fury + Rhythm Shooting (hybrid)
    c[401276] = make_crown(401276, "Metalic Fury", "Rhythm Shooting",
        r7_keys=[("range", "10"), ("m_element_all", "10")],
        r9_keys=[("pAtk", "5"), ("sMatk", "5"), ("atkPercent", "5"), ("matkPercent", "5")],
        r11_keys=[("p_size_all", "10"), ("m_size_all", "10")],
        grade_d=[("pAtk", "5"), ("sMatk", "5")], grade_b=[("p_race_all", "10"), ("m_race_all", "10")],
        grade_db_both=True)

    # 401277: Sky Emperor - Noon Blast + Star Cannon, r7 melee only
    c[401277] = make_crown(401277, "Noon Blast", "Star Cannon",
        r7_keys=[("melee", "10")],
        r9_keys=[("pAtk", "5"), ("atkPercent", "5")],
        r11_keys=[("p_size_all", "10")],
        grade_d=[("pAtk", "5")], grade_b=[("p_race_all", "10")])

    # 401278: Soul Ascetic - Talisman of Four Bearing God + Exorcism of Malicious Soul (magic)
    c[401278] = make_crown(401278, "Talisman of Four Bearing God", "Exorcism of Malicious Soul",
        r7_keys=[("m_element_all", "10")],
        r9_keys=[("sMatk", "5"), ("matkPercent", "5")],
        r11_keys=[("m_size_all", "10")],
        grade_d=[("sMatk", "5")], grade_b=[("m_race_all", "10")])

    # 401279: Night Watch - The Vigilante at Night + Magazine for One, r7 range only
    c[401279] = make_crown(401279, "The Vigilante at Night", "Magazine for One",
        r7_keys=[("range", "10")],
        r9_keys=[("pAtk", "5"), ("atkPercent", "5")],
        r11_keys=[("p_size_all", "10")],
        grade_d=[("pAtk", "5")], grade_b=[("p_race_all", "10")])

    # 401280: Shinkiro & Shiranui - Shadow Flash + Cold Blooded Cannon (hybrid, melee+magic)
    c[401280] = make_crown(401280, "Shadow Flash", "Cold Blooded Cannon",
        r7_keys=[("melee", "10"), ("m_element_all", "10")],
        r9_keys=[("pAtk", "5"), ("sMatk", "5"), ("atkPercent", "5"), ("matkPercent", "5")],
        r11_keys=[("p_size_all", "10"), ("m_size_all", "10")],
        grade_d=[("pAtk", "5"), ("sMatk", "5")], grade_b=[("p_race_all", "10"), ("m_race_all", "10")],
        grade_db_both=True)

    # 401281: Hyper Novice - Mega Sonic Blow + Jack Frost Nova (hybrid, melee+magic)
    c[401281] = make_crown(401281, "Mega Sonic Blow", "Jack Frost Nova",
        r7_keys=[("melee", "10"), ("m_element_all", "10")],
        r9_keys=[("pAtk", "5"), ("sMatk", "5"), ("atkPercent", "5"), ("matkPercent", "5")],
        r11_keys=[("p_size_all", "10"), ("m_size_all", "10")],
        grade_d=[("pAtk", "5"), ("sMatk", "5")], grade_b=[("p_race_all", "10"), ("m_race_all", "10")],
        grade_db_both=True)

    # 401282: Spirit Handler - Hogogong Strike + Hyunrok Breeze (hybrid, range+magic)
    c[401282] = make_crown(401282, "Hogogong Strike", "Hyunrok Breeze",
        r7_keys=[("range", "10"), ("m_element_all", "10")],
        r9_keys=[("pAtk", "5"), ("sMatk", "5"), ("atkPercent", "5"), ("matkPercent", "5")],
        r11_keys=[("p_size_all", "10"), ("m_size_all", "10")],
        grade_d=[("pAtk", "5"), ("sMatk", "5")], grade_b=[("p_race_all", "10"), ("m_race_all", "10")],
        grade_db_both=True)

    return c

# ===== Special headgear / accessories ======================================

def make_401390():
    """[6th] Ayothaya Helm - time-limited event headgear."""
    raw = load(401390)
    item = build_base(raw)
    item["itemLevel"] = None  # no level armor line in description
    s = {}
    add(s, "mhp", "1000"); add(s, "msp", "200")
    add(s, "atk",  "REFINE[headUpper==2]---10")
    add(s, "matk", "REFINE[headUpper==2]---10")
    # r7: (skill Greed - not encodable)
    add(s, "vct",  "9===10"); add(s, "aspdPercent", "9===10")
    add(s, "acd",  "11===10")
    add(s, "p_size_all", "16===6"); add(s, "m_size_all", "16===6")
    # time-limited bonuses (expire 2026-07-15)
    TL = "TIME[2026-07-15]"
    add(s, "fct",       f"{TL}0.5")
    add(s, "pAtk",      f"{TL}10")
    add(s, "sMatk",     f"{TL}10")
    add(s, "p_size_all",f"{TL}15")
    add(s, "m_size_all",f"{TL}15")
    add(s, "p_element_all", f"{TL}15")
    add(s, "m_element_all", f"{TL}15")
    item["script"] = s
    return item

def make_410657():
    """Eye of Necromancer [1] - Middle headgear."""
    raw = load(410657)
    item = build_base(raw)
    item["itemLevel"] = None
    s = {}
    add(s, "acd", "10")
    # per 20 (str+dex), hitDmg +1%  → SUM[str,dex==20]---1
    add(s, "hitDmg", "SUM[str,dex==20]---1")
    # per 1 CON, ATK+1 → con:1---1
    add(s, "atk", "con:1---1")
    add(s, "hitDmg", "10")
    add(s, "p_element_all", "10")
    item["script"] = s
    return item

def make_460166():
    """Falling Star Shield [1] - Sky Emperor shield."""
    raw = load(460166)
    item = build_base(raw)
    item["itemLevel"] = None
    s = {}
    add(s, "cri", "15")
    # damage reduction received: not encoded (defensive)
    add(s, "aspd", "7===2"); add(s, "hpPercent", "7===10")
    add(s, "cd__Twinkling Galaxy", "9===0.8"); add(s, "cd__Star Cannon", "9===0.3")
    add(s, "acd", "11===10"); add(s, "melee", "11===20")
    add(s, "Twinkling Galaxy", "12===20"); add(s, "Star Cannon", "12===20")
    add(s, "cd__Twinkling Galaxy", "GRADE[me==D]===0.5")
    add(s, "cri", "GRADE[me==C]===15"); add(s, "pAtk", "GRADE[me==C]===4")
    add(s, "mhp", "GRADE[me==B]===5000"); add(s, "pAtk", "GRADE[me==B]===6")
    add(s, "p_size_all", "GRADE[me==A]===20")
    item["script"] = s
    return item

def make_470442():
    """Ayothaya Adventurer's Boots [1]."""
    raw = load(470442)
    item = build_base(raw)
    item["itemLevel"] = None
    s = {}
    add(s, "melee", "6"); add(s, "range", "6"); add(s, "matkPercent", "6")
    add(s, "aspdPercent", "10"); add(s, "hpPercent", "10"); add(s, "spPercent", "5")
    add(s, "atk",  "REFINE[boot==2]---10")
    add(s, "matk", "REFINE[boot==2]---10")
    add(s, "pAtk", "7===6"); add(s, "sMatk", "7===6")
    add(s, "vct",  "9===10"); add(s, "fct", "9===0.5")
    add(s, "p_element_all", "12===10"); add(s, "m_element_all", "12===10")
    # Set with 6th Anniversary Ayothaya Ring
    ring = "6th Anniversary Ayothaya Ring"
    add(s, "p_size_all", f"EQUIP[{ring}]===10")
    add(s, "m_size_all", f"EQUIP[{ring}]===10")
    # Grade bonuses
    add(s, "fct", "GRADE[me==D]===0.5")
    add(s, "hitDmg", "GRADE[me==C]===15"); add(s, "criDmg", "GRADE[me==C]===15")
    add(s, "m_element_all", "GRADE[me==C]===20")
    add(s, "pAtk", "GRADE[me==B]===6"); add(s, "sMatk", "GRADE[me==B]===6")
    add(s, "allStatus", "GRADE[me==A]REFINE[boot==1]---1")
    item["script"] = s
    return item

def make_490966():
    """6th Anniversary Ayothaya Ring [1]."""
    raw = load(490966)
    item = build_base(raw)
    item["itemLevel"] = 2
    s = {}
    add(s, "allStatus", "6"); add(s, "allTrait", "6")
    add(s, "melee", "REFINE[accLeft==1]---1"); add(s, "range", "REFINE[accLeft==1]---1")
    add(s, "matkPercent", "REFINE[accLeft==1]---1")
    add(s, "pAtk", "7===3"); add(s, "sMatk", "7===3")
    add(s, "acd", "9===10")
    add(s, "p_race_all", "12===10"); add(s, "m_race_all", "12===10")
    add(s, "fct", "GRADE[me==D]===0.3")
    # Grade C: resistance (skip - defensive)
    # Grade B: RES+60, MRES+60, PD+20 (defensive)
    add(s, "expBonus", "GRADE[me==A]===3")
    add(s, "p_pene_race_all", "GRADE[me==A]===40")
    add(s, "m_pene_race_all", "GRADE[me==A]===40")
    item["script"] = s
    return item

def make_491049():
    """Orrivane Ring (Wind Hawk) [1]."""
    raw = load(491049)
    item = build_base(raw)
    item["itemLevel"] = None
    s = {}
    add(s, "atk", "100"); add(s, "acd", "10"); add(s, "con", "10"); add(s, "cri", "15")
    add(s, "p_class_all", "15")
    c = "Orrivane Crown (Wind Hawk)"
    add(s, "p_size_all",   f"EQUIP[{c}]===15")
    add(s, "Gale Storm",   f"EQUIP[{c}]===20")
    add(s, "Crescive Bolt",f"EQUIP[{c}]===20")
    add(s, "p_element_all",f"EQUIP[{c}]REFINE[headUpper==10]===15")
    add(s, "Gale Storm",   f"EQUIP[{c}]REFINE[headUpper==10]===20")
    add(s, "Crescive Bolt",f"EQUIP[{c}]REFINE[headUpper==10]===20")
    add(s, "pAtk",         f"EQUIP[{c}]GRADE[headUpper==C]===10")
    add(s, "Gale Storm",   f"EQUIP[{c}]GRADE[headUpper==C]===20")
    add(s, "Crescive Bolt",f"EQUIP[{c}]GRADE[headUpper==C]===20")
    item["script"] = s
    return item

def make_491050():
    """Orrivane Ring (Abyss Chaser) [1]."""
    raw = load(491050)
    item = build_base(raw)
    item["itemLevel"] = None
    s = {}
    # Base: ATK+100, acd+10, POW+10, CON+10, hitDmg+10, CRI+15, p_class_all+15
    add(s, "atk", "100"); add(s, "acd", "10"); add(s, "pow", "10"); add(s, "con", "10")
    add(s, "hitDmg", "10"); add(s, "cri", "15")
    add(s, "p_class_all", "15")
    c = "Orrivane Crown (Abyss Chaser)"
    add(s, "p_size_all",   f"EQUIP[{c}]===15")
    add(s, "Deft Stab",    f"EQUIP[{c}]===20")
    add(s, "Frenzy Shot",  f"EQUIP[{c}]===20")
    add(s, "p_element_all",f"EQUIP[{c}]REFINE[headUpper==10]===15")
    add(s, "Deft Stab",    f"EQUIP[{c}]REFINE[headUpper==10]===20")
    add(s, "Frenzy Shot",  f"EQUIP[{c}]REFINE[headUpper==10]===20")
    add(s, "pAtk",         f"EQUIP[{c}]GRADE[headUpper==C]===10")
    add(s, "Deft Stab",    f"EQUIP[{c}]GRADE[headUpper==C]===20")
    add(s, "Frenzy Shot",  f"EQUIP[{c}]GRADE[headUpper==C]===20")
    item["script"] = s
    return item

def make_491051():
    """Orrivane Ring (Arch Mage) [1]."""
    raw = load(491051)
    item = build_base(raw)
    item["itemLevel"] = None
    s = {}
    add(s, "matk", "100"); add(s, "acd", "10"); add(s, "spl", "10"); add(s, "fct", "0.5")
    add(s, "m_class_all", "15")
    c = "Orrivane Crown (Arch Mage)"
    add(s, "m_size_all",     f"EQUIP[{c}]===15")
    add(s, "Mystery Illusion",f"EQUIP[{c}]===20")
    add(s, "Crimson Arrow",  f"EQUIP[{c}]===20")
    add(s, "m_element_all",  f"EQUIP[{c}]REFINE[headUpper==10]===15")
    add(s, "Mystery Illusion",f"EQUIP[{c}]REFINE[headUpper==10]===20")
    add(s, "Crimson Arrow",  f"EQUIP[{c}]REFINE[headUpper==10]===20")
    add(s, "sMatk",          f"EQUIP[{c}]GRADE[headUpper==C]===10")
    add(s, "Mystery Illusion",f"EQUIP[{c}]GRADE[headUpper==C]===20")
    add(s, "Crimson Arrow",  f"EQUIP[{c}]GRADE[headUpper==C]===20")
    item["script"] = s
    return item

def make_102126():
    """Amplify (Metal Detector MK47-2) - consumable/etc, minimal script."""
    raw = load(102126)
    item = build_base(raw)
    item["canGrade"] = False
    item["script"] = {}
    return item

# ===== Assemble =============================================================

weapon_makers = {
    500139: make_500139, 500140: make_500140, 500141: make_500141,
    510160: make_510160, 530083: make_530083,
    540128: make_540128, 540129: make_540129, 540130: make_540130,
    540131: make_540131, 540132: make_540132,
    550201: make_550201, 550202: make_550202, 550203: make_550203,
    550204: make_550204, 550205: make_550205, 550206: make_550206, 550207: make_550207,
    560091: make_560091, 560092: make_560092,
    570094: make_570094, 570095: make_570095,
    580094: make_580094, 580095: make_580095,
    590119: make_590119, 590120: make_590120,
    600079: make_600079, 610094: make_610094, 610095: make_610095,
    620066: make_620066, 630067: make_630067, 640070: make_640070,
    650063: make_650063, 650064: make_650064,
    700133: make_700133, 700134: make_700134, 700135: make_700135,
    800050: make_800050, 830048: make_830048,
}

for wid, fn in weapon_makers.items():
    item = fn()
    items[str(wid)] = item

for cid, item in crowns().items():
    items[str(cid)] = item

special = {
    401390: make_401390, 410657: make_410657,
    460166: make_460166, 470442: make_470442,
    490966: make_490966, 491049: make_491049,
    491050: make_491050, 491051: make_491051,
    102126: make_102126,
}
for sid, fn in special.items():
    items[str(sid)] = fn()

# ---------------------------------------------------------------------------
# Write output
# ---------------------------------------------------------------------------

out = json.dumps(items, ensure_ascii=False, indent=2)
with open("new_items.json", "w", encoding="utf-8") as f:
    f.write(out)

print(f"Generated {len(items)} items -> new_items.json")
for k, v in sorted(items.items(), key=lambda x: int(x[0])):
    print(f"  {k}: {v['name']}")
