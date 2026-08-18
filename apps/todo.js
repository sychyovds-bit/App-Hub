import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';

export function init(container) {
  let todos = storage.get('todos', []);

  container.innerHTML = `
    <h1>Задачи</h1>
    <p class="subtitle">Список сохраняется в вашем браузере</p>
    <div class="widget">
      <div class="todo-row">
        <input id="todoInput" placeholder="Новая задача...">
        <button class="btn" id="todoAddBtn">Добавить</button>
      </div>
      <div id="todoList"></div>
    </div>
  `;

  const input = container.querySelector('#todoInput');
  const list = container.querySelector('#todoList');

  function save() { storage.set('todos', todos); render(); }

  function render() {
    list.innerHTML = todos.map((t, i) => `
      <div class="todo-item ${t.done ? 'done' : ''}">
        <input type="checkbox" ${t.done ? 'checked' : ''} data-idx="${i}" data-action="toggle">
        <span data-idx="${i}" data-action="toggle">${t.text.replace(/</g, '&lt;')}</span>
        <button class="del" data-idx="${i}" data-action="delete">&times;</button>
      </div>
    `).join('');
  }

  function add() {
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, done: false });
    input.value = '';
    save();
    toast('Задача добавлена', 'success');
  }

  container.querySelector('#todoAddBtn').addEventListener('click', add);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

  list.addEventListener('click', e => {
    const idx = e.target.dataset.idx;
    if (idx === undefined) return;
    const i = parseInt(idx);
    if (e.target.dataset.action === 'toggle') {
      todos[i].done = !todos[i].done;
      save();
    } else if (e.target.dataset.action === 'delete') {
      todos.splice(i, 1);
      save();
      toast('Задача удалена', 'info');
    }
  });

  render();
}
