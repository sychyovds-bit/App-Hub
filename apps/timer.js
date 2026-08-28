import { toast } from '../core/toast.js';
import { favicon } from '../core/favicon.js';
import { notify } from '../core/notify.js';
import { storage } from '../core/storage.js';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function init(container) {
  let totalSec = 25 * 60;
  let left = totalSec;
  let interval = null;
  let isFocus = true;

  container.innerHTML = `
    <h1>Pomodoro-таймер</h1>
    <p class="subtitle">Работайте сосредоточенно, отдыхайте вовремя</p>
    <div class="widget" style="text-align:center;max-width:420px">
      <div class="timer-modes">
        <button class="active" data-min="25" data-focus="1">Фокус 25</button>
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
      <div class="pomodoro-stats" id="pomodoroStats"></div>
    </div>
  `;

  const disp = container.querySelector('#timerDisp');
  const ring = container.querySelector('#timerRing');
  const startBtn = container.querySelector('#timerStartBtn');
  const resetBtn = container.querySelector('#timerResetBtn');
  const statsEl = container.querySelector('#pomodoroStats');

  const CIRCUMFERENCE = 2 * Math.PI * 88;
  ring.style.strokeDasharray = CIRCUMFERENCE;
  ring.style.strokeDashoffset = 0;

  function getStats() { return storage.get('pomodoro-stats', {}); }

  function renderStats() {
    const stats = getStats();
    const todayCount = stats[todayKey()] || 0;
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    statsEl.textContent = `Сегодня: ${todayCount} фокус-${plural(todayCount)} · Всего: ${total}`;
  }

  function plural(n) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'сессия';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'сессии';
    return 'сессий';
  }

  function recordFocus() {
    const stats = getStats();
    const key = todayKey();
    stats[key] = (stats[key] || 0) + 1;
    storage.set('pomodoro-stats', stats);
    renderStats();
  }

  function fmt(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function update() {
    disp.textContent = fmt(left);
    const progress = left / totalSec;
    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    if (interval) favicon.set(progress);
  }

  function stop() {
    clearInterval(interval);
    interval = null;
    startBtn.textContent = 'Старт';
  }

  function setMode(btn) {
    container.querySelectorAll('.timer-modes button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    isFocus = !!btn.dataset.focus;
    totalSec = left = parseInt(btn.dataset.min) * 60;
    stop();
    update();
  }

  container.querySelectorAll('.timer-modes button').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn));
  });

  function suggestNextMode() {
    // После фокуса → «Отдых 5», после отдыха → «Фокус 25»
    const nextBtn = Array.from(container.querySelectorAll('.timer-modes button'))
      .find(b => (isFocus ? b.dataset.min === '5' : b.dataset.min === '25'));
    if (!nextBtn) return;
    const label = nextBtn.textContent.trim();
    const msg = isFocus ? 'Предлагаю сделать перерыв' : 'Предлагаю вернуться к работе';
    toast(msg + ': ' + label + ' мин?', 'info', 8000, {
      actionLabel: label,
      onAction: () => {
        setMode(nextBtn);
        startBtn.click();
      }
    });
  }

  startBtn.addEventListener('click', () => {
    if (interval) { stop(); return; }
    startBtn.textContent = 'Пауза';
    notify.request();
    interval = setInterval(() => {
      left--;
      update();
      if (left <= 0) {
        stop();
        toast(isFocus ? 'Фокус завершён! Сделайте перерыв.' : 'Отдых окончен. Возвращайтесь к работе.', 'success', 5000);
        notify.send(isFocus ? 'Pomodoro: фокус завершён!' : 'Pomodoro: отдых окончен');
        if (isFocus) recordFocus();
        favicon.reset();
        left = totalSec;
        update();
        suggestNextMode();
      }
    }, 1000);
  });

  resetBtn.addEventListener('click', () => {
    stop();
    left = totalSec;
    update();
    favicon.reset();
  });

  document.addEventListener('router:leave', function onLeave(e) {
    if (e.detail.page !== 'timer') return;
    document.removeEventListener('router:leave', onLeave);
    stop();
    favicon.reset();
  });

  update();
  renderStats();
}
