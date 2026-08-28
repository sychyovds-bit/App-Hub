const apps = [];

export const registry = {
  add({ id, title, description, icon, category = 'general', load }) {
    if (apps.find(a => a.id === id)) {
      console.warn(`Registry: app "${id}" already registered`);
      return;
    }
    apps.push({ id, title, description, icon, category, load, loaded: false, instance: null, loading: null });
  },

  getAll() {
    return [...apps];
  },

  getById(id) {
    return apps.find(a => a.id === id) || null;
  },

  loadApp(id) {
    const app = this.getById(id);
    if (!app) return Promise.resolve(null);
    if (app.loaded) return Promise.resolve(app.instance);
    if (!app.loading) {
      app.loading = app.load()
        .then(module => {
          app.instance = module;
          app.loaded = true;
          app.loading = null;
          return module;
        })
        .catch(err => {
          app.loading = null;
          throw err;
        });
    }
    return app.loading;
  },

  preload(id) {
    const app = this.getById(id);
    if (!app || app.loaded) return;
    this.loadApp(id).catch(() => {});
  }
};
