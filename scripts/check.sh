#!/bin/sh
# Run basic quality checks

python3 tests/test_posts.py || exit 1
bundle exec mdl . || exit 1
bundle exec jekyll build -d /tmp/site >/dev/null || exit 1
bundle exec htmlproofer /tmp/site --disable-external || exit 1
rm -rf /tmp/site

