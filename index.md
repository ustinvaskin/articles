---
layout: default
title: "My Articles"
---

# My Articles

Here’s a list of my posts:

{% for post in site.posts %}
- [{{ post.date | date: "%Y-%m-%d" }} – {{ post.title }}]({{ post.url | relative_url }})
{% endfor %}
