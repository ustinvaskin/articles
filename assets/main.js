document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const yearFilter = document.getElementById('year-filter');
  const tagFilter = document.getElementById('tag-filter');
  const clearBtn = document.getElementById('clear-filters');

  document.querySelectorAll('img').forEach(img => {
    if (!img.loading) img.loading = 'lazy';
  });

  const cards = Array.from(document.querySelectorAll('.post-card'));
  const cardData = cards.map(card => ({
    el: card,
    title: (card.dataset.title || '').toLowerCase(),
    year: card.dataset.year || '',
    tags: (card.dataset.tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
  }));
  const noPostsMessage = document.getElementById('no-posts-message');

  const populateTagFilter = () => {
    if (!tagFilter || tagFilter.children.length > 1) return;

    const tagSet = new Set();
    for (const card of cards) {
      const tags = (card.dataset.tags || '').split(',');
      for (let t of tags) {
        t = t.trim();
        if (t) tagSet.add(t);
      }
    }

    [...tagSet].sort().forEach(t => {
      const option = document.createElement('option');
      option.value = t;
      option.textContent = t;
      tagFilter.appendChild(option);
    });
  };

  const filterPosts = () => {
    const searchTerm = searchInput?.value.toLowerCase() ?? '';
    const yearValue = yearFilter?.value ?? '';
    const tagValue = tagFilter?.value ?? '';

    for (const data of cardData) {
      const matchesSearch = data.title.includes(searchTerm);
      const matchesYear = !yearValue || data.year === yearValue;
      const matchesTag = !tagValue || data.tags.includes(tagValue);

      data.el.hidden = !(matchesSearch && matchesYear && matchesTag);
    }

    if (noPostsMessage) noPostsMessage.hidden = cardData.some(data => !data.el.hidden);
  };

  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const debouncedFilter = debounce(filterPosts, 180);
  searchInput?.addEventListener('input', debouncedFilter);
  yearFilter?.addEventListener('change', filterPosts);
  tagFilter?.addEventListener('change', filterPosts);
  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (yearFilter) yearFilter.value = '';
    if (tagFilter) tagFilter.value = '';
    filterPosts();
  });

  populateTagFilter();
  filterPosts();

  const chapterNav = document.querySelector('.chapter-nav');
  const articleBody = document.querySelector('.post-body');
  const headings = Array.from(articleBody?.querySelectorAll('h1, h2, h3, h4, h5, h6') ?? []);
  headings.forEach((heading, index) => {
    if (!heading.id) {
      let id = `chapter-${index + 1}`;
      while (document.getElementById(id)) id += '-section';
      heading.id = id;
    }
  });

  const articleHeadings = headings.filter(heading => heading.matches('h2, h3'));
  if (chapterNav && articleHeadings.length) {
    const list = chapterNav.querySelector('.chapter-list');
    const chapterLinks = [];
    articleHeadings.forEach(heading => {
      const item = document.createElement('li');
      if (heading.tagName === 'H3') item.className = 'chapter-subsection';
      const link = document.createElement('a');
      link.href = '#' + encodeURIComponent(heading.id);
      link.textContent = heading.textContent.trim();
      item.appendChild(link);
      list.appendChild(item);
      chapterLinks.push(link);
    });
    chapterNav.hidden = false;

    const siteHeader = document.querySelector('.site-header');
    let currentChapter = -1;
    let scrollPending = false;
    const updateCurrentChapter = () => {
      scrollPending = false;
      const headerBottom = siteHeader?.getBoundingClientRect().bottom ?? 0;
      const bounds = articleBody.getBoundingClientRect();
      const travel = Math.max(1, bounds.height - (window.innerHeight - headerBottom));
      const progress = Math.max(0, Math.min(1, (headerBottom - bounds.top) / travel));
      chapterNav.style.setProperty('--reading-progress', progress);
      const marker = Math.max(headerBottom + 24, Math.min(160, window.innerHeight * 0.25));
      let current = 0;
      articleHeadings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= marker) current = index;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = articleHeadings.length - 1;
      }
      if (current === currentChapter) return;
      if (currentChapter >= 0) chapterLinks[currentChapter].removeAttribute('aria-current');
      chapterLinks[current].setAttribute('aria-current', 'location');
      currentChapter = current;
    };
    const scheduleChapterUpdate = () => {
      if (!scrollPending) {
        scrollPending = true;
        requestAnimationFrame(updateCurrentChapter);
      }
    };
    window.addEventListener('scroll', scheduleChapterUpdate, { passive: true });
    window.addEventListener('resize', scheduleChapterUpdate);
    window.addEventListener('load', scheduleChapterUpdate);
    new ResizeObserver(scheduleChapterUpdate).observe(articleBody);
    scheduleChapterUpdate();
  }

  headings.forEach(heading => {
    const label = heading.textContent.trim();
    const fragment = '#' + encodeURIComponent(heading.id);
    const canCopy = !!navigator.clipboard?.writeText;
    const link = document.createElement('a');
    link.className = 'section-link';
    link.href = fragment;
    link.setAttribute('aria-label', `${canCopy ? 'Copy link to' : 'Link to'} ${label}`);

    const icon = document.createElement('span');
    icon.className = 'section-link-icon';
    icon.setAttribute('aria-hidden', 'true');
    link.appendChild(icon);

    const feedback = document.createElement('span');
    feedback.className = 'section-link-feedback';
    feedback.setAttribute('role', 'status');
    let feedbackTimer;
    link.addEventListener('click', async event => {
      if (!canCopy || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const url = new URL(location.href);
      url.hash = fragment;
      clearTimeout(feedbackTimer);
      try {
        await navigator.clipboard.writeText(url.href);
        feedback.textContent = 'Link copied';
      } catch {
        location.hash = fragment;
        feedback.textContent = 'Copy the link from the address bar';
      }
      feedbackTimer = setTimeout(() => { feedback.textContent = ''; }, 2200);
    });

    if (!heading.hasAttribute('aria-label') && !heading.hasAttribute('aria-labelledby')) {
      heading.setAttribute('aria-label', label);
    }
    heading.classList.add('has-section-link');
    heading.append(link, feedback);
  });

  document.querySelectorAll('pre code').forEach(block => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-btn';
    button.textContent = 'Copy';
    button.addEventListener('click', () => {
      navigator.clipboard.writeText(block.innerText).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => (button.textContent = 'Copy'), 1800);
      });
    });
    const pre = block.parentElement;
    if (pre && pre.tagName === 'PRE') {
      pre.style.position = 'relative';
      pre.appendChild(button);
    }
  });

  if (window.hljs) {
    hljs.highlightAll();
  }
});
