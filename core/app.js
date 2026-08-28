import { registry } from './registry.js';
import { router } from './router.js';
import { theme } from './theme.js';
import { storage } from './storage.js';
import { icons } from './icons.js';
import { debounce } from './utils.js';
import { toast } from './toast.js';
import { modal } from './modal.js';
import { cloud } from './cloud.js';
import { initHoverPreview } from './preview.js';
import { help } from './help.js';
import { palette } from './palette.js';

// ===== Глобальная обработка ошибок =====

let errorCount = 0;

function reportError(message, source) {
  const text = message ? String(message) : 'Неизвестная ошибка';
  const shown = text.length > 80 ? text.slice(0, 77) + '...' : text;
  console.error('[AppHub]', shown, source || '');
  if (errorCount < 3) {
    toast(`Ошибка: ${shown}`, 'error');
    errorCount++;
  }
}

window.onerror = function (message, source, lineno) {
  reportError(message, lineno != null ? `${source}:${lineno}` : source);
  return false;
};

window.addEventListener('unhandledrejection', (e) => {
  e.preventDefault();
  const reason = e.reason;
  const msg = reason instanceof Error ? reason.message : String(reason);
  reportError(msg);
});

// ===== Регистрация приложений =====

registry.add({
  id: 'calculator',
  title: 'Калькулятор',
  description: 'Быстрые вычисления с поддержкой основных операций',
  icon: 'calculator',
  category: 'tools',
  load: () => import('../apps/calculator.js')
});

registry.add({
  id: 'todo',
  title: 'Задачи',
  description: 'Список дел с автоматическим сохранением',
  icon: 'todo',
  category: 'productivity',
  load: () => import('../apps/todo.js')
});

registry.add({
  id: 'timer',
  title: 'Pomodoro',
  description: 'Таймер для продуктивной работы интервалами',
  icon: 'timer',
  category: 'productivity',
  load: () => import('../apps/timer.js')
});

registry.add({
  id: 'notes',
  title: 'Заметки',
  description: 'Текстовый редактор с автосохранением',
  icon: 'notes',
  category: 'productivity',
  load: () => import('../apps/notes.js')
});

registry.add({
  id: 'converter',
  title: 'Конвертер',
  description: 'Перевод единиц измерения длины, веса, температуры',
  icon: 'converter',
  category: 'tools',
  load: () => import('../apps/converter.js')
});

registry.add({
  id: 'draw',
  title: 'Рисование',
  description: 'Холст для творчества с экспортом в PNG',
  icon: 'draw',
  category: 'creative',
  load: () => import('../apps/draw.js')
});

registry.add({
  id: 'snake',
  title: 'Змейка',
  description: 'Классическая аркадная игра',
  icon: 'snake',
  category: 'games',
  load: () => import('../apps/snake.js')
});

registry.add({
  id: 'password',
  title: 'Пароли',
  description: 'Генератор надёжных случайных паролей',
  icon: 'password',
  category: 'tools',
  load: () => import('../apps/password.js')
});

// === НОВЫЕ ПРИЛОЖЕНИЯ ===

registry.add({
  id: 'colorpicker',
  title: 'Палитра цветов',
  description: 'Подбор цветов, генерация палитр, конвертация форматов',
  icon: 'palette',
  category: 'creative',
  load: () => import('../apps/colorpicker.js')
});

registry.add({
  id: 'json',
  title: 'JSON-форматтер',
  description: 'Форматирование, валидация и минификация JSON',
  icon: 'code',
  category: 'dev',
  load: () => import('../apps/json.js')
});

registry.add({
  id: 'base64',
  title: 'Base64',
  description: 'Кодирование и декодирование текста в Base64',
  icon: 'binary',
  category: 'dev',
  load: () => import('../apps/base64.js')
});

registry.add({
  id: 'lorem',
  title: 'Lorem Ipsum',
  description: 'Генератор текста-заполнителя для макетов',
  icon: 'text',
  category: 'tools',
  load: () => import('../apps/lorem.js')
});

registry.add({
  id: 'regex',
  title: 'Regex-тестер',
  description: 'Проверка регулярных выражений в реальном времени',
  icon: 'regex',
  category: 'dev',
  load: () => import('../apps/regex.js')
});

registry.add({
  id: 'kanban',
  title: 'Канбан-доска',
  description: 'Управление задачами с перетаскиванием между колонками',
  icon: 'kanban',
  category: 'productivity',
  load: () => import('../apps/kanban.js')
});

registry.add({
  id: 'qr',
  title: 'QR-генератор',
  description: 'Генерация QR-кода из текста или ссылки, экспорт в PNG',
  icon: 'qr',
  category: 'tools',
  load: () => import('../apps/qr.js')
});

registry.add({
  id: 'markdown',
  title: 'Markdown-превью',
  description: 'Живой рендер Markdown разметки в двух панелях',
  icon: 'markdown',
  category: 'text',
  load: () => import('../apps/markdown.js')
});

registry.add({
  id: 'countdown',
  title: 'Countdown',
  description: 'Обратный отсчёт с кольцом прогресса и звуковым сигналом',
  icon: 'countdown',
  category: 'productivity',
  load: () => import('../apps/countdown.js')
});

registry.add({
  id: 'screenshot',
  title: 'Скриншот-таймер',
  description: 'Отсчёт 3-2-1 на весь экран перед записью экрана',
  icon: 'screenshot',
  category: 'tools',
  load: () => import('../apps/screenshot.js')
});

registry.add({
  id: 'colors',
  title: 'Цвета CSS',
  description: 'Именованные цвета CSS, клик копирует HEX-код',
  icon: 'swatch',
  category: 'creative',
  load: () => import('../apps/colors.js')
});

registry.add({
  id: 'diff',
  title: 'Diff-сравнение',
  description: 'Построчное сравнение двух текстов с подсветкой различий',
  icon: 'diff',
  category: 'text',
  load: () => import('../apps/diff.js')
});

registry.add({
  id: 'uuid',
  title: 'UUID-генератор',
  description: 'Генерация v4, пакетная генерация до 100 штук',
  icon: 'uuid',
  category: 'dev',
  load: () => import('../apps/uuid.js')
});

registry.add({
  id: 'hash',
  title: 'Хэш-генератор',
  description: 'SHA-1, SHA-256, SHA-384, SHA-512 через Web Crypto',
  icon: 'hash',
  category: 'security',
  load: () => import('../apps/hash.js')
});

registry.add({
  id: 'symbols',
  title: 'Таблица символов',
  description: 'Unicode-символы по блокам с поиском и копированием',
  icon: 'symbols',
  category: 'tools',
  load: () => import('../apps/symbols.js')
});

// === ПРИЛОЖЕНИЯ БЛОКА B ===

registry.add({
  id: 'planner',
  title: 'Календарь',
  description: 'Планируйте события по датам с локальным хранением',
  icon: 'calendar',
  category: 'productivity',
  load: () => import('../apps/planner.js')
});

registry.add({
  id: 'metronome',
  title: 'Метроном',
  description: 'Точный ритм через Web Audio API с tap-tempo',
  icon: 'metronome',
  category: 'tools',
  load: () => import('../apps/metronome.js')
});

registry.add({
  id: 'worldclock',
  title: 'Мировое время',
  description: 'Часы в разных часовых поясах с обновлением в реальном времени',
  icon: 'clock',
  category: 'tools',
  load: () => import('../apps/worldclock.js')
});

registry.add({
  id: 'numberbase',
  title: 'Числа',
  description: 'Системы счисления: DEC, HEX, BIN, OCT, римские числа',
  icon: 'binary',
  category: 'text',
  load: () => import('../apps/numberbase.js')
});

registry.add({
  id: 'datediff',
  title: 'Разница дат',
  description: 'Сколько дней между датами и калькулятор дат',
  icon: 'calendar',
  category: 'productivity',
  load: () => import('../apps/datediff.js')
});

registry.add({
  id: 'typograph',
  title: 'Типограф',
  description: 'Конвертер px, rem, em, pt и живой предпросмотр',
  icon: 'text',
  category: 'text',
  load: () => import('../apps/typograph.js')
});

registry.add({
  id: 'pixelart',
  title: 'Пиксель-арт',
  description: 'Сетка для пиксель-арта с экспортом в PNG',
  icon: 'draw',
  category: 'creative',
  load: () => import('../apps/pixelart.js')
});

registry.add({
  id: 'guess',
  title: 'Угадай число',
  description: 'Отгадайте число от 1 до 100 за минимальное число попыток',
  icon: 'gamepad',
  category: 'games',
  load: () => import('../apps/guess.js')
});


// ===== Избранное =====

const favorites = {
  get() { return storage.get('favorites', []); },
  toggle(id) {
    let list = this.get();
    if (list.includes(id)) {
      list = list.filter(f => f !== id);
    } else {
      list.unshift(id);
    }
    storage.set('favorites', list);
    return list.includes(id);
  },
  has(id) { return this.get().includes(id); }
};

// ===== Категории =====

const CATEGORIES = {
  productivity: 'Продуктивность',
  tools: 'Инструменты',
  dev: 'Разработка',
  creative: 'Творчество',
  text: 'Текст',
  security: 'Безопасность',
  games: 'Игры'
};

const CAT_ICONS = {
  productivity: 'todo',
  tools: 'converter',
  dev: 'code',
  creative: 'palette',
  text: 'markdown',
  security: 'password',
  games: 'snake'
};

function catLabel(cat) {
  const names = storage.get('categoryNames', {});
  return names[cat] || CATEGORIES[cat] || cat;
}

function renameCategory(cat) {
  const inputId = 'renameCatInput';
  modal({
    title: 'Переименовать категорию',
    body: `
      <label for="${inputId}" style="display:block;margin-bottom:8px;color:var(--muted);font-size:13px">Название категории «${CATEGORIES[cat] || cat}»</label>
      <input type="text" id="${inputId}" value="${catLabel(cat).replace(/"/g, '&quot;')}" maxlength="40" style="width:100%">
    `,
    actions: [
      { label: 'Сохранить', class: 'btn', onClick: () => {
        const input = document.getElementById(inputId);
        const name = input ? input.value.trim() : '';
        if (!name) return;
        const names = storage.get('categoryNames', {});
        if (name === CATEGORIES[cat]) {
          delete names[cat];
        } else {
          names[cat] = name;
        }
        storage.set('categoryNames', names);
        applyCategoryLabels();
        toast('Категория переименована', 'success');
      }},
      { label: 'Сбросить', class: 'btn-ghost', onClick: () => {
        const names = storage.get('categoryNames', {});
        if (names[cat] === undefined) return;
        delete names[cat];
        storage.set('categoryNames', names);
        applyCategoryLabels();
        toast('Название сброшено', 'info');
      }},
      { label: 'Отмена', class: 'btn-ghost' }
    ]
  });
  setTimeout(() => {
    const input = document.getElementById(inputId);
    if (input) { input.focus(); input.select(); }
  }, 100);
}

function applyCategoryLabels() {
  router.categoryLabels = new Proxy(CATEGORIES, {
    get: (_t, key) => catLabel(key)
  });
  document.querySelectorAll('.nav-group-header[data-cat-key]').forEach(el => {
    const label = el.querySelector('.nav-group-label');
    if (label) label.textContent = catLabel(el.dataset.catKey);
  });
  document.querySelectorAll('.app-section[data-category]').forEach(sec => {
    const title = sec.querySelector('.section-title .cat-name');
    if (title) title.textContent = catLabel(sec.dataset.category);
  });
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    if (chip.dataset.filter !== 'all') chip.textContent = catLabel(chip.dataset.filter);
  });
}

// ===== Построение UI =====

function getGroups() {
  const groups = {};
  const usage = storage.get('usage', {});
  registry.getAll().forEach((app, idx) => {
    if (!groups[app.category]) groups[app.category] = [];
    groups[app.category].push({ ...app, hotkey: idx + 1, uses: usage[app.id] || 0 });
  });
  // Сортировка: частые → алфавит
  for (const list of Object.values(groups)) {
    list.sort((a, b) => (b.uses - a.uses) || a.title.localeCompare(b.title, 'ru'));
  }
  return groups;
}

function buildUI() {
  const navList = document.getElementById('navList');
  const appSections = document.getElementById('appSections');

  // Главная в навигации
  const homeNav = document.createElement('div');
  homeNav.className = 'nav-item active';
  homeNav.dataset.page = 'home';
  homeNav.title = 'Главная';
  homeNav.innerHTML = `${icons.home}<span>Главная</span><span class="nav-hint">Alt+0</span>`;
  navList.appendChild(homeNav);

  const groups = getGroups();
  const cats = Object.keys(groups);
  router.categories = cats;
  applyCategoryLabels();

  // Навигация: сворачиваемые категории
  Object.entries(groups).forEach(([cat, list]) => {
    const group = document.createElement('div');
    group.className = 'nav-group';
    group.dataset.category = cat;

    const header = document.createElement('div');
    header.className = 'nav-group-header';
    header.dataset.page = 'cat-' + cat;
    header.dataset.catKey = cat;
    header.title = catLabel(cat);
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.innerHTML = `
      <span class="nav-cat-icon">${icons[CAT_ICONS[cat]] || ''}</span>
      <span class="nav-group-label">${catLabel(cat)}</span>
      <span class="nav-count">${list.length}</span>
      <button class="nav-caret cat-rename" title="Переименовать категорию" aria-label="Переименовать категорию">
        <svg viewBox="0 0 24 24" width="12" height="12"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
      </button>
      <button class="nav-caret" title="Развернуть" aria-label="Развернуть категорию">
        <svg viewBox="0 0 24 24" width="14" height="14"><polyline points="9 6 15 12 9 18"/></svg>
      </button>
    `;

    const collapse = document.createElement('div');
    collapse.className = 'nav-group-body';

    list.forEach(app => {
      const navItem = document.createElement('div');
      navItem.className = 'nav-item';
      navItem.dataset.page = app.id;
      navItem.title = app.title;
      navItem.setAttribute('role', 'button');
      navItem.setAttribute('tabindex', '0');
      navItem.innerHTML = `${icons[app.icon] || ''}<span>${app.title}</span>`;
      collapse.appendChild(navItem);
    });

    header.querySelector('.nav-caret:not(.cat-rename)').addEventListener('click', (e) => {
      e.stopPropagation();
      group.classList.toggle('open');
    });

    header.querySelector('.cat-rename').addEventListener('click', (e) => {
      e.stopPropagation();
      renameCategory(cat);
    });

    group.appendChild(header);
    group.appendChild(collapse);
    navList.appendChild(group);
  });

  // Секции приложений на главной
  for (const [cat, list] of Object.entries(groups)) {
    const section = document.createElement('div');
    section.className = 'app-section';
    section.dataset.category = cat;
    section.innerHTML = `
      <h2 class="section-title"><span class="cat-name">${catLabel(cat)}</span>
        <span class="section-count">${list.length}</span>
        <button class="cat-rename-sec" title="Переименовать категорию" aria-label="Переименовать категорию">
          <svg viewBox="0 0 24 24" width="13" height="13"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
      </h2>
    `;
    section.querySelector('.cat-rename-sec').addEventListener('click', (e) => {
      e.stopPropagation();
      renameCategory(cat);
    });
    const grid = document.createElement('div');
    grid.className = 'grid';
    list.forEach(app => grid.appendChild(createCard(app)));
    section.appendChild(grid);
    appSections.appendChild(section);
  }

  buildChips(Object.keys(groups));
  renderFavorites();
  renderRecent();
}

// ===== Страница категории =====

function renderCategoryPage(pageEl, cat) {
  const label = catLabel(cat);
  pageEl.innerHTML = `
    <h1>${label}</h1>
    <p class="subtitle">Сначала часто используемые, затем по алфавиту</p>
    <div class="grid" id="catGrid"></div>
  `;
  const grid = pageEl.querySelector('#catGrid');
  const list = (getGroups()[cat] || []);
  list.forEach(app => grid.appendChild(createCard(app)));
}

// ===== Фильтр по категориям =====

let activeFilter = 'all';
const hideTimers = new WeakMap();

function showCard(card) {
  clearTimeout(hideTimers.get(card));
  if (!card.classList.contains('hidden-by-search')) {
    card.classList.remove('card-hiding');
    return;
  }
  card.classList.remove('hidden-by-search');
  card.classList.add('card-hiding');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => card.classList.remove('card-hiding'));
  });
}

function hideCard(card) {
  if (card.classList.contains('hidden-by-search')) return;
  card.style.display = '';
  card.classList.add('card-hiding');
  clearTimeout(hideTimers.get(card));
  hideTimers.set(card, setTimeout(() => {
    card.classList.add('hidden-by-search');
    card.classList.remove('card-hiding');
  }, 180));
}

function buildChips(categories) {
  const row = document.getElementById('categoryChips');
  const all = ['all', ...categories];

  all.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === 'all' ? ' active' : '');
    chip.dataset.filter = cat;
    chip.textContent = cat === 'all' ? `Все (${registry.getAll().length})` : catLabel(cat);
    chip.addEventListener('click', () => {
      activeFilter = cat;
      row.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.filter === cat));
      refreshCards();
    });
    row.appendChild(chip);
  });
}

function refreshCards() {
  const input = document.getElementById('searchInput');
  const query = input.value.toLowerCase().trim();
  const sectionsWrap = document.getElementById('appSections');
  const empty = document.getElementById('emptyState');
  const allTitle = document.getElementById('allAppsTitle');

  const cards = sectionsWrap.querySelectorAll('.card');
  let visible = 0;

  cards.forEach(card => {
    const matchQuery = !query || card.dataset.searchText.includes(query);
    if (matchQuery) showCard(card); else hideCard(card);
    if (matchQuery) visible++;
  });

  sectionsWrap.querySelectorAll('.app-section').forEach(sec => {
    const catMatch = activeFilter === 'all' || sec.dataset.category === activeFilter;
    const hasVisible = Array.from(sec.querySelectorAll('.card')).some(c => !query || c.dataset.searchText.includes(query));
    sec.hidden = !catMatch || (query && !hasVisible);
  });

  empty.hidden = visible > 0;
  allTitle.textContent = query ? `Результаты (${visible})` : 'Все приложения';
}

// ===== Поиск =====

function initSearch() {
  const input = document.getElementById('searchInput');
  input.addEventListener('input', debounce(refreshCards, 200));
}

// ===== Карточка =====

// Ленивые иконки: вставляем SVG только при появлении карточки в зоне видимости
const iconObserver = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const wrap = entry.target.querySelector('.icon-wrap[data-icon-name]');
      if (wrap && !wrap.innerHTML) {
        wrap.innerHTML = icons[wrap.dataset.iconName] || '';
      }
      iconObserver.unobserve(entry.target);
    });
  }, { rootMargin: '150px' })
  : null;

function createCard(app) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.page = app.id;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', app.title);
  card.dataset.searchText = `${app.title} ${app.description} ${app.category}`.toLowerCase();

  const isFav = favorites.has(app.id);
  const iconHtml = iconObserver ? '' : (icons[app.icon] || '');

  card.innerHTML = `
    <div class="card-header">
      <div class="icon-wrap" data-icon-name="${app.icon}">${iconHtml}</div>
      <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${app.id}" title="Избранное" aria-label="Добавить в избранное">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
    </div>
    <h3>${app.title}</h3>
    <p>${app.description}</p>
    <span class="card-category">${catLabel(app.category)}</span>
  `;

  if (iconObserver) iconObserver.observe(card);

  // Клик по звёздочке
  card.querySelector('.fav-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const added = favorites.toggle(app.id);
    e.currentTarget.classList.toggle('active', added);
    renderFavorites();
  });

  return card;
}

function renderFavorites() {
  const favIds = favorites.get();
  const favSection = document.getElementById('favoritesSection');
  const favGrid = document.getElementById('favGrid');

  if (favIds.length === 0) {
    favSection.hidden = true;
    return;
  }

  favSection.hidden = false;
  favGrid.innerHTML = '';

  favIds.forEach(id => {
    const app = registry.getById(id);
    if (app) {
      const card = createCard(app);
      favGrid.appendChild(card);
    }
  });
}

// ===== Недавно открытые =====

function renderRecent() {
  const recentIds = storage.get('recent', []);
  const recentSection = document.getElementById('recentSection');
  const recentGrid = document.getElementById('recentGrid');

  if (recentIds.length === 0) {
    recentSection.hidden = true;
    return;
  }

  recentSection.hidden = false;
  recentGrid.innerHTML = '';

  recentIds.forEach(id => {
    const app = registry.getById(id);
    if (app) {
      const card = createCard(app);
      recentGrid.appendChild(card);
    }
  });
}

// ===== Данные: экспорт / импорт / сброс =====

function initDataActions() {
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const resetBtn = document.getElementById('resetBtn');
  const importFile = document.getElementById('importFile');

  exportBtn.addEventListener('click', () => {
    const json = storage.exportAll();
    if (json === '{}') { toast('Нет данных для экспорта', 'warning'); return; }
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.download = `apphub-backup-${date}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    toast('Файл с данными скачан', 'success');
  });

  importBtn.addEventListener('click', () => importFile.click());

  importFile.addEventListener('change', () => {
    const file = importFile.files[0];
    importFile.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast('Файл слишком большой (макс. 10 МБ)', 'error'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const json = reader.result;
      modal({
        title: 'Импортировать данные?',
        body: '<p>Текущие данные будут <b>заменены</b> содержимым файла. Продолжить?</p>',
        actions: [
          { label: 'Импортировать', class: 'btn', onClick: () => {
            if (storage.importAll(json)) {
              toast('Данные импортированы. Перезагрузка...', 'success');
              setTimeout(() => location.reload(), 800);
            } else {
              toast('Файл не соответствует формату AppHub', 'error');
            }
          }},
          { label: 'Отмена', class: 'btn-ghost' }
        ]
      });
    };
    reader.onerror = () => toast('Не удалось прочитать файл', 'error');
    reader.readAsText(file);
  });

  resetBtn.addEventListener('click', () => {
    modal({
      title: 'Сбросить все данные?',
      body: '<p>Будут удалены все данные приложений: задачи, заметки, доска, избранное, настройки. <b>Действие необратимо.</b></p><p>Совет: сначала сделайте экспорт.</p>',
      actions: [
        { label: 'Сбросить всё', class: 'btn', onClick: () => {
          storage.clearAll();
          toast('Данные удалены', 'success');
          setTimeout(() => location.reload(), 800);
        }},
        { label: 'Отмена', class: 'btn-ghost' }
      ]
    });
  });
}

// ===== Сворачивание сайдбара =====

function initSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('sidebarToggle');
  const searchBox = document.querySelector('.search-box');
  const searchInput = document.getElementById('searchInput');
  if (!sidebar || !btn) return;

  let popup = null;
  let floating = false;

  function ensurePopup() {
    if (popup) return popup;
    popup = document.createElement('div');
    popup.className = 'search-popup';
    popup.hidden = true;
    const icon = searchBox && searchBox.querySelector('svg');
    if (icon) popup.appendChild(icon.cloneNode(true));
    document.body.appendChild(popup);
    return popup;
  }

  function openSearchPopup() {
    if (floating || !searchBox || !searchInput) return;
    const rect = searchBox.getBoundingClientRect();
    const p = ensurePopup();
    p.appendChild(searchInput);
    p.hidden = false;
    p.style.top = rect.top + 'px';
    p.style.left = rect.right + 8 + 'px';
    floating = true;
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeSearchPopup() {
    if (!floating || !searchBox || !searchInput) return;
    searchBox.appendChild(searchInput);
    if (popup) popup.hidden = true;
    floating = false;
  }

  function apply(collapsed) {
    sidebar.classList.toggle('collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    const label = collapsed ? 'Развернуть панель' : 'Свернуть панель';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    if (!collapsed) closeSearchPopup();
  }

  apply(storage.get('sidebarCollapsed', false));

  btn.addEventListener('click', () => {
    const next = !sidebar.classList.contains('collapsed');
    storage.set('sidebarCollapsed', next);
    apply(next);
  });

  // Свёрнутый поиск: лупа открывает/закрывает всплывающее окно справа
  if (searchBox && searchInput) {
    searchBox.addEventListener('click', () => {
      if (!sidebar.classList.contains('collapsed')) return;
      floating ? closeSearchPopup() : openSearchPopup();
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && floating) {
        e.preventDefault();
        closeSearchPopup();
      }
    });
    document.addEventListener('pointerdown', (e) => {
      if (!floating) return;
      if (searchBox.contains(e.target)) return;
      if (popup && popup.contains(e.target)) return;
      closeSearchPopup();
    });
    window.addEventListener('resize', closeSearchPopup);
  }
}

// ===== Инициализация =====

palette.init(() => [
  { id: 'toggle-theme', title: 'Переключить тему (светлая/тёмная)', icon: 'swatch', run: () => theme.toggle() },
  { id: 'color-theme', title: 'Выбрать цвет темы', icon: 'palette', run: () => theme.openPicker() },
  { id: 'export', title: 'Экспорт данных', icon: 'binary', run: () => document.getElementById('exportBtn').click() },
  { id: 'help', title: 'Подсказки и горячие клавиши', icon: 'text', run: () => help.show() }
]);

initSidebarCollapse();
buildUI();
initSearch();
initDataActions();
initHoverPreview();
help.init('helpBtn');
help.showOnce();
router.onCategoryRender = renderCategoryPage;
router.init(registry);
theme.init();
cloud.init('cloudBtn');

document.getElementById('clearRecentBtn').addEventListener('click', () => {
  storage.remove('recent');
  renderRecent();
  toast('История очищена', 'success');
});

document.addEventListener('router:navigate', () => {
  renderRecent();
});
