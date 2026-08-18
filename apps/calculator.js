export function init(container) {
  let expr = '';

  container.innerHTML = `
    <h1>Калькулятор</h1>
    <p class="subtitle">Поддерживает основные арифметические операции</p>
    <div class="widget">
      <div class="calc-display" id="calcDisp">0</div>
      <div class="calc-grid" id="calcGrid"></div>
    </div>
  `;

  const disp = container.querySelector('#calcDisp');
  const grid = container.querySelector('#calcGrid');

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
      if (b.action === 'clear') { expr = ''; disp.textContent = '0'; }
      else if (b.action === 'back') { expr = expr.slice(0, -1); disp.textContent = expr || '0'; }
      else if (b.action === 'input') { expr += b.value; disp.textContent = expr; }
      else if (b.action === 'eval') {
        try {
          if (!/^[\d+\-*/.% ]+$/.test(expr)) throw 0;
          const r = Function('"use strict";return(' + expr.replace(/%/g, '/100') + ')')();
          expr = String(Math.round(r * 1e10) / 1e10);
          disp.textContent = expr;
        } catch {
          disp.textContent = 'Ошибка';
          expr = '';
        }
      }
    });
    grid.appendChild(btn);
  });
}
