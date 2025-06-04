#!/usr/bin/env python3
"""Create a new blog post file with front matter."""
import os
import re
from datetime import datetime

POSTS_DIR = '_posts'


def slugify(title: str) -> str:
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug or 'post'


def main():
    title = input('Title: ').strip()
    if not title:
        print('Title is required.')
        return

    date_input = input('Date [leave blank for now]: ').strip()
    if date_input:
        try:
            dt = datetime.fromisoformat(date_input)
        except ValueError:
            print('Invalid date format. Use YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS')
            return
    else:
        dt = datetime.utcnow()

    date_str = dt.strftime('%Y-%m-%d %H:%M:%S +0000')

    tags_input = input('Tags (comma separated): ').strip()
    tags = [t.strip() for t in tags_input.split(',') if t.strip()]

    slug = slugify(title)
    filename = f"{dt.strftime('%Y-%m-%d')}-{slug}.md"
    path = os.path.join(POSTS_DIR, filename)

    if os.path.exists(path):
        print(f"File {filename} already exists.")
        return

    with open(path, 'w') as f:
        f.write('---\n')
        f.write('layout: post\n')
        f.write(f'title: "{title}"\n')
        f.write(f'date:  {date_str}\n')
        f.write('tags:\n')
        for tag in tags:
            f.write(f'  - {tag}\n')
        f.write('---\n\n')

    print(f'Created {path}')


if __name__ == '__main__':
    main()
