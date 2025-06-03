---
layout: default
title: "My Articles"
---

<p class="disclaimer">
  <a href="https://ustinvaskin.github.io/disclaimer-blog/" target="_blank" rel="noopener noreferrer">
    Read the Disclaimer
  </a>
</p>

Here’s a list of my posts:

<ul class="post-list">
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">
        {{ post.date | date: "%Y-%m-%d" }} – {{ post.title }}
      </a>
    </li>
  {% endfor %}
</ul>
