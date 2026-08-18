import { registry } from './registry.js';
import { router } from './router.js';
import { theme } from './theme.js';
import { storage } from './storage.js';
import { icons } from './icons.js';

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


// ===== Избранное =====

const favorites = {
  get() { return storage.get('favorites', []); },
  toggle(id) {
    let list = this.get();
    if (list.includes(id)) {
      list = list.filter(f => f !== id);
    } else {
      list.push(id);
    }
    storage.set('favorites', list);
    return list.includes(id);
  },
  has(id) { return this.get().includes(id); }
};

// ===== Построение UI =====

function buildUI() {
  const navList = document.getElementById('navList');
  const appGrid = document.getElementById('appGrid');

  // Главная в навигации
  const homeNav = document.createElement('div');
  homeNav.className = 'nav-item active';
  homeNav.dataset.page = 'home';
  homeNav.innerHTML = `${icons.home}<span>Главная</span>`;
  navList.appendChild(homeNav);

  const apps = registry.getAll();

  apps.forEach(app => {
    // Навигация
    const navItem = document.createElement('div');
    navItem.className = 'nav-item';
    navItem.dataset.page = app.id;
    navItem.innerHTML = `${icons[app.icon] || ''}<span>${app.title}</span>`;
    navList.appendChild(navItem);

    // Карточка
    const card = createCard(app);
    appGrid.appendChild(card);
  });

  renderFavorites();
}

function createCard(app) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.page = app.id;
  card.dataset.searchText = `${app.title} ${app.description} ${app.category}`.toLowerCase();

  const isFav = favorites.has(app.id);

  card.innerHTML = `
    <div class="card-header">
      <div class="icon-wrap">${icons[app.icon] || ''}</div>
      <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${app.id}" title="Избранное">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
    </div>
    <h3>${app.title}</h3>
    <p>${app.description}</p>
    <span class="card-category">${app.category}</span>
  `;

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

// ===== Поиск =====

function initSearch() {
  const input = document.getElementById('searchInput');
  const grid = document.getElementById('appGrid');
  const empty = document.getElementById('emptyState');
  const allTitle = document.getElementById('allAppsTitle');

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    const cards = grid.querySelectorAll('.card');
    let visible = 0;

    cards.forEach(card => {
      const match = !query || card.dataset.searchText.includes(query);
      card.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    empty.hidden = visible > 0;
    allTitle.textContent = query ? `Результаты (${visible})` : 'Все приложения';
  });
}

// ===== Инициализация =====

buildUI();
initSearch();
router.init(registry);
theme.init();
