import { storage } from '../core/storage.js';

export function init(container) {
  let expr = '';
  let history = storage.get('calc-history', []);
  let histIdx = -1;

  container.innerHTML = `
    <h1>Калькулятор</h1>
    <p class="subtitle">Поддерживает основные арифметические операции · ↑/↓ — история</p>
    <div class="widget" id="calcWidget" tabindex="0">
      <div class="calc-display" id="calcDisp">0</div>
      <div class="calc-grid" id="calcGrid"></div>
      <div class="calc-history-wrap">
        <button class="btn-ghost calc-history-toggle" id="calcHistToggle" aria-expanded="false">История</button>
        <div class="calc-history" id="calcHistory" hidden></div>
      </div>
    </div>
  `;

  const widget = container.querySelector('#calcWidget');
  const disp = container.querySelector('#calcDisp');
  const grid = container.querySelector('#calcGrid');
  const histWrap = container.querySelector('#calcHistToggle');
  const histPanel = container.querySelector('#calcHistory');

  function renderHistory() {
    histPanel.innerHTML = '';
    if (!history.length) {
      histPanel.innerHTML = '<div class="calc-history-empty">История пуста</div>';
      return;
    }
    history.forEach((h, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'calc-history-item';
      el.dataset.idx = i;
      el.innerHTML = `<span>${h.e.replace(/</g, '&lt;')}</span><b>= ${h.r}</b>`;
      el.addEventListener('click', () => {
        expr = h.e;
        disp.textContent = h.r;
        histIdx = -1;
      });
      histPanel.appendChild(el);
    });
  }

  function pushHistory(e, r) {
    history.unshift({ e, r });
    if (history.length > 10) history.pop();
    storage.set('calc-history', history);
    histIdx = -1;
    renderHistory();
  }

  const buttons = [
    { label: 'C', action: 'clear' },
    { label: '\u232B', action: 'back' },
    { label: '%', action: 'input', value: '%' },
    { label: '\u00F7', action: 'input', value: '/', cls: 'op' },
    { label: '7', action: 'input', value: '7' },
    { label: '8', action: 'input', value: '8' },
    { label: '9', action: 'input', value: '9' },
    { label: '\u00D7', action: 'input', value: '*', cls: 'op' },
    { label: '4', action: 'input', value: '4' },
    { label: '5', action: 'input', value: '5' },
    { label: '6', action: 'input', value: '6' },
    { label: '\u2212', action: 'input', value: '-', cls: 'op' },
    { label: '1', action: 'input', value: '1' },
    { label: '2', action: 'input', value: '2' },
    { label: '3', action: 'input', value: '3' },
    { label: '+', action: 'input', value: '+', cls: 'op' },
    { label: '0', action: 'input', value: '0' },
    { label: '.', action: 'input', value: '.' },
    { label: '=', action: 'eval', cls: 'eq', span: 2 }
  ];

  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.textContent = b.label;
    if (b.cls) btn.className = b.cls;
    if (b.span) btn.style.gridColumn = `span ${b.span}`;
    btn.addEventListener('click', () => {
      if (b.action === 'clear') {
        expr = ''; disp.textContent = '0';
      } else if (b.action === 'back') {
        expr = expr.slice(0, -1); disp.textContent = expr || '0';
      } else if (b.action === 'input') {
        expr += b.value; disp.textContent = expr;
      } else if (b.action === 'eval') {
        try {
          if (!/^[\d+\-*/.% ]+$/.test(expr) || !expr.trim()) throw 0;
          const source = expr;
          const r = Function('"use strict";return(' + expr.replace(/%/g, '/100') + ')')();
          const result = String(Math.round(r * 1e10) / 1e10);
          expr = result;
          disp.textContent = result;
          if (!Number.isFinite(r)) throw 0;
          pushHistory(source, result);
        } catch {
          disp.textContent = 'Ошибка';
          expr = '';
        }
      }
    });
    grid.appendChild(btn);
  });

  function stepHistory(dir) {
    if (!history.length) return;
    if (histIdx === -1) {
      histIdx = dir === 1 ? 0 : history.length - 1;
    } else {
      histIdx = (histIdx + dir + history.length) % history.length;
    }
    expr = history[histIdx].e;
    disp.textContent = expr;
  }

  function onKeydown(e) {
    if (e.key === 'ArrowUp') { e.preventDefault(); stepHistory(1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepHistory(-1); }
  }
  widget.addEventListener('keydown', onKeydown);

  histWrap.addEventListener('click', () => {
    const open = histPanel.hidden;
    histPanel.hidden = !open;
    histWrap.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('router:leave', function onLeave(e) {
    if (e.detail.page !== 'calculator') return;
    document.removeEventListener('router:leave', onLeave);
    widget.removeEventListener('keydown', onKeydown);
  });

  renderHistory();
  widget.focus();
}
