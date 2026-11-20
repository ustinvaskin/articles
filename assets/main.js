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

      data.el.style.display = matchesSearch && matchesYear && matchesTag ? 'block' : 'none';
    }

    const anyVisible = cardData.some(data => data.el.style.display !== 'none');
    if (noPostsMessage) {
      noPostsMessage.style.display = anyVisible ? 'none' : 'block';
    }
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
  const articleHeadings = document.querySelectorAll('.post-body h2, .post-body h3');
  if (chapterNav && articleHeadings.length) {
    const list = chapterNav.querySelector('.chapter-list');
    const chapterLinks = [];
    articleHeadings.forEach((heading, index) => {
      if (!heading.id) {
        let id = `chapter-${index + 1}`;
        while (document.getElementById(id)) id += '-section';
        heading.id = id;
      }
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

    let currentChapter = -1;
    let scrollPending = false;
    const updateCurrentChapter = () => {
      scrollPending = false;
      const marker = Math.min(160, window.innerHeight * 0.25);
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
    scheduleChapterUpdate();
  }

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
