"""Build Orrivane Orb enchant items (315286, 315287, 315288) and append to item.json."""
import json

def make_orb_wh():
    """Orrivane Orb (Windhawk) - 315286."""
    raw = json.load(open('temp_dp_fetch/315286.json', encoding='utf-8-sig'))
    s = {}

    bow = 'Orrivane Wind Bow'
    xbow = 'Orrivane Wind Crossbow'

    # With Wind Bow
    s['criDmg']       = [f'EQUIP[{bow}]===20']
    s['Gale Storm']   = [f'EQUIP[{bow}]REFINE[weapon==2]---4',
                         f'EQUIP[{bow}]GRADE[weapon==C]REFINE[weapon==10]===20']
    s['pAtk']         = [f'EQUIP[{bow}]GRADE[weapon==C]===10']
    s['cd__Gale Storm']    = [f'EQUIP[{bow}]GRADE[weapon==C]===1']
    s['cd__Calamity Gale'] = [f'EQUIP[{bow}]GRADE[weapon==C]REFINE[weapon==10]===30']

    # With Wind Crossbow
    s['criDmg'].append(f'EQUIP[{xbow}]===20')
    s['Crescive Bolt'] = [f'EQUIP[{xbow}]REFINE[weapon==2]---4',
                          f'EQUIP[{xbow}]GRADE[weapon==C]REFINE[weapon==10]===20']
    s['pAtk'].append(f'EQUIP[{xbow}]GRADE[weapon==C]===10')
    s['cd__Crescive Bolt']     = [f'EQUIP[{xbow}]GRADE[weapon==C]===0.2']
    s['cd__Calamity Gale'].append(f'EQUIP[{xbow}]GRADE[weapon==C]REFINE[weapon==10]===30')

    return {
        'id': raw['id'],
        'aegisName': raw['aegisName'],
        'name': raw['name'],
        'unidName': raw['unidName'],
        'resName': raw['resName'],
        'description': raw['description'],
        'slots': 0,
        'itemTypeId': 11,
        'itemSubTypeId': 0,
        'itemLevel': None,
        'attack': None,
        'defense': None,
        'weight': None,
        'requiredLevel': None,
        'location': None,
        'compositionPos': 65535,
        'canGrade': False,
        'usableClass': ['Windhawk'],
        'script': s,
    }


def make_orb_abc():
    """Orrivane Orb (Abyss Chaser) - 315287."""
    raw = json.load(open('temp_dp_fetch/315287.json', encoding='utf-8-sig'))
    s = {}

    dag = 'Orrivane Abyss Dagger'
    xbow = 'Orrivane Abyss Crossbow'

    # With Abyss Dagger
    s['hitDmg']           = [f'EQUIP[{dag}]===10']
    s['Deft Stab']        = [f'EQUIP[{dag}]REFINE[weapon==2]---6',
                              f'EQUIP[{dag}]GRADE[weapon==C]REFINE[weapon==10]===25']
    s['Abyss Dagger']     = [f'EQUIP[{dag}]REFINE[weapon==2]---6',
                              f'EQUIP[{dag}]GRADE[weapon==C]REFINE[weapon==10]===25']
    s['pAtk']             = [f'EQUIP[{dag}]GRADE[weapon==C]===10']
    s['cd__Abyss Dagger'] = [f'EQUIP[{dag}]GRADE[weapon==C]===0.3']
    s['cd__Deft Stab']    = [f'EQUIP[{dag}]GRADE[weapon==C]===0.6']
    s['cd__Dark Claw']    = [f'EQUIP[{dag}]GRADE[weapon==C]REFINE[weapon==10]===30']

    # With Abyss Crossbow
    s['criDmg']                 = [f'EQUIP[{xbow}]===20']
    s['Frenzy Shot']            = [f'EQUIP[{xbow}]REFINE[weapon==2]---4',
                                   f'EQUIP[{xbow}]GRADE[weapon==C]REFINE[weapon==10]===20']
    s['Chain Reaction Shot']    = [f'EQUIP[{xbow}]REFINE[weapon==2]---6',
                                   f'EQUIP[{xbow}]GRADE[weapon==C]REFINE[weapon==10]===25']
    s['pAtk'].append(f'EQUIP[{xbow}]GRADE[weapon==C]===10')
    s['cd__Chain Reaction Shot'] = [f'EQUIP[{xbow}]GRADE[weapon==C]===0.5']
    s['cd__Frenzy Shot']         = [f'EQUIP[{xbow}]GRADE[weapon==C]===0.2']

    return {
        'id': raw['id'],
        'aegisName': raw['aegisName'],
        'name': raw['name'],
        'unidName': raw['unidName'],
        'resName': raw['resName'],
        'description': raw['description'],
        'slots': 0,
        'itemTypeId': 11,
        'itemSubTypeId': 0,
        'itemLevel': None,
        'attack': None,
        'defense': None,
        'weight': None,
        'requiredLevel': None,
        'location': None,
        'compositionPos': 65535,
        'canGrade': False,
        'usableClass': ['AbyssChaser'],
        'script': s,
    }


def make_orb_ag():
    """Orrivane Orb (Arch Mage) - 315288."""
    raw = json.load(open('temp_dp_fetch/315288.json', encoding='utf-8-sig'))
    s = {}

    wand  = 'Orrivane Arch Wand'
    staff = 'Orrivane Arch Staff'

    # With Arch Wand
    s['matkPercent']         = [f'EQUIP[{wand}]===10']
    s['Crimson Arrow']       = [f'EQUIP[{wand}]REFINE[weapon==2]---4',
                                f'EQUIP[{wand}]GRADE[weapon==C]REFINE[weapon==10]===20']
    s['Floral Flare Road']   = [f'EQUIP[{wand}]REFINE[weapon==2]---4',
                                f'EQUIP[{wand}]GRADE[weapon==C]REFINE[weapon==10]===20']
    s['All Bloom']           = [f'EQUIP[{wand}]REFINE[weapon==2]---4',
                                f'EQUIP[{wand}]GRADE[weapon==C]REFINE[weapon==10]===20']
    s['sMatk']               = [f'EQUIP[{wand}]GRADE[weapon==C]===10']
    s['cd__Crimson Arrow']   = [f'EQUIP[{wand}]GRADE[weapon==C]===0.2']
    s['cd__Floral Flare Road'] = [f'EQUIP[{wand}]GRADE[weapon==C]===2',
                                  f'EQUIP[{wand}]GRADE[weapon==C]REFINE[weapon==10]===2']
    s['cd__All Bloom']       = [f'EQUIP[{wand}]GRADE[weapon==C]===2.5',
                                f'EQUIP[{wand}]GRADE[weapon==C]REFINE[weapon==10]===2.5']

    # With Arch Staff
    s['matkPercent'].append(f'EQUIP[{staff}]===10')
    s['Mystery Illusion']    = [f'EQUIP[{staff}]REFINE[weapon==2]---4',
                                f'EQUIP[{staff}]GRADE[weapon==C]REFINE[weapon==10]===20']
    s['Soul Vulcan Strike']  = [f'EQUIP[{staff}]REFINE[weapon==2]---4',
                                f'EQUIP[{staff}]GRADE[weapon==C]REFINE[weapon==10]===20']
    s['sMatk'].append(f'EQUIP[{staff}]GRADE[weapon==C]===10')
    s['cd__Mystery Illusion']   = [f'EQUIP[{staff}]GRADE[weapon==C]===1.3',
                                   f'EQUIP[{staff}]GRADE[weapon==C]REFINE[weapon==10]===1.3']
    s['cd__Soul Vulcan Strike'] = [f'EQUIP[{staff}]GRADE[weapon==C]===0.7']
    s['cd__Intensification']    = [f'EQUIP[{staff}]GRADE[weapon==C]REFINE[weapon==10]===200']

    return {
        'id': raw['id'],
        'aegisName': raw['aegisName'],
        'name': raw['name'],
        'unidName': raw['unidName'],
        'resName': raw['resName'],
        'description': raw['description'],
        'slots': 0,
        'itemTypeId': 11,
        'itemSubTypeId': 0,
        'itemLevel': None,
        'attack': None,
        'defense': None,
        'weight': None,
        'requiredLevel': None,
        'location': None,
        'compositionPos': 65535,
        'canGrade': False,
        'usableClass': ['ArchMage'],
        'script': s,
    }


items = {
    '315286': make_orb_wh(),
    '315287': make_orb_abc(),
    '315288': make_orb_ag(),
}

ids_sorted = sorted(items.keys(), key=lambda x: int(x))
chunks = []
for i, iid in enumerate(ids_sorted):
    item = items[iid]
    entry = json.dumps(item, ensure_ascii=False, indent=2)
    inner_lines = entry.split('\n')
    key_line = '  "' + iid + '": {'
    indented = [key_line] + ['  ' + l for l in inner_lines[1:]]
    chunk = '\n'.join(indented)
    chunks.append(chunk + ',')

insertion = '\n'.join(chunks)

print('Reading item.json...')
with open('src/assets/demo/data/item.json', encoding='utf-8-sig') as f:
    content = f.read()
print('Original length:', len(content))

OLD_TAIL = '  }\n}\n'
NEW_TAIL = '  },\n' + insertion + '\n}\n'
assert content.endswith(OLD_TAIL), 'Unexpected ending: ' + repr(content[-50:])

new_content = content[:-len(OLD_TAIL)] + NEW_TAIL
print('New length:', len(new_content))

with open('src/assets/demo/data/item.json', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done - inserted 3 Orrivane Orb items.')
