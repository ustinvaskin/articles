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

  <div class="filters">
  <input type="text" id="search-input" placeholder="Search articles...">
  {% assign posts_by_year = site.posts | group_by_exp: 'post', 'post.date | date: "%Y"' %}
  <select id="year-filter">
    <option value="">All Years</option>
    {% for group in posts_by_year %}
    <option value="{{ group.name }}">{{ group.name }}</option>
    {% endfor %}
  </select>
</div>

<div class="post-cards">
  {% for post in site.posts %}
    <div class="post-card" data-title="{{ post.title }}" data-year="{{ post.date | date: '%Y' }}">
      <span class="material-icons">article</span>
      <div>
        <p class="card-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></p>
        <p class="card-date">{{ post.date | date: "%Y-%m-%d" }}</p>
      </div>
    </div>
  {% endfor %}
</div>
