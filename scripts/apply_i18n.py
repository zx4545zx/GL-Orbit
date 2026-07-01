#!/usr/bin/env python3
"""Apply i18n string replacements to a Svelte/TS file."""
import argparse
import json
import re
import sys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('file')
    parser.add_argument('--replacements', required=True, help='JSON file with list of {old, new}')
    parser.add_argument('--import-path', default="$lib/i18n/paraglide.js")
    parser.add_argument('--import-name', default="m")
    parser.add_argument('--add-import', action='store_true')
    args = parser.parse_args()

    with open(args.file, 'r', encoding='utf-8') as f:
        content = f.read()

    with open(args.replacements, 'r', encoding='utf-8') as f:
        replacements = json.load(f)

    # Add import if needed
    import_stmt = f"import {{ {args.import_name} }} from '{args.import_path}';\n"
    if args.add_import and import_stmt.strip() not in content:
        # Insert right after <script lang="ts"> line
        m = re.search(r'(<script[^>]*>\n?)', content)
        if m:
            insert_pos = m.end()
            content = content[:insert_pos] + import_stmt + content[insert_pos:]
        else:
            content = import_stmt + content

    # Build safe replacement regex (longest first)
    mapping = {}
    pattern_parts = []
    for r in replacements:
        old = r['old']
        new = r['new']
        if old in mapping and mapping[old] != new:
            print(f"WARNING: duplicate old with different new: {old}", file=sys.stderr)
        mapping[old] = new
        pattern_parts.append(re.escape(old))
    if not pattern_parts:
        with open(args.file, 'w', encoding='utf-8') as f:
            f.write(content)
        return

    pattern = re.compile('|'.join(sorted(pattern_parts, key=len, reverse=True)))

    def repl(match):
        return mapping[match.group(0)]

    new_content = pattern.sub(repl, content)

    with open(args.file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Applied {len(replacements)} replacements to {args.file}")

if __name__ == '__main__':
    main()
