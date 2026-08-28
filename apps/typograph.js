import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';

export function init(container) {
  const prefs = storage.get('typograph', { base: 16 });
  let base = Math.min(64, Math.max(8, prefs.base || 16));
  let previewPx = base;
  let lineH = 1.5;

  container.innerHTML = `
    <h1>Типограф</h1>
    <p class="subtitle">Конвертер единиц и живой предпросмотр типографики</p>
    <div class="type-grid">
      <div class="widget">
        <h3 style="font-size:14px;margin-bottom:10px;">Базовый размер корня</h3>
        <div class="conv-row">
          <input type="number" id="baseInput" value="${base}" min="8" max="64" aria-label="Базовый размер в px">
          <span style="color:var(--muted)">px (html { font-size })</span>
        </div>
        <h3 style="font-size:14px;margin:18px 0 10px;">Значение в px → все единицы</h3>
        <div class="conv-row">
          <input type="number" id="pxInput" value="${base}" min="1" max="512" aria-label="Значение в пикселях">
          <span style="color:var(--muted)">px</span>
        </div>
        <div id="unitsTable" class="base-results"></div>
        <h3 style="font-size:14px;margin:18px 0 10px;">Line-height</h3>
        <div class="conv-row">
          <input type="number" id="lhInput" value="1.5" min="0.5" max="4" step="0.05" aria-label="Множитель межстрочного интервала">
          <span id="lhPx" style="color:var(--muted)"></span>
        </div>
      </div>
      <div class="widget type-preview-wrap">
        <div class="conv-row" style="margin-bottom:12px">
          <label style="color:var(--muted);font-size:13px">Размер, px:</label>
          <input type="number" id="prevPx" value="${base}" min="6" max="200" aria-label="Размер текста предпросмотра">
        </div>
        <div class="type-preview" id="typePreview">Съешь же ещё этих мягких французских булок, да выпей чаю. The quick brown fox jumps over the lazy dog.</div>
      </div>
    </div>
  `;

  const baseInput = container.querySelector('#baseInput');
  const pxInput = container.querySelector('#pxInput');
  const unitsTable = container.querySelector('#unitsTable');
  const lhInput = container.querySelector('#lhInput');
  const lhPx = container.querySelector('#lhPx');
  const prevPx = container.querySelector('#prevPx');
  const preview = container.querySelector('#typePreview');

  function round(v, d = 4) {
    const k = Math.pow(10, d);
    return Math.round(v * k) / k;
  }

  function row(label, value) {
    return `<div class="val-row"><span class="base-label">${label}</span><code>${value}</code><button data-copy="${value}">Копировать</button></div>`;
  }

  function renderUnits() {
    const px = parseFloat(pxInput.value);
    if (Number.isNaN(px) || px <= 0) {
      unitsTable.innerHTML = '<p style="color:var(--muted)">Введите значение в px</p>';
      return;
    }
    let html = '';
    html += row('px', round(px, 2) + 'px');
    html += row('rem', round(px / base) + 'rem');
    html += row('em*', round(px / base) + 'em');
    html += row('pt', round(px * 0.75, 2) + 'pt');
    html += row('%', round((px / base) * 100, 2) + '%');
    html += '<p style="color:var(--muted);font-size:12px">* em равен rem только относительно базового размера — внутри элементов без наследования значение может отличаться</p>';
    unitsTable.innerHTML = html;
  }

  function renderLh() {
    const lh = parseFloat(lhInput.value);
    if (Number.isNaN(lh) || lh <= 0) { lhPx.textContent = ''; return; }
    lineH = lh;
    lhPx.textContent = `= ${round(lh * previewPx, 1)} px`;
    preview.style.lineHeight = String(lh);
  }

  function renderPreview() {
    previewPx = parseFloat(prevPx.value);
    if (Number.isNaN(previewPx) || previewPx <= 0) return;
    preview.style.fontSize = previewPx + 'px';
    renderLh();
  }

  baseInput.addEventListener('input', () => {
    const v = parseFloat(baseInput.value);
    if (Number.isNaN(v) || v < 8 || v > 64) return;
    base = v;
    storage.set('typograph', { base });
    renderUnits();
  });

  pxInput.addEventListener('input', renderUnits);
  prevPx.addEventListener('input', renderPreview);
  lhInput.addEventListener('input', renderLh);

  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copy)
      .then(() => toast('Скопировано: ' + btn.dataset.copy, 'info'))
      .catch(() => toast('Не удалось скопировать', 'error'));
  });

  renderUnits();
  renderPreview();
}
