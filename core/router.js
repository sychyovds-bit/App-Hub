export const router = {
  current: 'home',

  init(registry) {
    this.registry = registry;

    // Делегирование кликов по навигации и карточкам
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-page]');
      if (target) {
        e.preventDefault();
        this.navigate(target.dataset.page);
      }
    });

    // Горячие клавиши Alt+1..9
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const apps = this.registry.getAll();
        const idx = parseInt(e.key) - 1;
        if (apps[idx]) this.navigate(apps[idx].id);
      }
      if (e.altKey && e.key === '0') {
        e.preventDefault();
        this.navigate('home');
      }
    });
  },

  async navigate(pageId) {
    if (this.current === pageId) return;

    // Скрыть текущую
    const currentEl = document.getElementById('page-' + this.current);
    if (currentEl) currentEl.classList.remove('active');

    // Обновить навигацию
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (navItem) navItem.classList.add('active');

    if (pageId === 'home') {
      document.getElementById('page-home').classList.add('active');
      this.current = 'home';
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

    // Загрузить и инициализировать приложение
    const module = await this.registry.loadApp(pageId);
    if (module && module.init) {
      pageEl.innerHTML = '';
      module.init(pageEl);
    }
  }
};
