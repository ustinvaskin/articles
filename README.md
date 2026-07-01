# Articles

> **Tip:** clone the repo and run Jekyll locally to preview posts before publishing.

This repository contains the source for my personal blog which is built with [Jekyll](https://jekyllrb.com/). It is served through GitHub Pages at <https://ustinvaskin.github.io/articles>.

## Getting Started

1. Install Ruby along with Bundler.
2. Install the project dependencies:
   ```bash
   bundle install
   ```
3. Run the development server:
   ```bash
   bundle exec jekyll serve
   ```
4. Open your browser to `http://localhost:4000/articles` to view the site.

## Directory Structure

- `_posts/` – Markdown articles organised by date.
- `_layouts/` – HTML templates used to render the pages.
- `assets/` – JavaScript and CSS used by the layouts.
- `docs/` – Additional project documentation.

## Syntax Highlighting

Code blocks use [highlight.js](https://highlightjs.org/) for styling. Each block
includes a small "Copy" button to quickly copy the snippet to your clipboard.

## Forms

Both the subscribe and contact forms rely on [Formspree](https://formspree.io/) for handling submissions. To configure them:

1. Create the forms in your Formspree dashboard.
2. Copy each form's endpoint URL.
3. Edit `_layouts/default.htm` and replace the `action` attribute of both forms with your endpoints.

## Dark Mode

A dark colour scheme is built in. Click the moon icon in the header to toggle between light and dark styles. Your preference is stored in `localStorage` and highlight.js loads the matching theme.
The site colours are defined at the top of `assets/main.css`, with overrides in `body.dark` for the dark theme. The palette now uses deep greys with soft blue accents for improved readability.

## Tests

Basic sanity tests live in the `tests/` directory. They ensure every post contains valid YAML front matter and that any links are valid and inline HTML is well formed. Run them with:

```bash
python3 tests/test_posts.py
```


## Contributing

See the [usage guide](docs/usage.md) for instructions on writing new posts and working with the site locally.
