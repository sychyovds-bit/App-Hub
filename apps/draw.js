import { toast } from '../core/toast.js';

export function init(container) {
  container.innerHTML = `
    <h1>Рисование</h1>
    <p class="subtitle">Рисуйте мышью или на сенсорном экране</p>
    <div class="widget" style="max-width:580px">
      <div class="draw-tools">
        <input type="color" id="drawColor" value="#7c6cf0" title="Цвет">
        <input type="range" id="drawSize" min="1" max="40" value="5" title="Толщина">
        <button class="btn-ghost draw-tool-btn" id="drawEraserBtn" title="Ластик">Ластик</button>
        <button class="btn-ghost" id="drawUndoBtn" title="Отменить">Отменить</button>
        <button class="btn-ghost" id="drawClearBtn" title="Очистить">Очистить</button>
        <button class="btn" id="drawSaveBtn" title="Скачать">PNG</button>
      </div>
      <canvas class="draw-canvas" id="drawCanvas" width="520" height="380"></canvas>
    </div>
  `;

  const canvas = container.querySelector('#drawCanvas');
  const ctx = canvas.getContext('2d');
  const colorInput = container.querySelector('#drawColor');
  const sizeInput = container.querySelector('#drawSize');
  const eraserBtn = container.querySelector('#drawEraserBtn');

  let drawing = false;
  let eraser = false;
  let undoStack = [];
  const MAX_UNDO = 20;

  // Белый фон
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveState();

  function saveState() {
    if (undoStack.length >= MAX_UNDO) undoStack.shift();
    undoStack.push(canvas.toDataURL());
  }

  function undo() {
    if (undoStack.length <= 1) return;
    undoStack.pop();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = undoStack[undoStack.length - 1];
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - r.left) * canvas.width / r.width,
      y: (src.clientY - r.top) * canvas.height / r.height
    };
  }

  function start(e) {
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.preventDefault();
  }

  function move(e) {
    if (!drawing) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = eraser ? '#ffffff' : colorInput.value;
    ctx.lineWidth = eraser ? parseInt(sizeInput.value) * 3 : sizeInput.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    e.preventDefault();
  }

  function end() {
    if (drawing) {
      drawing = false;
      saveState();
    }
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);

  eraserBtn.addEventListener('click', () => {
    eraser = !eraser;
    eraserBtn.classList.toggle('active-tool', eraser);
    eraserBtn.textContent = eraser ? 'Кисть' : 'Ластик';
  });

  container.querySelector('#drawUndoBtn').addEventListener('click', undo);

  container.querySelector('#drawClearBtn').addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  });

  container.querySelector('#drawSaveBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'drawing.png';
    a.href = canvas.toDataURL();
    a.click();
    toast('Изображение сохранено', 'success');
  });
}
