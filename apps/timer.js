import { toast } from '../core/toast.js';

export function init(container) {
  let totalSec = 25 * 60;
  let left = totalSec;
  let interval = null;

  container.innerHTML = `
    <h1>Pomodoro-таймер</h1>
    <p class="subtitle">Работайте сосредоточенно, отдыхайте вовремя</p>
    <div class="widget" style="text-align:center;max-width:420px">
      <div class="timer-modes">
        <button class="active" data-min="25">Фокус 25</button>
        <button data-min="5">Отдых 5</button>
        <button data-min="15">Отдых 15</button>
      </div>
      <div class="timer-ring-wrap">
        <svg class="timer-ring" viewBox="0 0 200 200">
          <circle class="timer-ring-bg" cx="100" cy="100" r="88"/>
          <circle class="timer-ring-progress" id="timerRing" cx="100" cy="100" r="88"/>
        </svg>
        <div class="timer-display" id="timerDisp">25:00</div>
      </div>
      <div class="timer-btns">
        <button class="btn" id="timerStartBtn">Старт</button>
        <button class="btn-ghost" id="timerResetBtn">Сброс</button>
      </div>
    </div>
  `;

  const disp = container.querySelector('#timerDisp');
  const ring = container.querySelector('#timerRing');
  const startBtn = container.querySelector('#timerStartBtn');
  const resetBtn = container.querySelector('#timerResetBtn');

  const CIRCUMFERENCE = 2 * Math.PI * 88;
  ring.style.strokeDasharray = CIRCUMFERENCE;
  ring.style.strokeDashoffset = 0;

  function fmt(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function update() {
    disp.textContent = fmt(left);
    const progress = left / totalSec;
    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  }

  function stop() {
    clearInterval(interval);
    interval = null;
    startBtn.textContent = 'Старт';
  }

  container.querySelectorAll('.timer-modes button').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.timer-modes button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      totalSec = left = parseInt(btn.dataset.min) * 60;
      stop();
      update();
    });
  });

  startBtn.addEventListener('click', () => {
    if (interval) { stop(); return; }
    startBtn.textContent = 'Пауза';
    interval = setInterval(() => {
      left--;
      update();
      if (left <= 0) {
        stop();
        toast('Время вышло! Отличная работа.', 'success', 5000);
        left = totalSec;
        update();
      }
    }, 1000);
  });

  resetBtn.addEventListener('click', () => {
    stop();
    left = totalSec;
    update();
  });

  update();
}
