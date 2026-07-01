#!/usr/bin/env python3
"""Simple tests for blog posts.

Checks that each Markdown file in the ``_posts`` directory contains valid YAML
front matter with the required fields. Additional checks ensure that any inline
HTML is well formed and that relative links point to existing files within the
repository.
"""
from pathlib import Path
from html.parser import HTMLParser
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


def _strip_code_blocks(text: str) -> str:
    """Remove fenced code blocks from Markdown text."""
    lines = []
    inside = False
    for line in text.splitlines():
        if line.startswith("```"):
            inside = not inside
            continue
        if not inside:
            lines.append(line)
    return "\n".join(lines)


def check_links(path: Path):
    """Return a list of broken relative links in the file."""
    content = _strip_code_blocks(path.read_text())
    pattern = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
    broken = []
    for link in pattern.findall(content):
        if link.startswith(("http://", "https://", "mailto:", "#")):
            continue
        target = Path(link.lstrip("/"))
        if not target.exists():
            broken.append(f"{path}: broken link '{link}'")
    return broken


class HTMLValidator(HTMLParser):
    SELF_CLOSING = {
        "br",
        "hr",
        "img",
        "input",
        "meta",
        "link",
        "area",
        "base",
        "col",
        "command",
        "embed",
        "keygen",
        "param",
        "source",
        "track",
        "wbr",
    }

    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in self.SELF_CLOSING:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1] != tag:
            self.errors.append(f"mismatched closing tag </{tag}>")
        else:
            self.stack.pop()

    def close(self):
        super().close()
        if self.stack:
            self.errors.append(f"unclosed tag(s): {', '.join(self.stack)}")


def check_html(path: Path):
    """Return a list of HTML validation errors inside the Markdown file."""
    content = _strip_code_blocks(path.read_text())
    parser = HTMLValidator()
    parser.feed(content)
    parser.close()
    return [f"{path}: {e}" for e in parser.errors]

def main() -> int:
    errors = []
    for post in Path("_posts").glob("*.md"):
        err = check_frontmatter(post)
        if err:
            errors.append(err)
            continue
        errors.extend(check_links(post))
        errors.extend(check_html(post))

    if errors:
        for e in errors:
            print(e)
        return 1

    print("All posts passed validation.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
