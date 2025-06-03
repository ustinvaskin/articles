
document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('search-input');
  var yearFilter = document.getElementById('year-filter');
  var tagFilter = document.getElementById('tag-filter');
  var cards = document.querySelectorAll('.post-card');

  function filterPosts() {
    var searchTerm = searchInput.value.toLowerCase();
    var yearValue = yearFilter ? yearFilter.value : '';
    var tagValue = tagFilter ? tagFilter.value : '';
    cards.forEach(function(card) {
      var title = card.getAttribute('data-title').toLowerCase();
      var year = card.getAttribute('data-year');
      var tags = card.getAttribute('data-tags').split(',');
      var matchesSearch = title.indexOf(searchTerm) !== -1;
      var matchesYear = !yearValue || year === yearValue;
      var matchesTag = !tagValue || tags.indexOf(tagValue) !== -1;
      if (matchesSearch && matchesYear && matchesTag) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', filterPosts);
  if (yearFilter) yearFilter.addEventListener('change', filterPosts);
  if (tagFilter) tagFilter.addEventListener('change', filterPosts);
});

