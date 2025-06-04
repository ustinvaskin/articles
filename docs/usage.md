# Usage Guide

> **Note:** this guide covers running the Jekyll site locally and formatting new posts.

This documentation explains how to work with the blog locally and how to write new articles.

## Local Development

1. Install Ruby and Bundler.
2. Run `bundle install` to install dependencies.
3. Start the development server with `bundle exec jekyll serve`.
4. Visit `http://localhost:4000/articles` in your browser.

## Writing Posts

All posts live in the `_posts` directory and must follow the standard Jekyll filename format: `YEAR-MONTH-DAY-title.md`.
Each post must contain YAML front matter with at least the following fields:

```yaml
---
layout: post
title: "Your title"
date:  YYYY-MM-DD HH:MM:SS +0000
tags:
  - example
---
```

Content goes below the front matter. Use Markdown for formatting.

## Custom Forms

The default layout contains subscribe and contact forms powered by [Formspree](https://formspree.io/). Replace the placeholder Formspree IDs in `_layouts/default.htm` with your own so that submissions are routed to you.

## Quality Checks

Before publishing a post you can run the Python tests to validate front matter,
links and HTML:

```bash
python3 tests/test_posts.py
```


## Publishing Workflow

1. Run `scripts/new_post.py` and follow the prompts to create a new Markdown file in `_posts/` with the required front matter.
2. Write your post content below the generated front matter.
3. Preview the site locally with `bundle exec jekyll serve`.
4. Run `python3 tests/test_posts.py` to ensure the post passes validation.
5. Commit your changes and push them to GitHub.

