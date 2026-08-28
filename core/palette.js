import { registry } from './registry.js';
import { router } from './router.js';
import { icons } from './icons.js';

let overlay = null;
let input = null;
let listEl = null;
let items = [];
let selected = 0;
let previousFocus = null;
let getCommands = null;

function ensureDom() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.className = 'palette-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Палитра команд');

  const box = document.createElement('div');
  box.className = 'palette';

  input = document.createElement('input');
  input.type = 'text';
  input.className = 'palette-input';
  input.placeholder = 'Приложение или команда...';
  input.setAttribute('aria-label', 'Поиск по командам');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'paletteList');
  input.setAttribute('autocomplete', 'off');

  listEl = document.createElement('div');
  listEl.className = 'palette-list';
  listEl.id = 'paletteList';
  listEl.setAttribute('role', 'listbox');
  listEl.setAttribute('aria-label', 'Результаты');

  box.appendChild(input);
  box.appendChild(listEl);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  input.addEventListener('input', () => render());
  input.addEventListener('keydown', onKeydown);
}

function collect() {
  const apps = registry.getAll().map(a => ({
    kind: 'app',
    id: a.id,
    title: a.title,
    icon: a.icon,
    hint: 'Приложение',
    run() { router.navigate(a.id); }
  }));

  const cmds = getCommands ? getCommands().map(c => ({
    kind: 'cmd',
    id: 'cmd-' + c.id,
    title: c.title,
    icon: c.icon || 'gear',
    hint: 'Команда',
    run: c.run
  })) : [];

  return [...cmds, ...apps];
}

function fuzzy(query, text) {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return false;
}

function render() {
  const query = input.value.trim();
  items = collect().filter(it => fuzzy(query, it.title)).slice(0, 12);
  selected = 0;
  listEl.innerHTML = '';

  items.forEach((it, idx) => {
    const el = document.createElement('div');
    el.className = 'palette-item' + (idx === selected ? ' selected' : '');
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', String(idx === selected));
    el.dataset.idx = idx;
    el.innerHTML = `
      <span class="palette-icon">${icons[it.icon] || ''}</span>
      <span class="palette-title">${it.title}</span>
      <span class="palette-hint">${it.hint}</span>
    `;
    el.addEventListener('mouseenter', () => select(idx));
    // Гасим всплытие: иначе документ-обработчики (например, автозакрытие меню темы)
    // получат этот клик как «клик вне меню» и сразу закроют то, что он только что открыл
    el.addEventListener('mouseup', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      activate(idx);
    });
    listEl.appendChild(el);
  });

  if (!items.length) {
    listEl.innerHTML = '<div class="palette-empty">Ничего не найдено</div>';
  }
}

function select(idx) {
  selected = idx;
  listEl.querySelectorAll('.palette-item').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
    el.setAttribute('aria-selected', String(i === idx));
  });
  const el = listEl.children[idx];
  if (el) el.scrollIntoView({ block: 'nearest' });
}

function activate(idx) {
  const it = items[idx];
  if (!it) return;
  close();
  it.run();
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (items.length) select((selected + 1) % items.length);
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (items.length) select((selected - 1 + items.length) % items.length);
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    activate(selected);
  }
}

export const palette = {
  init(commandsProvider) {
    getCommands = commandsProvider;
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });
  },

  toggle() {
    if (overlay && !overlay.hidden) close();
    else this.open();
  },

  open() {
    ensureDom();
    previousFocus = document.activeElement;
    input.value = '';
    render();
    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      input.focus();
    });
  }
};

function close() {
  if (!overlay || overlay.hidden) return;
  overlay.classList.remove('visible');
  setTimeout(() => { overlay.hidden = true; }, 160);
  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
  }
}
