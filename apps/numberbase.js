import { toast } from '../core/toast.js';

function toRoman(n) {
  if (n < 1 || n > 3999) return '';
  const map = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let out = '';
  for (const [v, s] of map) {
    while (n >= v) { out += s; n -= v; }
  }
  return out;
}

export function init(container) {
  container.innerHTML = `
    <h1>Системы счисления</h1>
    <p class="subtitle">Десятичные, HEX, бинарные, восьмеричные и римские числа</p>
    <div class="widget" style="max-width:560px">
      <h3 style="font-size:14px;margin-bottom:10px;">Из десятичной</h3>
      <div class="todo-row">
        <input type="number" id="decInput" value="255" aria-label="Десятичное число">
        <button class="btn" id="decConvertBtn">Конвертировать</button>
      </div>
      <div id="decResults" class="base-results"></div>

      <h3 style="font-size:14px;margin:20px 0 10px;">В десятичную</h3>
      <div class="todo-row">
        <input type="text" id="fromInput" placeholder="Например: FF, 1010, 377, VIII" aria-label="Число в другой системе">
        <select id="fromBase" aria-label="Исходная система">
          <option value="16">HEX (16)</option>
          <option value="2">BIN (2)</option>
          <option value="8">OCT (8)</option>
          <option value="roman">Римские</option>
        </select>
        <button class="btn" id="fromConvertBtn">Конвертировать</button>
      </div>
      <div id="fromResults" class="base-results"></div>
    </div>
  `;

  const decInput = container.querySelector('#decInput');
  const decResults = container.querySelector('#decResults');
  const fromInput = container.querySelector('#fromInput');
  const fromBase = container.querySelector('#fromBase');
  const fromResults = container.querySelector('#fromResults');

  function row(label, value) {
    if (!value) return '';
    return `<div class="val-row"><span class="base-label">${label}</span><code>${value}</code><button data-copy="${value.replace(/"/g, '&quot;')}">Копировать</button></div>`;
  }

  function convertDec() {
    const n = parseInt(decInput.value, 10);
    if (Number.isNaN(n)) {
      decResults.innerHTML = '<p style="color:var(--muted)">Введите целое число</p>';
      return;
    }
    const abs = Math.abs(n);
    let html = '';
    html += row('HEX', (n < 0 ? '-' : '') + abs.toString(16).toUpperCase());
    html += row('BIN', (n < 0 ? '-' : '') + abs.toString(2));
    html += row('OCT', (n < 0 ? '-' : '') + abs.toString(8));
    if (n >= 1 && n <= 3999) {
      html += row('Римские', toRoman(n));
    } else {
      html += '<p style="color:var(--muted);font-size:13px;">Римская запись доступна для чисел 1–3999</p>';
    }
    decResults.innerHTML = html;
  }

  function fromRoman(s) {
    const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    const up = s.toUpperCase().trim();
    if (!up || !/^[IVXLCDM]+$/.test(up)) return NaN;
    for (let i = 0; i < up.length; i++) {
      const cur = values[up[i]];
      const next = values[up[i + 1]];
      if (next && cur < next) total -= cur;
      else total += cur;
    }
    // Проверка корректности (обратная конвертация)
    return toRoman(total) === up ? total : NaN;
  }

  function convertFrom() {
    const raw = fromInput.value.trim();
    if (!raw) {
      fromResults.innerHTML = '<p style="color:var(--muted)">Введите значение</p>';
      return;
    }
    let n;
    if (fromBase.value === 'roman') {
      n = fromRoman(raw);
    } else {
      const base = parseInt(fromBase.value, 10);
      if (!new RegExp(`^-?[0-9a-fA-F]{1,24}$`).test(raw)) n = NaN;
      else n = parseInt(raw, base);
      if (base === 2 && !/^-?[01]+$/.test(raw)) n = NaN;
      if (base === 8 && !/^-?[0-7]+$/.test(raw)) n = NaN;
      if (base === 16 && !Number.isFinite(n)) n = NaN;
    }
    if (Number.isNaN(n) || !Number.isSafeInteger(n)) {
      fromResults.innerHTML = '<p style="color:var(--danger)">Не удалось распознать число</p>';
      return;
    }
    fromResults.innerHTML = `<div class="val-row"><span class="base-label">DEC</span><code>${n}</code><button data-copy="${n}">Копировать</button></div>`;
  }

  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copy)
      .then(() => toast('Скопировано: ' + btn.dataset.copy, 'info'))
      .catch(() => toast('Не удалось скопировать', 'error'));
  });

  container.querySelector('#decConvertBtn').addEventListener('click', convertDec);
  decInput.addEventListener('keydown', e => { if (e.key === 'Enter') convertDec(); });
  container.querySelector('#fromConvertBtn').addEventListener('click', convertFrom);
  fromInput.addEventListener('keydown', e => { if (e.key === 'Enter') convertFrom(); });

  convertDec();
}
