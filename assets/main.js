document.addEventListener('DOMContentLoaded', () => {
  const darkMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const searchInput = document.getElementById('search-input');
  const yearFilter = document.getElementById('year-filter');
  const tagFilter = document.getElementById('tag-filter');
  const clearBtn = document.getElementById('clear-filters');
  const hljsLight = document.getElementById('hljs-theme-light');
  const hljsDark = document.getElementById('hljs-theme-dark');

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

  const applyHighlightTheme = () => {
    const dark = !!(darkMedia && darkMedia.matches);
    if (hljsLight) hljsLight.disabled = dark;
    if (hljsDark) hljsDark.disabled = !dark;
  };

  applyHighlightTheme();

  if (darkMedia && typeof darkMedia.addEventListener === 'function') {
    darkMedia.addEventListener('change', applyHighlightTheme);
  } else if (darkMedia && typeof darkMedia.addListener === 'function') {
    darkMedia.addListener(applyHighlightTheme);
  }

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
