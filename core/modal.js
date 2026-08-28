export function modal({ title, body, actions = [] }) {
  const overlay = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const actionsEl = document.getElementById('modalActions');
  const closeBtn = document.getElementById('modalClose');

  const previousFocus = document.activeElement;

  titleEl.textContent = title;
  bodyEl.innerHTML = body;
  actionsEl.innerHTML = '';

  actions.forEach(({ label, class: cls = 'btn', onClick }) => {
    const btn = document.createElement('button');
    btn.className = cls;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (onClick) onClick();
      closeModal();
    });
    actionsEl.appendChild(btn);
  });

  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('visible'));

  const firstInput = bodyEl.querySelector('input, textarea, select');
  const firstBtn = actionsEl.querySelector('button');
  (firstInput || firstBtn || closeBtn).focus();

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = box.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function handleOverlayClick(e) {
    if (e.target === overlay) closeModal();
  }

  function closeModal() {
    document.removeEventListener('keydown', handleKeydown);
    overlay.removeEventListener('click', handleOverlayClick);
    overlay.classList.remove('visible');
    setTimeout(() => { overlay.hidden = true; }, 200);
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  }

  document.addEventListener('keydown', handleKeydown);
  overlay.addEventListener('click', handleOverlayClick);
  closeBtn.onclick = closeModal;

  return { close: closeModal };
}
