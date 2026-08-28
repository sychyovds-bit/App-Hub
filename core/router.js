import { storage } from './storage.js';

export const router = {
  current: 'home',
  history: [],
  forwardStack: [],

  back() {
    if (!this.history.length) return;
    this.forwardStack.push(this.current);
    const target = this.history.pop();
    this.navigate(target, true);
  },

  forward() {
    if (!this.forwardStack.length) return;
    const target = this.forwardStack.pop();
    this.history.push(this.current);
    this.navigate(target, true);
  },

  init(registry) {
    this.registry = registry;
    this.initSwipe();

    // Делегирование кликов по навигации и карточкам
    document.addEventListener('click', (e) => {
      if (e.target.closest('.back-btn')) {
        e.preventDefault();
        this.back();
        return;
      }
      const target = e.target.closest('[data-page]');
      if (target && !e.target.closest('.nav-caret')) {
        e.preventDefault();
        this.navigate(target.dataset.page);
      }
    });

    // Клавиатурная активация карточек и пунктов меню
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = e.target.closest('[data-page][role="button"]');
      if (target && !e.target.closest('.nav-caret')) {
        e.preventDefault();
        this.navigate(target.dataset.page);
      }
    });

    // Горячие клавиши Alt+1..9 — переключение по категориям
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const cats = this.categories || [];
        const idx = parseInt(e.key) - 1;
        if (cats[idx]) this.navigate('cat-' + cats[idx]);
      }
      if (e.altKey && e.key === '0') {
        e.preventDefault();
        this.navigate('home');
      }
    });
  },

  async navigate(pageId, isBack = false) {
    if (this.current === pageId) return;

    if (!isBack) {
      this.history.push(this.current);
      if (this.history.length > 50) this.history.shift();
      this.forwardStack = [];
    }

    // Скрыть текущую
    if (this.current) {
      document.dispatchEvent(new CustomEvent('router:leave', { detail: { page: this.current } }));
    }
    const currentEl = document.getElementById('page-' + this.current);
    if (currentEl) currentEl.classList.remove('active');

    // Обновить навигацию
    document.querySelectorAll('.nav-item, .nav-group-header').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`#navList [data-page="${pageId}"]`);
    if (navItem) navItem.classList.add('active');

    if (pageId === 'home') {
      document.getElementById('page-home').classList.add('active');
      this.current = 'home';
      document.dispatchEvent(new CustomEvent('router:navigate', { detail: { page: 'home' } }));
      return;
    }

    // Страница категории
    if (pageId.startsWith('cat-')) {
      const cat = pageId.slice(4);
      let pageEl = document.getElementById('page-' + pageId);
      if (!pageEl) {
        pageEl = document.createElement('div');
        pageEl.className = 'page';
        pageEl.id = 'page-' + pageId;
        document.getElementById('main').appendChild(pageEl);
      }
      pageEl.classList.add('active');
      this.current = pageId;
      if (this.onCategoryRender) {
        pageEl.innerHTML = '';
        this.onCategoryRender(pageEl, cat);
        pageEl.prepend(this.createCategoryBreadcrumb(cat));
      }
      return;
    }

    const app = this.registry.getById(pageId);
    if (!app) return;

    // Показать или создать страницу
    let pageEl = document.getElementById('page-' + pageId);
    if (!pageEl) {
      pageEl = document.createElement('div');
      pageEl.className = 'page';
      pageEl.id = 'page-' + pageId;
      document.getElementById('main').appendChild(pageEl);
    }

    pageEl.classList.add('active');
    this.current = pageId;

    // Записать в недавно открытые и счётчик использования
    this.recordRecent(pageId);
    this.recordUsage(pageId);

    // Скелетон, пока модуль ещё не загружен
    if (!app.loaded) {
      this.showSkeleton(pageEl);
    }

    // Загрузить и инициализировать приложение
    const module = await this.registry.loadApp(pageId);
    if (module && module.init) {
      pageEl.innerHTML = '';
      module.init(pageEl);
      this.renderBreadcrumb(pageEl, app);
    }
  },

  navigateCategory(cat) {
    this.navigate('cat-' + cat);
  },

  recordRecent(id) {
    let recent = storage.get('recent', []);
    recent = recent.filter(r => r !== id);
    recent.unshift(id);
    recent = recent.slice(0, 4);
    storage.set('recent', recent);
  },

  recordUsage(id) {
    const usage = storage.get('usage', {});
    usage[id] = (usage[id] || 0) + 1;
    storage.set('usage', usage);
  },

  showSkeleton(pageEl) {
    pageEl.innerHTML = `
      <div class="skeleton-wrap" aria-hidden="true">
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
      </div>
    `;
  },

  renderBreadcrumb(pageEl, app) {
    const catLabel = (this.categoryLabels && this.categoryLabels[app.category]) || app.category;
    const bc = document.createElement('nav');
    bc.className = 'breadcrumb';
    bc.setAttribute('aria-label', 'Навигация');
    bc.innerHTML = `
      <a href="#" class="back-btn" title="Назад" aria-label="Назад">
        <svg viewBox="0 0 24 24" width="15" height="15"><polyline points="15 18 9 12 15 6"/></svg>
      </a>
      <a href="#" data-page="home" class="breadcrumb-link">AppHub</a>
      <span class="breadcrumb-sep">/</span>
      <a href="#" data-page="cat-${app.category}" class="breadcrumb-link">${catLabel}</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">${app.title}</span>
    `;
    pageEl.prepend(bc);
  },

  createCategoryBreadcrumb(cat) {
    const label = (this.categoryLabels && this.categoryLabels[cat]) || cat;
    const bc = document.createElement('nav');
    bc.className = 'breadcrumb';
    bc.setAttribute('aria-label', 'Навигация');
    bc.innerHTML = `
      <a href="#" class="back-btn" title="Назад" aria-label="Назад">
        <svg viewBox="0 0 24 24" width="15" height="15"><polyline points="15 18 9 12 15 6"/></svg>
      </a>
      <a href="#" data-page="home" class="breadcrumb-link">AppHub</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">${label}</span>
    `;
    return bc;
  },

  initSwipe() {
    const main = document.getElementById('main');
    if (!main) return;
    let sx = 0, sy = 0, tracking = false, fromEdge = false;

    main.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      fromEdge = t.clientX <= 40;
      tracking = true;
    }, { passive: true });

    main.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dy) >= 60) return;
      if (dx > 70 && fromEdge) this.back();
      else if (dx < -70) this.forward();
    }, { passive: true });
  }
};
