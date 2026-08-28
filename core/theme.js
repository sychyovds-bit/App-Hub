import { storage } from './storage.js';
import { toast } from './toast.js';

const COLORS = [
  { id: 'violet', label: 'Фиолетовая', color: '#7c6cf0' },
  { id: 'blue', label: 'Синяя', color: '#2563eb' },
  { id: 'green', label: 'Зелёная', color: '#047857' },
  { id: 'rose', label: 'Розовая', color: '#be123c' }
];

export const theme = {
  current: 'light',
  color: 'violet',

  init() {
    this.current = storage.get('theme', 'light');
    this.color = storage.get('colorTheme', 'violet');
    if (!COLORS.some(c => c.id === this.color)) this.color = 'violet';
    this.apply();

    const toggle = document.getElementById('themeToggle');
    if (toggle) toggle.addEventListener('click', () => this.toggle());

    const pickerBtn = document.getElementById('themePicker');
    if (pickerBtn) {
      this.updatePickerDot();
      pickerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePicker();
      });
      document.addEventListener('click', (e) => {
        const menu = document.getElementById('themePickerMenu');
        if (menu && !menu.hidden && !menu.contains(e.target)) this.closePicker();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closePicker();
      });
    }
  },

  toggle() {
    this.current = this.current === 'light' ? 'dark' : 'light';
    storage.set('theme', this.current);
    this.apply();
  },

  setColor(name) {
    if (!COLORS.some(c => c.id === name)) return;
    this.color = name;
    storage.set('colorTheme', name);
    this.apply();
    this.updatePickerDot();
  },

  getColors() {
    return COLORS.map(c => ({ ...c, active: c.id === this.color }));
  },

  apply() {
    document.body.classList.add('theme-switching');
    document.body.classList.toggle('dark', this.current === 'dark');
    if (this.color === 'violet') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', this.color);
    }
    setTimeout(() => document.body.classList.remove('theme-switching'), 350);
  },

  updatePickerDot() {
    const btn = document.getElementById('themePicker');
    if (!btn) return;
    const cur = COLORS.find(c => c.id === this.color) || COLORS[0];
    btn.style.setProperty('--swatch', cur.color);
  },

  ensurePickerMenu() {
    let menu = document.getElementById('themePickerMenu');
    if (menu) return menu;
    menu = document.createElement('div');
    menu.id = 'themePickerMenu';
    menu.className = 'theme-picker-menu';
    menu.hidden = true;
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Цвет темы');
    COLORS.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'theme-swatch';
      btn.dataset.color = c.id;
      btn.setAttribute('role', 'menuitemradio');
      btn.style.setProperty('--swatch', c.color);
      btn.innerHTML = `<span class="swatch-dot"></span>${c.label}`;
      btn.addEventListener('click', () => {
        this.setColor(c.id);
        this.closePicker();
        toast(`Тема: ${c.label}`, 'success', 2000);
      });
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    return menu;
  },

  openPicker() {
    const btn = document.getElementById('themePicker');
    const menu = this.ensurePickerMenu();
    menu.querySelectorAll('.theme-swatch').forEach(s => {
      const active = s.dataset.color === this.color;
      s.classList.toggle('active', active);
      s.setAttribute('aria-checked', String(active));
    });
    if (btn) {
      const rect = btn.getBoundingClientRect();
      menu.style.left = Math.max(12, rect.left) + 'px';
      menu.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    } else {
      menu.style.left = '12px';
      menu.style.bottom = '12px';
    }
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('visible'));
  },

  closePicker() {
    const menu = document.getElementById('themePickerMenu');
    if (!menu || menu.hidden) return;
    menu.classList.remove('visible');
    setTimeout(() => { menu.hidden = true; }, 160);
  },

  togglePicker() {
    const menu = document.getElementById('themePickerMenu');
    if (menu && !menu.hidden) this.closePicker();
    else this.openPicker();
  }
};
