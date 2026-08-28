import { toast } from '../core/toast.js';

function uuidv4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function init(container) {
  container.innerHTML = `
    <h1>UUID-генератор</h1>
    <p class="subtitle">Генерация уникальных идентификаторов v4</p>
    <div class="widget" style="max-width:620px">
      <div class="uuid-controls">
        <label>Количество <input id="uuidCount" type="number" min="1" max="100" value="1"></label>
        <label class="uuid-check"><input id="uuidUpper" type="checkbox"> ВЕРХНИЙ РЕГИСТР</label>
        <label class="uuid-check"><input id="uuidNoDash" type="checkbox"> Без дефисов</label>
      </div>
      <div class="uuid-actions">
        <button class="btn" id="uuidGenBtn">Сгенерировать</button>
        <button class="btn-ghost" id="uuidCopyBtn" disabled>Копировать всё</button>
      </div>
      <div class="uuid-output" id="uuidOutput" aria-live="polite"></div>
    </div>
  `;

  const countEl = container.querySelector('#uuidCount');
  const upperEl = container.querySelector('#uuidUpper');
  const dashEl = container.querySelector('#uuidNoDash');
  const output = container.querySelector('#uuidOutput');
  const copyBtn = container.querySelector('#uuidCopyBtn');
  let list = [];

  function fmt(id) {
    let r = dashEl.checked ? id.replace(/-/g, '') : id;
    return upperEl.checked ? r.toUpperCase() : r;
  }

  function generate() {
    const n = Math.max(1, Math.min(100, parseInt(countEl.value) || 1));
    list = Array.from({ length: n }, () => uuidv4());
    output.innerHTML = '';
    list.forEach(id => {
      const row = document.createElement('div');
      row.className = 'uuid-row';
      row.innerHTML = `
        <code>${fmt(id)}</code>
        <button class="uuid-copy" aria-label="Копировать">копировать</button>
      `;
      row.querySelector('.uuid-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(fmt(id)).then(() => toast('UUID скопирован', 'success'));
      });
      output.appendChild(row);
    });
    copyBtn.disabled = false;
  }

  function rerender() {
    if (!list.length) return;
    const rows = output.querySelectorAll('.uuid-row code');
    rows.forEach((el, i) => { el.textContent = fmt(list[i]); });
  }

  container.querySelector('#uuidGenBtn').addEventListener('click', generate);
  upperEl.addEventListener('change', rerender);
  dashEl.addEventListener('change', rerender);

  copyBtn.addEventListener('click', () => {
    if (!list.length) return;
    navigator.clipboard.writeText(list.map(fmt).join('\n'))
      .then(() => toast(`Скопировано ${list.length}`, 'success'));
  });

  generate();
}
