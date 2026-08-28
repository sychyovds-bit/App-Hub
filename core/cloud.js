import { toast } from './toast.js';
import { storage } from './storage.js';
import { modal } from './modal.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const EXCLUDE_KEYS = ['recent', 'usage'];
let client = null;
let libPromise = null;
let user = null;
let syncing = false;
const dirtyKeys = new Set();
const deletedKeys = new Set();
let pushTimer = null;

function loadLib() {
  if (window.supabase) return Promise.resolve();
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'lib/supabase.js';
      s.onload = resolve;
      s.onerror = () => { libPromise = null; reject(new Error('load')); };
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

async function getClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (client) return client;
  await loadLib();
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 800);
}

async function pushNow() {
  if (!user || !client) return;
  const keys = [...dirtyKeys]; dirtyKeys.clear();
  const dels = [...deletedKeys]; deletedKeys.clear();
  if (!keys.length && !dels.length) return;

  try {
    if (dels.length) {
      await client.from('kv_data').delete().in('key', dels);
    }
    if (keys.length) {
      const rows = [];
      for (const k of keys) {
        const value = storage.get(k);
        if (value !== null) rows.push({ key: k, value });
      }
      if (rows.length) {
        const { error } = await client.from('kv_data').upsert(rows, { onConflict: 'user_id,key' });
        if (error) throw error;
      }
    }
  } catch {
    toast('Ошибка синхронизации', 'error');
  }
}

async function pull() {
  if (!user || !client) return;
  syncing = true;
  try {
    const { data, error } = await client.from('kv_data').select('key,value');
    if (error) throw error;

    // Если облако пустое и есть локальные данные — первый запуск, отправляем локальные наверх
    if (!data.length) {
      const localKeys = Object.keys(localStorage)
        .filter(k => k.startsWith('apphub_') && !EXCLUDE_KEYS.includes(k.slice('apphub_'.length)))
        .map(k => k.slice('apphub_'.length));
      if (localKeys.length) {
        const rows = localKeys.map(k => ({ key: k, value: storage.get(k) }));
        await client.from('kv_data').upsert(rows, { onConflict: 'user_id,key' });
        toast('Данные загружены в облако', 'success');
      }
      return;
    }

    data.forEach(row => {
      if (!EXCLUDE_KEYS.includes(row.key)) {
        storage.set(row.key, row.value);
      }
    });
    toast('Данные из облака загружены', 'success');
  } catch {
    toast('Не удалось загрузить данные из облака', 'error');
  } finally {
    dirtyKeys.clear();
    syncing = false;
  }
}

function onLocalSet(e) {
  if (syncing || !user) return;
  const k = e.detail.key;
  if (EXCLUDE_KEYS.includes(k)) return;
  deletedKeys.delete(k);
  dirtyKeys.add(k);
  schedulePush();
}

function onLocalRemove(e) {
  if (syncing || !user) return;
  const k = e.detail.key;
  if (EXCLUDE_KEYS.includes(k)) return;
  dirtyKeys.delete(k);
  deletedKeys.add(k);
  schedulePush();
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const cloud = {
  get configured() {
    return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
  },
  get email() {
    return user ? user.email : null;
  },

  async init(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('click', () => this.openPanel());

    document.addEventListener('storage:set', onLocalSet);
    document.addEventListener('storage:remove', onLocalRemove);

    window.addEventListener('pagehide', () => {
      if (user && dirtyKeys.size) pushNow();
    });

    if (!this.configured) { this.updateBtn(btn); return; }

    client = await getClient();
    const { data } = await client.auth.getSession();
    if (data.session) {
      user = data.session.user;
      this.updateBtn(btn);
      pull();
    }
    this.btn = btn;
  },

  updateBtn(btn) {
    const el = btn || this.btn;
    if (!el) return;
    const labelEl = el.querySelector('.btn-label') || el;
    if (user) {
      const name = user.email.split('@')[0];
      labelEl.textContent = name.length > 14 ? name.slice(0, 13) + '…' : name;
      el.title = 'Облако: ' + user.email;
      el.classList.add('signed');
    } else {
      labelEl.textContent = 'Облако';
      el.title = 'Синхронизация данных';
      el.classList.remove('signed');
    }
  },

  openPanel() {
    if (!this.configured) {
      modal({
        title: 'Синхронизация не настроена',
        body: '<p>Укажите адрес проекта и anon-ключ Supabase в файле <code>core/config.js</code>, затем выполните SQL из <code>supabase/schema.sql</code> в SQL-редакторе проекта.</p>',
        actions: [{ label: 'Понятно', class: 'btn' }]
      });
      return;
    }

    if (!user) {
      modal({
        title: 'Облако',
        body: `
          <p style="margin-bottom:12px">Данные приложений будут синхронизироваться между вашими устройствами.</p>
          <input type="email" id="cloudEmail" placeholder="Email" aria-label="Email" style="width:100%;margin-bottom:8px">
          <input type="password" id="cloudPassword" placeholder="Пароль (мин. 6 символов)" aria-label="Пароль" style="width:100%">
        `,
        actions: [
          { label: 'Войти', class: 'btn', onClick: () => this.signIn() },
          { label: 'Регистрация', class: 'btn-ghost', onClick: () => this.signUp() },
          { label: 'Отмена', class: 'btn-ghost' }
        ]
      });
      setTimeout(() => document.getElementById('cloudEmail')?.focus(), 100);
      return;
    }

    modal({
      title: 'Облако',
      body: `<p>Вы вошли как <b>${esc(user.email)}</b>.</p><p style="margin-top:8px">Изменения синхронизируются автоматически.</p>`,
      actions: [
        { label: 'Синхронизировать сейчас', class: 'btn', onClick: async () => {
          await pushNow();
          await pull();
          toast('Данные синхронизированы', 'success');
        }},
        { label: 'Выйти', class: 'btn-ghost', onClick: () => this.signOut() },
        { label: 'Закрыть', class: 'btn-ghost' }
      ]
    });
  },

  async signIn() {
    const email = document.getElementById('cloudEmail')?.value.trim();
    const password = document.getElementById('cloudPassword')?.value;
    if (!email || !password) { toast('Заполните email и пароль', 'warning'); return; }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      toast(error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : 'Ошибка входа: ' + error.message, 'error');
      return;
    }
    user = data.user;
    this.updateBtn();
    await pull();
    toast('Вход выполнен, данные загружены', 'success');
  },

  async signUp() {
    const email = document.getElementById('cloudEmail')?.value.trim();
    const password = document.getElementById('cloudPassword')?.value;
    if (!email || !password) { toast('Заполните email и пароль', 'warning'); return; }
    if (password.length < 6) { toast('Пароль слишком короткий (мин. 6 символов)', 'warning'); return; }

    const { data, error } = await client.auth.signUp({ email, password });
    if (error) { toast('Ошибка регистрации: ' + error.message, 'error'); return; }

    if (data.session) {
      user = data.user;
      this.updateBtn();
      toast('Аккаунт создан', 'success');
    } else {
      toast('Проверьте почту для подтверждения', 'info');
    }
  },

  async signOut() {
    await pushNow();
    await client.auth.signOut();
    user = null;
    this.updateBtn();
    toast('Вы вышли из аккаунта', 'info');
  }
};
