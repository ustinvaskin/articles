# Articles

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

## Forms

Both the subscribe and contact forms use [Formspree](https://formspree.io/) to collect submissions. Update the Formspree endpoint URLs in `_layouts/default.htm` with your own form IDs so that messages and email addresses are sent to your account.

## Tests

Basic sanity tests live in the `tests/` directory. They ensure every post contains valid YAML front matter. Run them with:

```bash
python3 tests/test_posts.py
```

## Contributing

See the [usage guide](docs/usage.md) for instructions on writing new posts and working with the site locally.
