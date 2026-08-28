import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';

const SIGNATURES = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 },
  { label: '6/8', beats: 6 }
];

export function init(container) {
  const prefs = storage.get('metronome', { bpm: 100, sig: '4/4' });
  let bpm = Math.min(240, Math.max(30, prefs.bpm || 100));
  let sigLabel = prefs.sig && SIGNATURES.some(s => s.label === prefs.sig) ? prefs.sig : '4/4';

  let ctx = null;
  let schedTimer = null;
  let nextNoteTime = 0;
  let beatIndex = 0;

  container.innerHTML = `
    <h1>Метроном</h1>
    <p class="subtitle">Точный ритм через Web Audio API</p>
    <div class="widget" style="max-width:440px;text-align:center">
      <div class="metro-bpm" id="metroBpmVal">${bpm}</div>
      <div class="metro-bpm-label">ударов в минуту</div>
      <div class="metro-controls">
        <button class="btn-ghost" id="bpmMinus" aria-label="Минус 5">−5</button>
        <input type="range" id="bpmSlider" min="30" max="240" step="1" value="${bpm}" aria-label="Темп">
        <button class="btn-ghost" id="bpmPlus" aria-label="Плюс 5">+5</button>
      </div>
      <div class="metro-sigs" id="metroSigs">
        ${SIGNATURES.map(s => `<button data-beats="${s.beats}" class="${s.label === sigLabel ? 'active' : ''}">${s.label}</button>`).join('')}
      </div>
      <div class="metro-beats" id="metroBeats"></div>
      <div class="timer-btns">
        <button class="btn" id="metroStartBtn">Старт</button>
        <button class="btn-ghost" id="metroTapBtn">Tap Tempo</button>
      </div>
    </div>
  `;

  const bpmVal = container.querySelector('#metroBpmVal');
  const slider = container.querySelector('#bpmSlider');
  const startBtn = container.querySelector('#metroStartBtn');
  const tapBtn = container.querySelector('#metroTapBtn');
  const beatsEl = container.querySelector('#metroBeats');
  const sigsEl = container.querySelector('#metroSigs');

  let beats = SIGNATURES.find(s => s.label === sigLabel).beats;

  function beatsHtml() {
    beatsEl.innerHTML = Array.from({ length: beats }, (_, i) =>
      `<span class="metro-dot${i === 0 ? ' accent' : ''}" data-beat="${i}"></span>`).join('');
  }

  function save() { storage.set('metronome', { bpm, sig: sigLabel }); }

  function setBpm(v) {
    bpm = Math.min(240, Math.max(30, Math.round(v)));
    slider.value = bpm;
    bpmVal.textContent = bpm;
    save();
  }

  slider.addEventListener('input', () => setBpm(slider.value));
  container.querySelector('#bpmMinus').addEventListener('click', () => setBpm(bpm - 5));
  container.querySelector('#bpmPlus').addEventListener('click', () => setBpm(bpm + 5));

  sigsEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-beats]');
    if (!btn) return;
    sigsEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    beats = parseInt(btn.dataset.beats);
    sigLabel = btn.textContent.trim();
    beatIndex = 0;
    beatsHtml();
    save();
  });

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function click(time, isAccent) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = isAccent ? 1568 : 1046;
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(isAccent ? 0.5 : 0.3, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  function scheduler() {
    const secPerBeat = 60 / bpm;
    while (nextNoteTime < ctx.currentTime + 0.1) {
      click(nextNoteTime, beatIndex === 0);
      const beat = beatIndex;
      const delay = Math.max(0, (nextNoteTime - ctx.currentTime) * 1000);
      setTimeout(() => highlightBeat(beat), delay);
      nextNoteTime += secPerBeat;
      beatIndex = (beatIndex + 1) % beats;
    }
  }

  function highlightBeat(i) {
    beatsEl.querySelectorAll('.metro-dot').forEach(d => d.classList.remove('on'));
    const dot = beatsEl.querySelector(`[data-beat="${i}"]`);
    if (dot) dot.classList.add('on');
  }

  function start() {
    ensureCtx();
    beatIndex = 0;
    nextNoteTime = ctx.currentTime + 0.05;
    schedTimer = setInterval(scheduler, 25);
    startBtn.textContent = 'Стоп';
  }

  function stop() {
    clearInterval(schedTimer);
    schedTimer = null;
    startBtn.textContent = 'Старт';
    beatsEl.querySelectorAll('.metro-dot').forEach(d => d.classList.remove('on'));
  }

  startBtn.addEventListener('click', () => (schedTimer ? stop() : start()));

  let taps = [];
  tapBtn.addEventListener('click', () => {
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
    taps.push(now);
    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(60000 / avg);
    }
    if (taps.length > 8) taps = taps.slice(-8);
  });

  document.addEventListener('router:leave', function onLeave(e) {
    if (e.detail.page !== 'metronome') return;
    document.removeEventListener('router:leave', onLeave);
    stop();
    if (ctx) { ctx.close().catch(() => {}); ctx = null; }
  });

  beatsHtml();
  toast('Нажмите «Tap Tempo» несколько раз, чтобы задать темп', 'info', 2500);
}
