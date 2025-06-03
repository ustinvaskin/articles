
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  const searchInput = document.getElementById('search-input');
  const yearFilter = document.getElementById('year-filter');
  const tagFilter = document.getElementById('tag-filter');
  const clearBtn = document.getElementById('clear-filters');
  const cards = Array.from(document.querySelectorAll('.post-card'));

  const updateToggleIcon = () => {
    if (!toggle) return;
    const icon = toggle.querySelector('.material-icons');
    if (!icon) return;
    icon.textContent = document.body.classList.contains('dark')
      ? 'light_mode'
      : 'dark_mode';
  };

  const hljsLight = document.getElementById('hljs-theme-light');
  const hljsDark = document.getElementById('hljs-theme-dark');

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      if (hljsLight) hljsLight.disabled = true;
      if (hljsDark) hljsDark.disabled = false;
    } else {
      document.body.classList.remove('dark');
      if (hljsLight) hljsLight.disabled = false;
      if (hljsDark) hljsDark.disabled = true;
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
        setTimeout(() => (button.textContent = 'Copy'), 2000);
      });
    });
    const pre = block.parentElement;
    if (pre && pre.tagName === 'PRE') {
      pre.style.position = 'relative';
      pre.appendChild(button);
    }
  });

  const handleForm = (form, messageEl) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageEl.classList.add('hidden');
      form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      try {
        const resp = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (resp.ok) {
          form.reset();
          messageEl.textContent = 'Thanks! Your submission has been received.';
        } else {
          messageEl.textContent = 'There was a problem submitting the form.';
          const inputs = form.querySelectorAll('input, textarea');
          inputs.forEach(i => i.classList.add('error'));
        }
      } catch {
        messageEl.textContent = 'There was a problem submitting the form.';
      }

      messageEl.classList.remove('hidden');
    });
  };

  const subscribeForm = document.getElementById('subscribe-form');
  const subscribeMsg = document.getElementById('subscribe-message');
  if (subscribeForm && subscribeMsg) handleForm(subscribeForm, subscribeMsg);

  const contactForm = document.querySelector('.contact-form');
  const contactMsg = document.getElementById('contact-form-message');
  if (contactForm && contactMsg) handleForm(contactForm, contactMsg);

  if (window.hljs) {
    hljs.highlightAll();
  }



});

