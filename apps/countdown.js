import { toast } from '../core/toast.js';
import { favicon } from '../core/favicon.js';
import { notify } from '../core/notify.js';

export function init(container) {
  container.innerHTML = `
    <h1>Countdown-таймер</h1>
    <p class="subtitle">Обратный отсчёт с звуковым сигналом</p>
    <div class="widget" style="text-align:center;max-width:460px">
      <div class="cd-setup" id="cdSetup">
        <div class="cd-inputs">
          <label><input id="cdHours" type="number" min="0" max="99" value="0"> час</label>
          <label><input id="cdMin" type="number" min="0" max="59" value="1"> мин</label>
          <label><input id="cdSec" type="number" min="0" max="59" value="30"> сек</label>
        </div>
        <div class="cd-presets">
          <button class="btn-ghost" data-s="60">1 мин</button>
          <button class="btn-ghost" data-s="180">3 мин</button>
          <button class="btn-ghost" data-s="300">5 мин</button>
          <button class="btn-ghost" data-s="600">10 мин</button>
        </div>
      </div>
      <div class="timer-ring-wrap">
        <svg class="timer-ring" viewBox="0 0 200 200">
          <circle class="timer-ring-bg" cx="100" cy="100" r="88"/>
          <circle class="timer-ring-progress" id="cdRing" cx="100" cy="100" r="88"/>
        </svg>
        <div class="timer-display" id="cdDisp">01:30</div>
      </div>
      <div class="timer-btns">
        <button class="btn" id="cdStartBtn">Старт</button>
        <button class="btn-ghost" id="cdResetBtn">Сброс</button>
      </div>
    </div>
  `;

  const hoursEl = container.querySelector('#cdHours');
  const minEl = container.querySelector('#cdMin');
  const secEl = container.querySelector('#cdSec');
  const disp = container.querySelector('#cdDisp');
  const ring = container.querySelector('#cdRing');
  const startBtn = container.querySelector('#cdStartBtn');
  const resetBtn = container.querySelector('#cdResetBtn');

  const CIRCUMFERENCE = 2 * Math.PI * 88;
  ring.style.strokeDasharray = CIRCUMFERENCE;
  ring.style.strokeDashoffset = 0;

  let totalSec = 0;
  let left = 0;
  let interval = null;

  function readValues() {
    const h = Math.max(0, Math.min(99, parseInt(hoursEl.value) || 0));
    const m = Math.max(0, Math.min(59, parseInt(minEl.value) || 0));
    const s = Math.max(0, Math.min(59, parseInt(secEl.value) || 0));
    return h * 3600 + m * 60 + s;
  }

  function fmt(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function update() {
    disp.textContent = fmt(left);
    const progress = totalSec > 0 ? left / totalSec : 0;
    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    if (interval) favicon.set(progress);
  }

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      for (let n = 0; n < 3; n++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, now + n * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.4, now + n * 0.4 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n * 0.4 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + n * 0.4);
        osc.stop(now + n * 0.4 + 0.35);
      }
    } catch {}
  }

  function stop() {
    clearInterval(interval);
    interval = null;
    startBtn.textContent = 'Старт';
  }

  function start() {
    if (interval) { stop(); return; }
    if (left <= 0) {
      totalSec = left = readValues();
      if (left <= 0) { toast('Установите время больше нуля', 'warning'); return; }
    }
    startBtn.textContent = 'Пауза';
    notify.request();
    interval = setInterval(() => {
      left--;
      update();
      if (left <= 0) {
        stop();
        beep();
        toast('Время вышло!', 'success', 5000);
        notify.send('Обратный отсчёт завершён');
        favicon.reset();
        left = 0;
        update();
      }
    }, 1000);
  }

  function reset() {
    stop();
    totalSec = left = readValues();
    update();
  }

  container.querySelectorAll('.cd-presets button').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = parseInt(btn.dataset.s);
      hoursEl.value = Math.floor(s / 3600);
      minEl.value = Math.floor((s % 3600) / 60);
      secEl.value = s % 60;
      reset();
    });
  });

  [hoursEl, minEl, secEl].forEach(el => el.addEventListener('input', () => {
    if (!interval) reset();
  }));

  startBtn.addEventListener('click', start);
  resetBtn.addEventListener('click', reset);

  document.addEventListener('router:leave', function onLeave(e) {
    if (e.detail.page !== 'countdown') return;
    document.removeEventListener('router:leave', onLeave);
    stop();
    favicon.reset();
  });

  reset();
  update();
}
