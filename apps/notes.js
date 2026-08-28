import { storage } from '../core/storage.js';
import { idb } from '../core/idb.js';
import { toast } from '../core/toast.js';
import { modal } from '../core/modal.js';

const LARGE_LIMIT = 100 * 1024;

function esc(s) {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function deriveTitle(text) {
  const first = text.split('\n').map(l => l.trim()).find(Boolean) || '';
  const t = first.replace(/^[#>\-*\d.\s]+/, '').trim();
  return t ? (t.length > 40 ? t.slice(0, 37) + '...' : t) : 'Без названия';
}

export async function init(container) {
  // Миграция со старого формата одной заметки
  if (storage.get('notes', null) === null) {
    const localNote = storage.get('note', null);
    const idbNote = await idb.get('note', null);
    const legacy = idbNote !== null ? idbNote : localNote;
    if (legacy !== null && legacy !== '') {
      const id = Date.now().toString(36);
      await idb.set('note-' + id, legacy);
      storage.set('notes', [{ id, t: Date.now(), text: '' }]);
    } else {
      storage.set('notes', []);
    }
    storage.remove('note');
    await idb.remove('note');
  }

  let notes = storage.get('notes', []);
  let currentId = storage.get('notes-current', null) || (notes[0] && notes[0].id) || null;

  container.innerHTML = `
    <h1>Заметки</h1>
    <p class="subtitle">Всё сохраняется автоматически при вводе</p>
    <div class="widget notes-app">
      <aside class="notes-side">
        <div class="notes-top">
          <input id="noteSearch" placeholder="Поиск по заметкам..." aria-label="Поиск по заметкам">
          <button class="btn" id="noteAddBtn" aria-label="Новая заметка">+</button>
        </div>
        <div class="note-list" id="noteList" role="listbox" aria-label="Список заметок"></div>
      </aside>
      <div class="notes-main">
        <textarea class="note-area" id="noteArea" placeholder="Начните писать..."></textarea>
        <div class="note-footer">
          <span class="note-status" id="noteStatus"></span>
          <span class="note-stats" id="noteStats"></span>
          <button class="btn-ghost note-del" id="noteDelBtn" aria-label="Удалить заметку">Удалить</button>
          <button class="btn-ghost" id="noteDownloadBtn" aria-label="Скачать заметку">Скачать</button>
        </div>
      </div>
      <div class="notes-empty" id="notesEmpty" hidden>Нет заметок — нажмите «+»</div>
    </div>
  `;

  const area = container.querySelector('#noteArea');
  const status = container.querySelector('#noteStatus');
  const stats = container.querySelector('#noteStats');
  const listEl = container.querySelector('#noteList');
  const searchEl = container.querySelector('#noteSearch');
  const emptyEl = container.querySelector('#notesEmpty');
  const delBtn = container.querySelector('#noteDelBtn');
  const downloadBtn = container.querySelector('#noteDownloadBtn');

  let saveTimer = null;
  let pendingCommit = null;
  let inIdb = false;
  let listSeq = 0;

  function cur() { return notes.find(n => n.id === currentId) || null; }

  function saveMeta() { storage.set('notes', notes); storage.set('notes-current', currentId); }

  async function loadText(note) {
    if (!note) return '';
    if (note.text === '' && (await idb.get('note-' + note.id, null)) !== null) {
      return idb.get('note-' + note.id, '');
    }
    return note.text;
  }

  function fmtDate(t) {
    return new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  async function renderList() {
    const seq = ++listSeq;
    const q = searchEl.value.trim().toLowerCase();
    const items = [];
    for (const n of notes) {
      const text = await loadText(n);
      if (seq !== listSeq) return;
      n._text = text;
      n._title = deriveTitle(text);
      if (q && !(n._title.toLowerCase().includes(q) || text.toLowerCase().includes(q))) continue;
      items.push(n);
    }
    if (seq !== listSeq) return;
    listEl.innerHTML = '';
    if (!items.length && q) {
      listEl.innerHTML = '<p class="note-list-empty">Ничего не найдено</p>';
    }
    items.forEach(n => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'note-item' + (n.id === currentId ? ' active' : '');
      el.setAttribute('role', 'option');
      el.setAttribute('aria-selected', String(n.id === currentId));
      el.dataset.id = n.id;
      el.innerHTML = `<span class="note-item-title">${esc(n._title)}</span>
        <span class="note-item-date">${fmtDate(n.t)}</span>`;
      listEl.appendChild(el);
    });
    emptyEl.hidden = notes.length > 0 || !!q;
  }

  function flushDebounce() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (pendingCommit) {
      const fn = pendingCommit;
      pendingCommit = null;
      fn();
    }
  }

  async function openNote(id) {
    if (id === currentId) return;
    flushDebounce();
    const note = notes.find(n => n.id === id);
    if (!note) return;
    currentId = id;
    saveMeta();
    const text = await loadText(note);
    inIdb = note.text === '' && (await idb.get('note-' + note.id, null)) !== null;
    area.value = text;
    area.disabled = false;
    updateStats();
    renderList();
  }

  function updateStats() {
    const text = area.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    stats.textContent = `${words} слов · ${chars} символов`;
  }

  function refreshListTitles() {
    listEl.querySelectorAll('.note-item').forEach(el => {
      const n = notes.find(x => x.id === el.dataset.id);
      if (!n) return;
      const titleEl = el.querySelector('.note-item-title');
      if (titleEl) titleEl.textContent = deriveTitle(n._text || area.value);
      const dateEl = el.querySelector('.note-item-date');
      if (dateEl) dateEl.textContent = fmtDate(n.t);
    });
  }

  async function persistNote(note, text) {
    const large = new Blob([text]).size > LARGE_LIMIT;
    if (large) {
      const ok = await idb.set('note-' + note.id, text);
      if (ok) {
        note.text = '';
        if (!inIdb) { inIdb = true; }
        status.textContent = 'Сохранено (IndexedDB) в ' + new Date().toLocaleTimeString();
      } else {
        toast('Не удалось сохранить заметку', 'error');
      }
    } else {
      note.text = text;
      if (inIdb) { await idb.remove('note-' + note.id); inIdb = false; }
      status.textContent = 'Сохранено в ' + new Date().toLocaleTimeString();
    }
    saveMeta();
  }

  area.addEventListener('input', () => {
    const note = cur();
    if (!note) return;
    note.t = Date.now();
    const text = area.value;
    note._text = text;
    updateStats();
    refreshListTitles();
    clearTimeout(saveTimer);
    pendingCommit = () => persistNote(note, area.value);
    saveTimer = setTimeout(() => {
      const fn = pendingCommit;
      pendingCommit = null;
      if (fn) fn();
    }, 500);
  });

  listEl.addEventListener('click', (e) => {
    const el = e.target.closest('.note-item');
    if (!el) return;
    openNote(el.dataset.id);
  });

  container.querySelector('#noteAddBtn').addEventListener('click', () => {
    flushDebounce();
    const note = { id: Date.now().toString(36), t: Date.now(), text: '' };
    notes.unshift(note);
    currentId = note.id;
    saveMeta();
    area.value = '';
    inIdb = false;
    area.disabled = false;
    updateStats();
    renderList();
    area.focus();
  });

  searchEl.addEventListener('input', renderList);

  delBtn.addEventListener('click', () => {
    const note = cur();
    if (!note) return;
    modal({
      title: 'Удалить заметку?',
      body: `<p>Заметка «${esc(deriveTitle(note._text || area.value))}» будет удалена безвозвратно.</p>`,
      actions: [
        { label: 'Удалить', class: 'btn', onClick: async () => {
          flushDebounce();
          notes = notes.filter(n => n.id !== note.id);
          await idb.remove('note-' + note.id);
          const next = notes[0];
          if (!next) {
            currentId = null;
            saveMeta();
            area.value = '';
            area.disabled = true;
            updateStats();
          } else {
            await openNote(next.id);
          }
          renderList();
          toast('Заметка удалена', 'info');
        }},
        { label: 'Отмена', class: 'btn-ghost' }
      ]
    });
  });

  downloadBtn.addEventListener('click', () => {
    const note = cur();
    if (!note) return;
    const blob = new Blob([area.value || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (deriveTitle(area.value).replace(/[^\wа-яА-ЯёЁ\s-]/g, '').trim() || 'заметка') + '.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Заметка скачана', 'success');
  });

  // Первичная загрузка
  const first = notes.find(n => n.id === currentId) || notes[0];
  if (first) {
    currentId = first.id;
    saveMeta();
    const text = await loadText(first);
    inIdb = first.text === '' && (await idb.get('note-' + first.id, null)) !== null;
    area.value = text;
  } else {
    area.value = '';
    area.disabled = true;
    emptyEl.hidden = notes.length > 0;
  }
  updateStats();
  renderList();

  document.addEventListener('router:leave', function onLeave(e) {
    if (e.detail.page !== 'notes') return;
    document.removeEventListener('router:leave', onLeave);
    flushDebounce();
  });
}
