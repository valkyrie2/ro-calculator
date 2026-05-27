import json

new_items = json.load(open('new_items.json', encoding='utf-8'))
ids_sorted = sorted(new_items.keys(), key=lambda x: int(x))

chunks = []
for i, iid in enumerate(ids_sorted):
    item = new_items[iid]
    entry = json.dumps(item, ensure_ascii=False, indent=2)
    inner_lines = entry.split('\n')
    # Build indented entry: '  "id": {' + indented body
    key_line = '  "' + iid + '": {'
    indented = [key_line] + ['  ' + l for l in inner_lines[1:]]
    chunk = '\n'.join(indented)
    if i < len(ids_sorted) - 1:
        chunks.append(chunk + ',')
    else:
        chunks.append(chunk)

insertion = '\n'.join(chunks)

# Read item.json
print('Reading item.json...')
with open('src/assets/demo/data/item.json', encoding='utf-8-sig') as f:
    content = f.read()

print('Original file length:', len(content))

# The tail to replace: the closing of the last item + root close
OLD_TAIL = '  }\n}\n'
NEW_TAIL = '  },\n' + insertion + '\n}\n'

assert content.endswith(OLD_TAIL), 'Unexpected file ending: ' + repr(content[-50:])

new_content = content[:-len(OLD_TAIL)] + NEW_TAIL

print('New file length:', len(new_content))

# Write back
with open('src/assets/demo/data/item.json', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done!')
