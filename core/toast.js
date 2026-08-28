export function toast(message, type = 'info', duration = 3000, opts = {}) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', 'alert');

  const span = document.createElement('span');
  span.textContent = message;
  el.appendChild(span);

  let closed = false;
  function dismiss() {
    if (closed) return;
    closed = true;
    el.classList.remove('show');
    const remove = () => el.remove();
    el.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 400);
  }

  if (opts.actionLabel) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = opts.actionLabel;
    btn.addEventListener('click', () => {
      if (opts.onAction) opts.onAction();
      dismiss();
    });
    el.appendChild(btn);
  }

  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));

  setTimeout(dismiss, duration);
}
