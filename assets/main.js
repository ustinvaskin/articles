
document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('search-input');
  var yearFilter = document.getElementById('year-filter');
  var cards = document.querySelectorAll('.post-card');

  function filterPosts() {
    var searchTerm = searchInput.value.toLowerCase();
    var yearValue = yearFilter ? yearFilter.value : '';
    cards.forEach(function(card) {
      var title = card.getAttribute('data-title').toLowerCase();
      var year = card.getAttribute('data-year');
      var matchesSearch = title.indexOf(searchTerm) !== -1;
      var matchesYear = !yearValue || year === yearValue;
      if (matchesSearch && matchesYear) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', filterPosts);
  if (yearFilter) yearFilter.addEventListener('change', filterPosts);
});

