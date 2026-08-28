import { toast } from '../core/toast.js';
import { hookFileDrop, readFileAsDataURL } from '../core/utils.js';

export function init(container) {
  container.innerHTML = `
    <h1>Рисование</h1>
    <p class="subtitle">Рисуйте мышью или на сенсорном экране · перетащите картинку как фон</p>
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
  const colorInput = container.querySelector('#drawColor');
  const sizeInput = container.querySelector('#drawSize');
  const eraserBtn = container.querySelector('#drawEraserBtn');

  // Offscreen canvas: рисуем в нём, видимый canvas только отображает
  const W = canvas.width, H = canvas.height;
  const useOffscreen = typeof OffscreenCanvas !== 'undefined';
  const off = useOffscreen
    ? new OffscreenCanvas(W, H)
    : (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; })();
  const ctx = off.getContext('2d');
  const view = canvas.getContext('2d');

  let drawing = false;
  let eraser = false;
  let undoStack = [];
  const MAX_UNDO = 20;
  let blitQueued = false;

  function blit() {
    view.clearRect(0, 0, W, H);
    view.drawImage(off, 0, 0);
  }

  function scheduleBlit() {
    if (blitQueued) return;
    blitQueued = true;
    requestAnimationFrame(() => { blitQueued = false; blit(); });
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  scheduleBlit();
  saveState();

  function saveState() {
    if (undoStack.length >= MAX_UNDO) undoStack.shift();
    if (useOffscreen) {
      off.convertToBlob().then(blob => {
        if (undoStack.length >= MAX_UNDO) undoStack.splice(undoStack.length - MAX_UNDO);
        undoStack.push(URL.createObjectURL(blob));
      }).catch(() => {});
    } else {
      undoStack.push(off.toDataURL());
    }
  }

  function undo() {
    if (undoStack.length <= 1) return;
    undoStack.pop();
    const src = undoStack[undoStack.length - 1];
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0);
      blit();
    };
    img.src = src;
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - r.left) * W / r.width,
      y: (src.clientY - r.top) * H / r.height
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
    scheduleBlit();
    e.preventDefault();
  }

  function end() {
    if (drawing) {
      drawing = false;
      blit();
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
    ctx.fillRect(0, 0, W, H);
    scheduleBlit();
    saveState();
  });

  container.querySelector('#drawSaveBtn').addEventListener('click', () => {
    const exportPng = (dataUrl) => {
      const a = document.createElement('a');
      a.download = 'drawing.png';
      a.href = dataUrl;
      a.click();
      toast('Изображение сохранено', 'success');
    };
    if (useOffscreen) {
      off.convertToBlob().then(blob => exportPng(URL.createObjectURL(blob)));
    } else {
      exportPng(off.toDataURL());
    }
  });

  hookFileDrop(canvas, {
    onFile: async (file) => {
      const src = await readFileAsDataURL(file);
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        const scale = Math.min(W / img.width, H / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        blit();
        saveState();
        toast('Изображение вставлено как фон', 'success');
      };
      img.src = src;
    }
  });
}
