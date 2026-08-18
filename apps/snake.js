import { storage } from '../core/storage.js';
import { modal } from '../core/modal.js';

export function init(container) {
  const CELL = 20, COLS = 20, ROWS = 20;
  let snake, dir, food, score, animId = null, lastTime = 0;
  let best = storage.get('snakeBest', 0);

  container.innerHTML = `
    <h1>Змейка</h1>
    <p class="subtitle">Управление стрелками или клавишами WASD</p>
    <div class="widget" style="max-width:460px">
      <div class="snake-info">
        <span>Счёт: <b id="snakeScore">0</b></span>
        <span>Рекорд: <b id="snakeBest">${best}</b></span>
      </div>
      <canvas class="snake-canvas" id="snakeCanvas" width="400" height="400"></canvas>
      <div style="margin-top:14px;display:flex;gap:10px">
        <button class="btn" id="snakeStartBtn">Новая игра</button>
        <button class="btn-ghost" id="snakePauseBtn">Пауза</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#snakeCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = container.querySelector('#snakeScore');
  const bestEl = container.querySelector('#snakeBest');
  const startBtn = container.querySelector('#snakeStartBtn');
  const pauseBtn = container.querySelector('#snakePauseBtn');
  let paused = false;

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
  }

  function draw() {
    // Фон
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--panel2').trim() || '#f9f8fd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сетка
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e9e7f0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }

    // Еда
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();

    // Змейка
    snake.forEach((s, i) => {
      const t = i / snake.length;
      ctx.fillStyle = i === 0 ? '#7c6cf0' : `rgba(124,108,240,${1 - t * 0.6})`;
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 5);
      ctx.fill();
    });

    // Глаза на голове
    if (snake.length > 0) {
      const head = snake[0];
      ctx.fillStyle = '#fff';
      const cx = head.x * CELL + CELL / 2;
      const cy = head.y * CELL + CELL / 2;
      const ex = dir.x * 3, ey = dir.y * 3;
      ctx.beginPath(); ctx.arc(cx - 4 + ex, cy - 4 + ey, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 4 + ex, cy - 4 + ey, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  function gameOver() {
    cancelAnimationFrame(animId);
    animId = null;
    if (score > best) {
      best = score;
      storage.set('snakeBest', best);
      bestEl.textContent = best;
    }
    modal({
      title: 'Игра окончена',
      body: `<p style="font-size:16px">Счёт: <strong>${score}</strong></p><p>Рекорд: <strong>${best}</strong></p>`,
      actions: [
        { label: 'Играть снова', class: 'btn', onClick: start },
        { label: 'Закрыть', class: 'btn-ghost' }
      ]
    });
  }

  function tick() {
    if (paused) return;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = score;
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function loop(timestamp) {
    if (timestamp - lastTime >= 120) {
      lastTime = timestamp;
      tick();
    }
    if (animId !== null) animId = requestAnimationFrame(loop);
  }

  function start() {
    if (animId) cancelAnimationFrame(animId);
    snake = [{ x: 10, y: 10 }];
    dir = { x: 1, y: 0 };
    score = 0;
    paused = false;
    scoreEl.textContent = '0';
    pauseBtn.textContent = 'Пауза';
    placeFood();
    draw();
    lastTime = 0;
    animId = requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!animId) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Продолжить' : 'Пауза';
  }

  function handleKey(e) {
    const k = e.key.toLowerCase();
    const map = {
      arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 }
    };
    if (map[k] && !(map[k].x === -dir.x && map[k].y === -dir.y)) {
      dir = map[k];
      e.preventDefault();
    }
    if (k === ' ') { togglePause(); e.preventDefault(); }
  }

  document.addEventListener('keydown', handleKey);
  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', togglePause);

  // Начальное состояние
  snake = [{ x: 10, y: 10 }];
  dir = { x: 1, y: 0 };
  food = { x: 15, y: 10 };
  draw();
}
