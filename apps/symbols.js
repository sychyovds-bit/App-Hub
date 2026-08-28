import { toast } from '../core/toast.js';

const BLOCKS = {
  'Строчные латинские (расшир.)': [0x00E0, 0x00FF],
  'Греческий алфавит': [0x0391, 0x03C9],
  'Кириллица': [0x0410, 0x044F],
  'Стрелки': [0x2190, 0x21FF],
  'Математические операторы': [0x2200, 0x22FF],
  'Фигуры и рамки': [0x2500, 0x257F],
  'Геометрические фигуры': [0x25A0, 0x25CF],
  'Символы прочие': [0x2600, 0x26FF],
  'Декоративные': [0x2700, 0x27BF],
  'Валюты': [0x20A0, 0x20BF],
  'Супер-/подстрочные': [0x2070, 0x209F],
  'Латинская пунктуация': [0x2010, 0x206F]
};

export function init(container) {
  container.innerHTML = `
    <h1>Таблица символов</h1>
    <p class="subtitle">Клик по символу копирует его. Поиск по коду (U+2713) или самому символу</p>
    <div class="colors-search-box">
      <select id="symRange">
        ${Object.keys(BLOCKS).map((name, i) => `<option value="${i}">${name}</option>`).join('')}
      </select>
      <input id="symSearch" type="text" placeholder="Поиск: U+263A или ★" aria-label="Поиск символа">
    </div>
    <div class="sym-grid" id="symGrid"></div>
    <div class="sym-empty" id="symEmpty" hidden>Символ не найден в выбранных блоках</div>
  `;

  const rangeEl = container.querySelector('#symRange');
  const search = container.querySelector('#symSearch');
  const grid = container.querySelector('#symGrid');
  const empty = container.querySelector('#symEmpty');

  function renderBlock() {
    const [start, end] = BLOCKS[Object.keys(BLOCKS)[parseInt(rangeEl.value)]];
    grid.innerHTML = '';
    empty.hidden = true;
    for (let code = start; code <= end; code++) {
      const ch = String.fromCharCode(code);
      grid.appendChild(makeCell(ch, code));
    }
  }

  function makeCell(ch, code) {
    const cell = document.createElement('button');
    cell.className = 'sym-cell';
    cell.title = `U+${code.toString(16).toUpperCase().padStart(4, '0')} — копировать`;
    cell.innerHTML = `<span class="sym-char">${ch}</span><span class="sym-code">${code.toString(16).toUpperCase().padStart(4, '0')}</span>`;
    cell.addEventListener('click', () => {
      navigator.clipboard.writeText(ch).then(() => toast(`Символ «${ch}» скопирован`, 'success'));
    });
    return cell;
  }

  function doSearch(q) {
    q = q.trim().toUpperCase();
    grid.innerHTML = '';

    if (!q) { renderBlock(); return; }

    let found = 0;
    for (const [start, end] of Object.values(BLOCKS)) {
      for (let code = start; code <= end; code++) {
        const ch = String.fromCharCode(code);
        const hex = code.toString(16).toUpperCase().padStart(4, '0');
        if (ch.toUpperCase() === q || hex === q.replace(/^U\+?/, '') || ('U+' + hex) === q) {
          grid.appendChild(makeCell(ch, code));
          found++;
          if (found >= 50) break;
        }
      }
      if (found >= 50) break;
    }
    empty.hidden = found > 0;
  }

  rangeEl.addEventListener('change', () => { search.value = ''; renderBlock(); });
  search.addEventListener('input', () => doSearch(search.value));

  renderBlock();
}
