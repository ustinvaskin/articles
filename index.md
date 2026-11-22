---
layout: default
title: "Writing"
---

<section class="writing-hero gutter" id="top">
  <div class="hero-copy">
    <p class="eyebrow">USTIN VASKIN / NOTES &amp; IDEAS</p>
    <h1>Things I’m<br><em>thinking</em> about<span>.</span></h1>
    <p class="hero-intro">Notes on software, the decisions behind it, and the experiments that keep me curious.</p>
    <a class="pill dark-pill" href="#article-list">Browse all articles <span class="site-icon site-icon--down" aria-hidden="true"></span></a>
  </div>
  <div class="hero-graphic" aria-hidden="true">
    <div class="graphic-orbit"></div>
    <span class="graphic-brace">{</span><span class="graphic-star"></span><span class="graphic-brace">}</span>
  </div>
</section>

<div class="ticker" aria-hidden="true"><div class="ticker-track">
  <span>FRONTEND ✦ PROGRAMMING LANGUAGES ✦ AI RESEARCH ✦ DESIGN SYSTEMS ✦ </span>
  <span>FRONTEND ✦ PROGRAMMING LANGUAGES ✦ AI RESEARCH ✦ DESIGN SYSTEMS ✦ </span>
  <span>FRONTEND ✦ PROGRAMMING LANGUAGES ✦ AI RESEARCH ✦ DESIGN SYSTEMS ✦ </span>
  <span>FRONTEND ✦ PROGRAMMING LANGUAGES ✦ AI RESEARCH ✦ DESIGN SYSTEMS ✦ </span>
</div></div>

<section class="archive gutter" id="archive">
  <div class="section-heading">
    <div><p class="eyebrow">THE ARCHIVE</p><h2>All <em>articles.</em></h2></div>
    <p>Experiments, practical notes, and lessons from building things.</p>
  </div>
  <section class="start-here" id="start-here" aria-labelledby="start-here-title">
    <div class="start-here-heading">
      <h3 class="archive-label" id="start-here-title">Start here</h3>
      <a href="#article-list">Search all articles <span class="site-icon site-icon--down" aria-hidden="true"></span></a>
    </div>
    <div class="featured-stories">
      {% assign research = site.posts | where: "title", "When Runtime Evidence Helps LLMs Repair Code, and When It Does Not" | first %}
      {% assign frontend = site.posts | where: "title", "React useEffect vs useMemo vs useCallback — When To Use What" | first %}
      {% if research %}
      <article class="featured-story">
        <a class="featured-image" href="{{ research.url | relative_url }}" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/editorial-tundra.webp' | relative_url }}" width="1200" height="800" alt="" loading="lazy"></a>
        <div>
          <p class="eyebrow">AI RESEARCH / {{ research.date | date: "%Y" }}</p>
          <h4><a href="{{ research.url | relative_url }}">When runtime evidence helps <span class="site-icon site-icon--external" aria-hidden="true"></span></a></h4>
          <p>When does runtime evidence help an LLM repair code? An experiment with Tundra.</p>
        </div>
      </article>
      {% endif %}
      {% if frontend %}
      <article class="featured-story">
        <a class="featured-image" href="{{ frontend.url | relative_url }}" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/editorial-frontend.webp' | relative_url }}" width="1200" height="800" alt="" loading="lazy"></a>
        <div>
          <p class="eyebrow">FRONTEND / {{ frontend.date | date: "%Y" }}</p>
          <h4><a href="{{ frontend.url | relative_url }}">Choosing the right React hook <span class="site-icon site-icon--external" aria-hidden="true"></span></a></h4>
          <p>A practical look at choosing between three React hooks.</p>
        </div>
      </article>
      {% endif %}
    </div>
  </section>
  <h3 class="archive-label" id="article-list">Browse the archive</h3>
  <div class="filters" aria-label="Filter articles">
    <label class="filter-search"><span>Search</span><input type="search" id="search-input" placeholder="Search articles"></label>
    {% assign posts_by_year = site.posts | group_by_exp: 'post', 'post.date | date: "%Y"' %}
    <label><span>Year</span><select id="year-filter"><option value="">All years</option>{% for group in posts_by_year %}<option value="{{ group.name }}">{{ group.name }}</option>{% endfor %}</select></label>
    {% assign tags_sorted = site.tags | sort %}
    <label><span>Topic</span><select id="tag-filter"><option value="">All topics</option>{% for tag in tags_sorted %}<option value="{{ tag[0] | escape }}">{{ tag[0] | escape }} ({{ tag[1].size }})</option>{% endfor %}</select></label>
    <button id="clear-filters" type="button">Reset</button>
  </div>
  <div id="no-posts-message" class="info-alert" role="status" hidden>No articles found. Try another search or reset the filters.</div>
  <div class="post-cards">
    {% for post in site.posts %}
      <article class="post-card" data-title="{{ post.title | escape }}" data-year="{{ post.date | date: '%Y' }}" data-tags="{{ post.tags | join: ',' | escape }}">
        <p class="card-date">{{ post.date | date: "%b %-d, %Y" }}</p>
        <div class="card-content">
          <h3 class="card-title"><a href="{{ post.url | relative_url }}">{{ post.title | escape }}</a></h3>
          <p class="card-tags">{% for tag in post.tags %}<span class="tag">{{ tag | escape }}</span>{% endfor %}</p>
        </div>
        <span class="card-arrow site-icon site-icon--external" aria-hidden="true"></span>
      </article>
    {% endfor %}
  </div>
</section>
