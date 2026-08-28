import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';
import { throttle } from '../core/utils.js';

const VIRTUAL_THRESHOLD = 100;
const ITEM_HEIGHT = 54; // высота 46px + margin-bottom 8px

export function init(container) {
  let todos = storage.get('todos', []);
  let virtual = todos.length > VIRTUAL_THRESHOLD;
  let filter = 'all';

  container.innerHTML = `
    <h1>Задачи</h1>
    <p class="subtitle">Список сохраняется в вашем браузере · двойной клик — редактировать</p>
    <div class="widget">
      <div class="todo-row">
        <input id="todoInput" placeholder="Новая задача..." aria-label="Текст новой задачи">
        <button class="btn" id="todoAddBtn">Добавить</button>
      </div>
      <div class="todo-filters" id="todoFilters">
        <button class="filter-pill active" data-filter="all">Все <span class="pill-count" id="countAll">0</span></button>
        <button class="filter-pill" data-filter="active">Активные <span class="pill-count" id="countActive">0</span></button>
        <button class="filter-pill" data-filter="done">Готово <span class="pill-count" id="countDone">0</span></button>
        <button class="btn-ghost todo-clear-done" id="todoClearDone">Очистить выполненные</button>
      </div>
      <div id="todoList"></div>
    </div>
  `;

  const input = container.querySelector('#todoInput');
  const list = container.querySelector('#todoList');
  const clearDoneBtn = container.querySelector('#todoClearDone');

  function matches(t) {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  }

  function filteredItems() {
    const out = [];
    for (let i = 0; i < todos.length; i++) if (matches(todos[i])) out.push({ t: todos[i], i });
    return out;
  }

  function itemHtml(t, i) {
    return `
      <div class="todo-item ${t.done ? 'done' : ''}" style="height:${ITEM_HEIGHT - 8}px">
        <input type="checkbox" ${t.done ? 'checked' : ''} data-idx="${i}" data-action="toggle">
        <span data-idx="${i}" data-action="toggle" title="Двойной клик — редактировать">${t.text.replace(/</g, '&lt;')}</span>
        <button class="del" data-idx="${i}" data-action="delete" aria-label="Удалить задачу">&times;</button>
      </div>
    `;
  }

  function updateCounts() {
    const done = todos.filter(t => t.done).length;
    container.querySelector('#countAll').textContent = todos.length;
    container.querySelector('#countActive').textContent = todos.length - done;
    container.querySelector('#countDone').textContent = done;
    clearDoneBtn.hidden = done === 0;
  }

  function renderPlain(newIdx = -1) {
    const items = filteredItems();
    list.style.maxHeight = '';
    list.style.overflowY = '';
    list.style.paddingTop = '';
    list.style.paddingBottom = '';
    list.innerHTML = items.length
      ? items.map(({ t, i }) => itemHtml(t, i)).join('')
      : '<p class="note-list-empty">Нет задач</p>';
    if (newIdx >= 0) {
      const el = list.querySelector('.todo-item input[data-idx="' + newIdx + '"]');
      el?.closest('.todo-item')?.classList.add('slide-in');
    }
  }

  function renderVirtual() {
    const items = filteredItems();
    const scrollTop = list.scrollTop;
    const viewHeight = list.clientHeight || window.innerHeight;

    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 5);
    const end = Math.min(items.length, Math.ceil((scrollTop + viewHeight) / ITEM_HEIGHT) + 5);

    let html = '';
    for (let i = start; i < end; i++) html += itemHtml(items[i].t, items[i].i);

    list.innerHTML = html;
    list.style.paddingTop = start * ITEM_HEIGHT + 'px';
    list.style.paddingBottom = Math.max(0, (items.length - end) * ITEM_HEIGHT) + 'px';
  }

  function render(newIdx = -1) {
    updateCounts();
    if (todos.length > VIRTUAL_THRESHOLD) {
      virtual = true;
      list.style.maxHeight = '60vh';
      list.style.overflowY = 'auto';
      renderVirtual();
    } else {
      virtual = false;
      list.scrollTop = 0;
      renderPlain(newIdx);
    }
  }

  function save(newIdx = -1) { storage.set('todos', todos); render(newIdx); }

  list.addEventListener('scroll', throttle(() => {
    if (virtual) renderVirtual();
  }, 80));

  function add() {
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, done: false });
    input.value = '';
    const newIdx = todos.length - 1;
    if (filter === 'done') {
      filter = 'all';
      container.querySelectorAll('.filter-pill').forEach(b =>
        b.classList.toggle('active', b.dataset.filter === 'all'));
    }
    save(newIdx);
    toast('Задача добавлена', 'success');
  }

  container.querySelector('#todoAddBtn').addEventListener('click', add);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

  container.querySelector('#todoFilters').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    filter = btn.dataset.filter;
    container.querySelectorAll('.filter-pill').forEach(b => b.classList.toggle('active', b === btn));
    render();
  });

  clearDoneBtn.addEventListener('click', () => {
    const snapshot = todos.slice();
    const removedCount = todos.filter(t => t.done).length;
    if (!removedCount) return;
    todos = todos.filter(t => !t.done);
    save();
    toast(`Удалено выполненных: ${removedCount}`, 'info', 5000, {
      actionLabel: 'Отменить',
      onAction: () => {
        todos = snapshot;
        save();
        toast('Список восстановлен', 'success');
      }
    });
  });

  list.addEventListener('click', e => {
    const idx = e.target.dataset.idx;
    if (idx === undefined) return;
    const i = parseInt(idx);
    if (e.target.dataset.action === 'toggle') {
      todos[i].done = !todos[i].done;
      save();
    } else if (e.target.dataset.action === 'delete') {
      const itemEl = e.target.closest('.todo-item');
      if (!itemEl || todos[i]._removing) return;
      const removed = todos[i];
      const removedIdx = i;
      itemEl.classList.add('fade-out');
      setTimeout(() => {
        todos.splice(removedIdx, 1);
        save();
        toast('Задача удалена', 'info', 5000, {
          actionLabel: 'Отменить',
          onAction: () => {
            todos.splice(Math.min(removedIdx, todos.length), 0, removed);
            save();
            toast('Задача восстановлена', 'success');
          }
        });
      }, 250);
    }
  });

  list.addEventListener('dblclick', e => {
    const span = e.target.matches('span[data-idx]') ? e.target : null;
    if (!span) return;
    const i = parseInt(span.dataset.idx);
    const editInput = document.createElement('input');
    editInput.className = 'todo-edit-input';
    editInput.value = todos[i].text;
    editInput.setAttribute('aria-label', 'Редактировать задачу');
    span.replaceWith(editInput);
    editInput.focus();
    editInput.select();
    let finished = false;
    const commit = () => {
      if (finished) return;
      finished = true;
      const v = editInput.value.trim();
      if (v && v !== todos[i].text) {
        todos[i].text = v;
        save();
        toast('Задача изменена', 'success');
      } else {
        render();
      }
    };
    editInput.addEventListener('click', ev => { ev.stopPropagation(); ev.target.dataset.action = ''; });
    editInput.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') editInput.blur();
      if (ev.key === 'Escape') { finished = true; render(); }
    });
    editInput.addEventListener('blur', commit);
  });

  render();
}
