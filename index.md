---
layout: default
title: "My Articles"
---


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
  {% assign tags_sorted = site.tags | sort %}
  <select id="tag-filter">
    <option value="">All Tags</option>
    {% for tag in tags_sorted %}
    <option value="{{ tag[0] }}">{{ tag[0] }} ({{ tag[1].size }})</option>
    {% endfor %}
  </select>
  <button id="clear-filters" type="button">Clear Filters</button>
</div>

<div id="no-posts-message" class="info-alert hidden" role="alert">No posts found.</div>

<div class="post-cards">
  {% for post in site.posts %}
    <div class="post-card" data-title="{{ post.title }}" data-year="{{ post.date | date: '%Y' }}" data-tags="{{ post.tags | join: ',' }}">
      <span class="material-icons">article</span>
      <div>
        <p class="card-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></p>
        <p class="card-date">{{ post.date | date: "%Y-%m-%d" }}</p>
        <p class="card-tags">
          {% for tag in post.tags %}<span class="tag">{{ tag }}</span>{% endfor %}
        </p>
      </div>
    </div>
  {% endfor %}
</div>
