import { toast } from '../core/toast.js';

let libPromise = null;

function loadQrLib() {
  if (window.qrcode) return Promise.resolve();
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'lib/qrcode.js';
      s.onload = resolve;
      s.onerror = () => { libPromise = null; reject(new Error('load')); };
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

export function init(container) {
  container.innerHTML = `
    <h1>QR-генератор</h1>
    <p class="subtitle">Генерация QR-кода из текста или ссылки</p>
    <div class="widget" style="max-width:560px">
      <div class="qr-controls">
        <textarea id="qrText" placeholder="Текст или URL..." rows="3"></textarea>
        <div class="qr-opts">
          <label>Уровень коррекции
            <select id="qrLevel">
              <option value="L">L — минимальный</option>
              <option value="M" selected>M — средний</option>
              <option value="Q">Q — высокий</option>
              <option value="H">H — максимальный</option>
            </select>
          </label>
          <label>Размер ячейки
            <select id="qrCell">
              <option value="4">Мелкий</option>
              <option value="6" selected>Средний</option>
              <option value="8">Крупный</option>
            </select>
          </label>
        </div>
        <div class="qr-actions">
          <button class="btn" id="qrGenBtn">Сгенерировать</button>
          <button class="btn-ghost" id="qrSaveBtn" disabled>Скачать PNG</button>
        </div>
        <div class="qr-output" id="qrOutput" aria-live="polite"></div>
      </div>
    </div>
  `;

  const textEl = container.querySelector('#qrText');
  const levelEl = container.querySelector('#qrLevel');
  const cellEl = container.querySelector('#qrCell');
  const genBtn = container.querySelector('#qrGenBtn');
  const saveBtn = container.querySelector('#qrSaveBtn');
  const output = container.querySelector('#qrOutput');

  async function generate() {
    const text = textEl.value.trim();
    if (!text) { toast('Введите текст или URL', 'warning'); return; }
    try {
      await loadQrLib();
      const qr = window.qrcode(0, levelEl.value);
      qr.addData(text);
      qr.make();

      const cell = parseInt(cellEl.value);
      const margin = cell * 2;
      const count = qr.getModuleCount();
      const size = count * cell + margin * 2;

      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000000';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) ctx.fillRect(margin + c * cell, margin + r * cell, cell, cell);
        }
      }

      output.innerHTML = '';
      canvas.className = 'qr-canvas';
      output.appendChild(canvas);
      saveBtn.disabled = false;
    } catch {
      toast('Не удалось загрузить библиотеку QR или создать код', 'error');
    }
  }

  genBtn.addEventListener('click', generate);

  textEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generate();
    }
  });

  textEl.addEventListener('paste', () => {
    setTimeout(() => { if (textEl.value.trim()) generate(); }, 50);
  });

  saveBtn.addEventListener('click', () => {
    const canvas = output.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('PNG сохранён', 'success');
  });
}
