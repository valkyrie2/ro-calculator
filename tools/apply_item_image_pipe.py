#!/usr/bin/env python3
"""
Apply itemImage pipe to all item image references in Angular HTML templates.
Pattern: assets/demo/images/items/{{ expr }}.png -> assets/demo/images/items/{{ expr | itemImage }}.png
"""
import re
import os
from pathlib import Path

SRC_DIR = Path(r"d:\MyProject\ro-calculator\src")

# Match: assets/demo/images/items/{{ expr }}.png
# where expr does NOT already contain '| itemImage'
PATTERN = re.compile(r'assets/demo/images/items/\{\{([^}]+)\}\}\.png')

def replacement(m):
    expr = m.group(1)
    # Check if already piped
    if '| itemImage' in expr or '|itemImage' in expr:
        return m.group(0)
    return f'assets/demo/images/items/{{{{ {expr.strip()} | itemImage }}}}.png'

total_files = 0
total_replacements = 0

for html_file in SRC_DIR.rglob("*.html"):
    content = html_file.read_text(encoding='utf-8')
    if 'assets/demo/images/items/{{' not in content:
        continue
    
    new_content, count = PATTERN.subn(replacement, content)
    if count > 0:
        html_file.write_text(new_content, encoding='utf-8')
        print(f"Updated {html_file.name}: {count} replacements")
        total_files += 1
        total_replacements += count

print(f"\nTotal: {total_replacements} replacements in {total_files} files")
