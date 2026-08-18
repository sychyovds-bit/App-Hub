const apps = [];

export const registry = {
  add({ id, title, description, icon, category = 'general', load }) {
    if (apps.find(a => a.id === id)) {
      console.warn(`Registry: app "${id}" already registered`);
      return;
    }
    apps.push({ id, title, description, icon, category, load, loaded: false, instance: null });
  },

  getAll() {
    return [...apps];
  },

  getById(id) {
    return apps.find(a => a.id === id) || null;
  },

  async loadApp(id) {
    const app = this.getById(id);
    if (!app) return null;
    if (!app.loaded) {
      const module = await app.load();
      app.instance = module;
      app.loaded = true;
    }
    return app.instance;
  }
};
