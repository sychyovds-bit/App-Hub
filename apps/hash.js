import { toast } from '../core/toast.js';

export function init(container) {
  container.innerHTML = `
    <h1>Хэш-генератор</h1>
    <p class="subtitle">SHA-1, SHA-256, SHA-384, SHA-512 через Web Crypto</p>
    <div class="widget" style="max-width:640px">
      <textarea id="hashInput" placeholder="Введите текст..." rows="4"></textarea>
      <div class="hash-check"><label><input id="hashHexUpper" type="checkbox"> ВЕРХНИЙ РЕГИСТР</label></div>
      <button class="btn" id="hashGenBtn" style="margin-top:12px">Вычислить</button>
      <div class="hash-results" id="hashResults" aria-live="polite"></div>
    </div>
  `;

  const input = container.querySelector('#hashInput');
  const results = container.querySelector('#hashResults');
  const genBtn = container.querySelector('#hashGenBtn');
  let hashes = {};

  async function compute() {
    const text = input.value;
    if (!text) { toast('Введите текст', 'warning'); return; }
    const data = new TextEncoder().encode(text);
    hashes = {};

    for (const algo of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
      const buf = await crypto.subtle.digest(algo, data);
      hashes[algo] = Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
    }
    render();
    toast('Хэши вычислены', 'success');
  }

  function render() {
    results.innerHTML = Object.entries(hashes).map(([algo, hex]) => {
      const value = container.querySelector('#hashHexUpper').checked ? hex.toUpperCase() : hex;
      return `
        <div class="hash-row">
          <span class="hash-algo">${algo}</span>
          <code class="hash-value">${value}</code>
          <button class="uuid-copy" data-algo="${algo}" aria-label="Копировать ${algo}">копировать</button>
        </div>
      `;
    }).join('');

    results.querySelectorAll('.uuid-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.parentElement.querySelector('.hash-value').textContent;
        navigator.clipboard.writeText(value).then(() => toast(`${btn.dataset.algo} скопирован`, 'success'));
      });
    });
  }

  genBtn.addEventListener('click', compute);
  container.querySelector('#hashHexUpper').addEventListener('change', () => {
    if (Object.keys(hashes).length) render();
  });
}
