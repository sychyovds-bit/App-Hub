export function toast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `<span>${message}</span>`;
  container.appendChild(el);

  // Trigger animation
  requestAnimationFrame(() => el.classList.add('show'));

  setTimeout(() => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove());
  }, duration);
}
