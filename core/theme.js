import { storage } from './storage.js';

export const theme = {
  current: 'light',

  init() {
    this.current = storage.get('theme', 'light');
    this.apply();

    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggle();
    });
  },

  toggle() {
    this.current = this.current === 'light' ? 'dark' : 'light';
    storage.set('theme', this.current);
    this.apply();
  },

  apply() {
    document.body.classList.toggle('dark', this.current === 'dark');
  }
};
