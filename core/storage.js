import { toast } from './toast.js';

const PREFIX = 'apphub_';
const VERSION = 1;

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      if (parsed._v !== VERSION) return fallback;
      return parsed.data;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ _v: VERSION, data: value }));
      document.dispatchEvent(new CustomEvent('storage:set', { detail: { key } }));
      return true;
    } catch (e) {
      const quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
      toast(quota ? 'Хранилище переполнено — данные не сохранены' : 'Не удалось сохранить данные', 'error');
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key);
    document.dispatchEvent(new CustomEvent('storage:remove', { detail: { key } }));
  },

  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },

  exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) {
        try {
          data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k));
        } catch {}
      }
    }
    return JSON.stringify(data, null, 2);
  },

  importAll(json) {
    try {
      const data = JSON.parse(json);
      if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;

      for (const [key, val] of Object.entries(data)) {
        if (typeof key !== 'string' || !key) return false;
        if (typeof val !== 'object' || val === null || !('_v' in val) || !('data' in val)) return false;
      }

      this.clearAll();

      for (const [key, val] of Object.entries(data)) {
        try {
          localStorage.setItem(PREFIX + key, JSON.stringify(val));
        } catch (e) {
          toast('Хранилище переполнено при импорте', 'error');
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }
};
