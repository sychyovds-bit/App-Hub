export function modal({ title, body, actions = [] }) {
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const actionsEl = document.getElementById('modalActions');
  const closeBtn = document.getElementById('modalClose');

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

  function closeModal() {
    overlay.classList.remove('visible');
    setTimeout(() => { overlay.hidden = true; }, 200);
  }

  closeBtn.onclick = closeModal;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  return { close: closeModal };
}
