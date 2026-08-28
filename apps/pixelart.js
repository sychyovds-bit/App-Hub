import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';

const SIZES = [8, 16, 32, 64];
const CANVAS = 480;

export function init(container) {
  const prefs = storage.get('pixelart', { size: 16, color: '#7c6cf0' });
  let size = SIZES.includes(prefs.size) ? prefs.size : 16;
  let color = prefs.color || '#7c6cf0';
  let cells = new Array(size * size).fill(null);

  const savedArt = storage.get('pixelart-art', null);
  if (savedArt && savedArt.size === size && savedArt.filled) {
    Object.entries(savedArt.filled).forEach(([i, c]) => {
      const idx = parseInt(i, 10);
      if (idx >= 0 && idx < cells.length) cells[idx] = c;
    });
  }
  let drawing = false;
  let eraser = false;
  let undoStack = [];
  const MAX_UNDO = 10;
  let previewScale = 4;

  function saveArt() {
    const filled = {};
    cells.forEach((c, i) => { if (c) filled[i] = c; });
    storage.set('pixelart-art', { size, filled });
  }

  container.innerHTML = `
    <h1>Пиксель-арт</h1>
    <p class="subtitle">Левая кнопка — кисть, правая — ластик</p>
    <div class="widget pixelart-widget">
      <div class="pixelart-tools">
        <select id="pxSize" aria-label="Размер сетки">
          ${SIZES.map(s => `<option value="${s}" ${s === size ? 'selected' : ''}>${s}×${s}</option>`).join('')}
        </select>
        <input type="color" id="pxColor" value="${color}" title="Цвет кисти" aria-label="Цвет кисти">
        <button class="btn-ghost pixelart-tool" id="pxEraser" title="Ластик">Ластик</button>
        <button class="btn-ghost" id="pxUndo" title="Отменить">Undo</button>
        <button class="btn-ghost" id="pxClear" title="Очистить">Очистить</button>
        <button class="btn" id="pxSave" title="Скачать PNG">PNG</button>
      </div>
      <canvas id="pxCanvas" class="pixelart-canvas" width="${CANVAS}" height="${CANVAS}" aria-label="Холст пиксель-арта"></canvas>
      <div class="pixelart-side">
        <h3 style="font-size:14px;margin-bottom:8px">Предпросмотр</h3>
        <button class="btn-ghost" id="pxZoom">${previewScale}×</button>
        <canvas id="pxPreview" class="pixelart-preview" width="${size}" height="${size}"></canvas>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#pxCanvas');
  const ctx = canvas.getContext('2d');
  const preview = container.querySelector('#pxPreview');
  const pctx = preview.getContext('2d');
  const eraserBtn = container.querySelector('#pxEraser');

  const pxSize = CANVAS / size;

  function savePref() { storage.set('pixelart', { size, color }); }

  function pushUndo() {
    undoStack.push(cells.slice());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }

  function fillBackground() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS, CANVAS);
  }

  function drawCell(i) {
    const x = (i % size) * pxSize;
    const y = Math.floor(i / size) * pxSize;
    if (cells[i]) {
      ctx.fillStyle = cells[i];
      ctx.fillRect(x, y, pxSize, pxSize);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, pxSize, pxSize);
    }
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(120,120,140,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
      ctx.beginPath();
      ctx.moveTo(i * pxSize + 0.5, 0);
      ctx.lineTo(i * pxSize + 0.5, CANVAS);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * pxSize + 0.5);
      ctx.lineTo(CANVAS, i * pxSize + 0.5);
      ctx.stroke();
    }
  }

  function renderCanvas() {
    fillBackground();
    for (let i = 0; i < cells.length; i++) {
      if (cells[i]) drawCell(i);
    }
    drawGrid();
  }

  function renderPreview() {
    preview.width = size;
    preview.height = size;
    preview.style.width = (size * previewScale) + 'px';
    preview.style.height = (size * previewScale) + 'px';
    pctx.fillStyle = '#ffffff';
    pctx.fillRect(0, 0, size, size);
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i]) continue;
      pctx.fillStyle = cells[i];
      pctx.fillRect(i % size, Math.floor(i / size), 1, 1);
    }
  }

  function renderAll() {
    renderCanvas();
    renderPreview();
  }

  function cellAt(e) {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) * CANVAS / r.width / pxSize);
    const y = Math.floor((e.clientY - r.top) * CANVAS / r.height / pxSize);
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    return y * size + x;
  }

  function paint(i) {
    if (i === null) return;
    const next = eraser ? null : color;
    if (cells[i] === next) return;
    cells[i] = next;
    drawCell(i);
    // сетку не перерисовываем целиком — рисуем поверх
    const x = (i % size) * pxSize, y = Math.floor(i / size) * pxSize;
    ctx.strokeStyle = 'rgba(120,120,140,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, pxSize - 1, pxSize - 1);
    renderPreview();
  }

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) eraser = true;
    drawing = true;
    pushUndo();
    paint(cellAt(e));
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    paint(cellAt(e));
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const onUp = (e) => {
    if (e.button === 2) eraser = eraserBtn.classList.contains('active-tool');
    if (drawing) saveArt();
    drawing = false;
  };
  window.addEventListener('mouseup', onUp);

  document.addEventListener('router:leave', function onLeave(e) {
    if (e.detail.page !== 'pixelart') return;
    document.removeEventListener('router:leave', onLeave);
    window.removeEventListener('mouseup', onUp);
  });

  eraserBtn.addEventListener('click', () => {
    eraser = !eraser;
    eraserBtn.classList.toggle('active-tool', eraser);
    eraserBtn.textContent = eraser ? 'Кисть' : 'Ластик';
  });

  container.querySelector('#pxColor').addEventListener('input', (e) => {
    color = e.target.value;
    savePref();
  });

  container.querySelector('#pxSize').addEventListener('change', (e) => {
    size = parseInt(e.target.value, 10);
    cells = new Array(size * size).fill(null);
    undoStack = [];
    savePref();
    saveArt();
    renderAll();
  });

  container.querySelector('#pxZoom').addEventListener('click', (e) => {
    previewScale = previewScale === 4 ? 1 : 4;
    e.target.textContent = previewScale + '×';
    renderPreview();
  });

  container.querySelector('#pxUndo').addEventListener('click', () => {
    if (!undoStack.length) return;
    cells = undoStack.pop();
    renderAll();
    saveArt();
  });

  container.querySelector('#pxClear').addEventListener('click', () => {
    pushUndo();
    cells = new Array(size * size).fill(null);
    renderAll();
    saveArt();
    toast('Холст очищен', 'info');
  });

  container.querySelector('#pxSave').addEventListener('click', () => {
    const scale = Math.max(16, Math.floor(CANVAS / size));
    const c = document.createElement('canvas');
    c.width = c.height = size * scale;
    const cx = c.getContext('2d');
    cx.fillStyle = '#ffffff';
    cx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i]) continue;
      cx.fillStyle = cells[i];
      cx.fillRect((i % size) * scale, Math.floor(i / size) * scale, scale, scale);
    }
    const a = document.createElement('a');
    a.download = `pixelart-${size}x${size}.png`;
    a.href = c.toDataURL();
    a.click();
    toast('PNG сохранён', 'success');
  });

  renderAll();
}
