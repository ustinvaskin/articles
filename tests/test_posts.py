#!/usr/bin/env python3
"""Simple tests for blog posts.

Checks that each Markdown file in the `_posts` directory contains valid YAML
front matter with the required fields.
"""
from pathlib import Path
import re
import sys

REQUIRED_FIELDS = ["layout", "title", "date", "tags"]

def check_frontmatter(path: Path):
    lines = path.read_text().splitlines()
    if not lines or lines[0].strip() != "---":
        return f"{path}: missing starting front matter delimiter"
    try:
        end = lines[1:].index("---") + 1
    except ValueError:
        return f"{path}: missing closing front matter delimiter"
    front = "\n".join(lines[1:end])
    for field in REQUIRED_FIELDS:
        if not re.search(rf"^{field}:", front, flags=re.MULTILINE):
            return f"{path}: missing required field '{field}'"
    return None

def main() -> int:
    errors = []
    for post in Path("_posts").glob("*.md"):
        err = check_frontmatter(post)
        if err:
            errors.append(err)
    if errors:
        for e in errors:
            print(e)
        return 1
    print("All posts contain required front matter.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
