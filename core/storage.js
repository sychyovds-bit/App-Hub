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
      return true;
    } catch (e) {
      console.warn('Storage: quota exceeded or write error', e);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },

  exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) {
        data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k));
      }
    }
    return JSON.stringify(data, null, 2);
  },

  importAll(json) {
    try {
      const data = JSON.parse(json);
      for (const [key, val] of Object.entries(data)) {
        localStorage.setItem(PREFIX + key, JSON.stringify(val));
      }
      return true;
    } catch {
      return false;
    }
  }
};
