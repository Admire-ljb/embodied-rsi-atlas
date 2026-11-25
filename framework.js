'use strict';

// Preserve links shared before the student map moved to its own page.
function followStudentBookmark() {
  const hash = window.location.hash;
  if (hash === '#topics' || hash === '#evidence' || hash.startsWith('#topic-')) {
    window.location.replace('./topics.html' + hash);
  }
}

window.addEventListener('hashchange', followStudentBookmark);
followStudentBookmark();
