
document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('search-input');
  var yearFilter = document.getElementById('year-filter');
  var tagFilter = document.getElementById('tag-filter');
  var cards = document.querySelectorAll('.post-card');

  function populateTagFilter() {
    if (!tagFilter) return;
    // Populate tag dropdown if it only contains the default option
    if (tagFilter.children.length <= 1) {
      var set = new Set();
      cards.forEach(function (card) {
        var tags = card.getAttribute('data-tags').split(',');
        tags.forEach(function (t) {
          t = t.trim();
          if (t) set.add(t);
        });
      });
      Array.from(set).sort().forEach(function (t) {
        var option = document.createElement('option');
        option.value = t;
        option.textContent = t;
        tagFilter.appendChild(option);
      });
    }
  }

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

  populateTagFilter();

  filterPosts();

  var subscribeForm = document.getElementById('subscribe-form');
  var subscribeMessage = document.getElementById('subscribe-message');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(subscribeForm);
      fetch(subscribeForm.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          if (subscribeMessage) {
            subscribeMessage.textContent = 'Thank you for subscribing!';
            subscribeMessage.classList.remove('hidden');
          }
          subscribeForm.reset();
        } else {
          if (subscribeMessage) {
            subscribeMessage.textContent = 'Oops! There was a problem.';
            subscribeMessage.classList.remove('hidden');
          }
        }
      }).catch(function () {
        if (subscribeMessage) {
          subscribeMessage.textContent = 'Oops! There was a problem.';
          subscribeMessage.classList.remove('hidden');
        }
      });
    });
  }

  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('contact-name').value;
      var fromEmail = document.getElementById('contact-from-email').value;
      var message = document.getElementById('contact-message').value;
      var mailto = 'mailto:' + window.siteEmail +
        '?subject=' + encodeURIComponent('Message from ' + name) +
        '&body=' + encodeURIComponent('From: ' + fromEmail + '\n\n' + message);
      window.location.href = mailto;
    });
  }
});

