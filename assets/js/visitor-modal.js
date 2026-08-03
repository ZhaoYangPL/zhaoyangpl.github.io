(() => {
  const modal = document.getElementById('guestbookModal');
  const form = document.getElementById('visitor-name-form');
  if (!modal || !form) return;

  const sessionKey = 'has_left_name';
  if (sessionStorage.getItem(sessionKey) !== 'true') {
    modal.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
  }

  form.addEventListener('submit', () => {
    sessionStorage.setItem(sessionKey, 'true');
    window.setTimeout(() => {
      modal.classList.remove('is-visible');
      modal.setAttribute('aria-hidden', 'true');
    }, 100);
  });
})();
