import { toast } from '../core/toast.js';

export function init(container) {
  container.innerHTML = `
    <h1>Скриншот-таймер</h1>
    <p class="subtitle">Отсчёт 3-2-1 перед записью экрана</p>
    <div class="widget" style="text-align:center;max-width:460px">
      <div class="cd-inputs" style="justify-content:center;margin-bottom:16px">
        <label><input id="ssSec" type="number" min="1" max="10" value="3"> сек</label>
      </div>
      <button class="btn" id="ssStartBtn">Запустить отсчёт</button>
      <p class="subtitle" style="margin:16px 0 0">Во время отсчёта сверните это приложение и подготовьте экран</p>
    </div>
  `;

  const secEl = container.querySelector('#ssSec');
  const startBtn = container.querySelector('#ssStartBtn');
  let overlay = null;

  startBtn.addEventListener('click', () => {
    const sec = Math.max(1, Math.min(10, parseInt(secEl.value) || 3));
    let n = sec;

    overlay = document.createElement('div');
    overlay.className = 'ss-overlay';
    overlay.innerHTML = '<div class="ss-number"></div>';
    document.body.appendChild(overlay);
    const num = overlay.querySelector('.ss-number');

    function tick() {
      if (n <= 0) {
        overlay.classList.add('ss-done');
        num.textContent = 'СТАРТ';
        beep();
        setTimeout(() => {
          overlay.remove();
          overlay = null;
        }, 1500);
        toast('Начинайте запись экрана!', 'success');
        return;
      }
      num.textContent = n;
      num.classList.remove('ss-pop');
      void num.offsetWidth;
      num.classList.add('ss-pop');
      n--;
      setTimeout(tick, 1000);
    }

    tick();
  });

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }
}
