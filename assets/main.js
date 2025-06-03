
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const yearFilter = document.getElementById('year-filter');
  const tagFilter = document.getElementById('tag-filter');
  const cards = Array.from(document.querySelectorAll('.post-card'));

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

});

