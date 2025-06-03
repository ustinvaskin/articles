
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  const searchInput = document.getElementById('search-input');
  const yearFilter = document.getElementById('year-filter');
  const tagFilter = document.getElementById('tag-filter');
  const cards = Array.from(document.querySelectorAll('.post-card'));

  const updateToggleIcon = () => {
    if (!toggle) return;
    const icon = toggle.querySelector('.material-icons');
    if (!icon) return;
    icon.textContent = document.body.classList.contains('dark')
      ? 'light_mode'
      : 'dark_mode';
  };

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }
  updateToggleIcon();

  toggle?.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    updateToggleIcon();
  });

  const populateTagFilter = () => {
    if (!tagFilter || tagFilter.children.length > 1) return;

    const tagSet = new Set();
    for (const card of cards) {
      const tags = card.dataset.tags.split(',');
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

    for (const card of cards) {
      const title = card.dataset.title.toLowerCase();
      const year = card.dataset.year;
      const tags = card.dataset.tags.split(',');

      const matchesSearch = title.includes(searchTerm);
      const matchesYear = !yearValue || year === yearValue;
      const matchesTag = !tagValue || tags.includes(tagValue);

      card.style.display = matchesSearch && matchesYear && matchesTag ? 'flex' : 'none';
    }
  };

  searchInput?.addEventListener('input', filterPosts);
  yearFilter?.addEventListener('change', filterPosts);
  tagFilter?.addEventListener('change', filterPosts);

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
        setTimeout(() => (button.textContent = 'Copy'), 2000);
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

