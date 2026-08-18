import { storage } from '../core/storage.js';

export function init(container) {
  container.innerHTML = `
    <h1>Заметки</h1>
    <p class="subtitle">Текст сохраняется автоматически при вводе</p>
    <div class="widget" style="max-width:640px">
      <textarea class="note-area" id="noteArea" placeholder="Начните писать..."></textarea>
      <div class="note-footer">
        <span class="note-status" id="noteStatus"></span>
        <span class="note-stats" id="noteStats"></span>
      </div>
    </div>
  `;

  const area = container.querySelector('#noteArea');
  const status = container.querySelector('#noteStatus');
  const stats = container.querySelector('#noteStats');
  area.value = storage.get('note', '');

  function updateStats() {
    const text = area.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    stats.textContent = `${words} слов · ${chars} символов · ${lines} строк`;
  }

  let timeout;
  area.addEventListener('input', () => {
    updateStats();
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      storage.set('note', area.value);
      status.textContent = 'Сохранено в ' + new Date().toLocaleTimeString();
    }, 500);
  });

  updateStats();
}
