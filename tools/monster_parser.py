#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import time
import requests

API_KEY = ""
OUTPUT_FILE = "monster_output.json"
REQUEST_DELAY_SEC = 0.2

BASE_URL = "https://www.divine-pride.net/api/database/monster/{monster_id}?apiKey={api_key}"

RACE_LIST = [
    "Formless", "Undead", "Brute", "Plant", "Insect",
    "Fish", "Demon", "Demihuman", "Angel", "Dragon"
]

ELEMENT_LIST = [
    "Neutral", "Water", "Earth", "Fire", "Wind",
    "Poison", "Holy", "Dark", "Ghost", "Undead"
]

SCALE_LIST = {0: "Small", 1: "Medium", 2: "Large"}


def parse_monster_ids(arg: str):
    """Accept a single id or a range like 1000-1010"""
    arg = arg.strip()
    if "-" in arg:
        a, b = arg.split("-", 1)
        start, end = int(a), int(b)
        step = 1 if end >= start else -1
        return list(range(start, end + step, step))
    return [int(arg)]


def fetch_monster(monster_id: int, session: requests.Session):
    url = BASE_URL.format(monster_id=monster_id, api_key=API_KEY)
    r = session.get(url, timeout=20)
    r.raise_for_status()
    return r.json()


def build_element_info(element_value: int):
    if element_value is None:
        return None, None
    try:
        level = int(element_value // 20)
        elem = int(element_value % 20)
        elem_name = ELEMENT_LIST[elem] if elem < len(ELEMENT_LIST) else f"Unknown({elem})"
        return f"{elem_name} {level}", elem_name
    except Exception:
        return None, None


def map_monster(data: dict) -> dict:
    mid = data.get("id")
    dbname = data.get("dbName") or data.get("dbname")
    name = data.get("name")

    stats_raw = data.get("stats", {})
    element_val = stats_raw.get("element")

    elementName, elementShort = build_element_info(element_val)

    # ถ้ามี spawn ให้เก็บ map name ตัวแรก ถ้าไม่มีเก็บ ""
    spawn_list = data.get("spawn", [])
    spawn_map = ""
    if isinstance(spawn_list, list) and len(spawn_list) > 0:
        spawn_map = spawn_list[0].get("mapname", "")

    stats = {
        "attackRange": stats_raw.get("attackRange"),
        "level": stats_raw.get("level"),
        "health": stats_raw.get("health"),
        "sp": stats_raw.get("sp"),
        "str": stats_raw.get("str"),
        "int": stats_raw.get("int"),
        "vit": stats_raw.get("vit"),
        "dex": stats_raw.get("dex"),
        "agi": stats_raw.get("agi"),
        "luk": stats_raw.get("luk"),
        "rechargeTime": stats_raw.get("rechargeTime"),
        "atk1": stats_raw.get("atk1"),
        "atk2": stats_raw.get("atk2"),
        "attack": {
            "minimum": stats_raw.get("attack", {}).get("minimum"),
            "maximum": stats_raw.get("attack", {}).get("maximum"),
        },
        "magicAttack": {
            "minimum": stats_raw.get("magicAttack", {}).get("minimum"),
            "maximum": stats_raw.get("magicAttack", {}).get("maximum"),
        },
        "defense": stats_raw.get("defense"),
        "baseExperience": stats_raw.get("baseExperience"),
        "jobExperience": stats_raw.get("jobExperience"),
        "aggroRange": stats_raw.get("aggroRange"),
        "escapeRange": stats_raw.get("escapeRange"),
        "movementSpeed": int(stats_raw.get("movementSpeed", 0)),
        "attackSpeed": int(stats_raw.get("attackSpeed", 0)),
        "attackedSpeed": int(stats_raw.get("attackedSpeed", 0)),
        "element": element_val,
        "scale": stats_raw.get("scale"),
        "race": stats_raw.get("race"),
        "magicDefense": stats_raw.get("magicDefense"),
        "hit": stats_raw.get("hit"),
        "flee": stats_raw.get("flee"),
        "ai": stats_raw.get("ai"),
        "mvp": stats_raw.get("mvp"),
        "class": stats_raw.get("class"),
        "attr": stats_raw.get("attr"),
        "res": stats_raw.get("res"),
        "mres": stats_raw.get("mres"),
        "elementName": elementName,
        "elementShortName": elementShort,
        "scaleName": SCALE_LIST.get(stats_raw.get("scale")),
        "raceName": RACE_LIST[stats_raw.get("race")] if stats_raw.get("race") is not None and 0 <= stats_raw.get("race") < len(RACE_LIST) else None,
    }

    return {
        str(mid): {
            "id": mid,
            "dbname": dbname,
            "name": name,
            "spawn": spawn_map,
            "stats": stats,
        }
    }


def main():
    monster_input = input("Enter monster id or range (e.g. 1278 or 1000-1010): ")
    try:
        monster_ids = parse_monster_ids(monster_input)
    except Exception as e:
        print(f"[ERROR] Invalid id/range: {e}")
        return

    monsters = {}
    with requests.Session() as session:
        for i, mid in enumerate(monster_ids, 1):
            try:
                raw = fetch_monster(mid, session)
                monsters.update(map_monster(raw))
                print(f"[OK] {mid}")
            except Exception as e:
                print(f"[WARN] {mid}: {e}")
            if i < len(monster_ids):
                time.sleep(REQUEST_DELAY_SEC)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(monsters, f, ensure_ascii=False, indent=2)

    print(f"\n✔ Done. Saved {len(monsters)} monsters -> {OUTPUT_FILE}")
    input("\nPress Enter to exit...")


if __name__ == "__main__":
    main()