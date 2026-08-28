import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function esc(s) {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function init(container) {
  let events = storage.get('planner', {});
  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedKey = dateKey(today);

  container.innerHTML = `
    <h1>Календарь</h1>
    <p class="subtitle">Планируйте события по датам — всё хранится локально</p>
    <div class="widget planner-widget">
      <div class="planner-main">
        <div class="planner-head">
          <button class="btn-ghost planner-nav" id="prevMonth" aria-label="Предыдущий месяц">‹</button>
          <span class="planner-month" id="monthLabel"></span>
          <button class="btn-ghost planner-nav" id="nextMonth" aria-label="Следующий месяц">›</button>
        </div>
        <div class="planner-weekdays">
          ${DAYS.map(d => `<span>${d}</span>`).join('')}
        </div>
        <div class="planner-grid" id="plannerGrid"></div>
      </div>
      <div class="planner-side">
        <h3 id="dayTitle" class="planner-day-title"></h3>
        <div class="todo-row">
          <input id="eventInput" type="text" placeholder="Новое событие..." aria-label="Текст события" maxlength="120">
          <button class="btn" id="addEventBtn">+</button>
        </div>
        <div id="eventList" class="planner-events"></div>
      </div>
    </div>
  `;

  const grid = container.querySelector('#plannerGrid');
  const monthLabel = container.querySelector('#monthLabel');
  const dayTitle = container.querySelector('#dayTitle');
  const eventInput = container.querySelector('#eventInput');
  const eventList = container.querySelector('#eventList');

  function save() { storage.set('planner', events); }

  function renderCalendar() {
    monthLabel.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
    grid.innerHTML = '';

    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Пн=0 ... Вс=6
    let startOffset = (first.getDay() + 6) % 7;

    for (let i = 0; i < startOffset; i++) {
      const cell = document.createElement('span');
      cell.className = 'planner-cell empty';
      grid.appendChild(cell);
    }

    const todayKey = dateKey(new Date());
    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(new Date(viewYear, viewMonth, d));
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'planner-cell';
      if (key === todayKey) cell.classList.add('today');
      if (key === selectedKey) cell.classList.add('selected');
      cell.textContent = d;
      if (events[key] && events[key].length) {
        const dot = document.createElement('span');
        dot.className = 'planner-dot';
        cell.appendChild(dot);
      }
      cell.addEventListener('click', () => {
        selectedKey = key;
        renderCalendar();
        renderEvents();
      });
      grid.appendChild(cell);
    }
  }

  function renderEvents() {
    const date = new Date(selectedKey + 'T00:00:00');
    dayTitle.textContent = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
    const list = events[selectedKey] || [];
    eventList.innerHTML = '';

    if (!list.length) {
      eventList.innerHTML = '<p class="planner-empty">Событий нет</p>';
      return;
    }

    list.forEach(ev => {
      const el = document.createElement('div');
      el.className = 'planner-event';
      el.innerHTML = `<span class="planner-ev-txt">
          <input type="checkbox" data-id="${ev.id}" ${ev.done ? 'checked' : ''} aria-label="Отметить выполненным">
          <span class="${ev.done ? 'done' : ''}">${esc(ev.text)}</span>
        </span>
        <button class="del" data-id="${ev.id}" aria-label="Удалить событие">&times;</button>`;
      eventList.appendChild(el);
    });
  }

  function addEvent() {
    const text = eventInput.value.trim();
    if (!text) return;
    if (!events[selectedKey]) events[selectedKey] = [];
    events[selectedKey].push({ id: Date.now().toString(36), text, done: false });
    eventInput.value = '';
    save();
    renderCalendar();
    renderEvents();
    toast('Событие добавлено', 'success');
  }

  container.querySelector('#addEventBtn').addEventListener('click', addEvent);
  eventInput.addEventListener('keydown', e => { if (e.key === 'Enter') addEvent(); });

  eventList.addEventListener('click', e => {
    const btn = e.target.closest('.del');
    if (!btn) return;
    const list = events[selectedKey] || [];
    const removed = list.find(ev => ev.id === btn.dataset.id);
    if (!removed) return;
    events[selectedKey] = list.filter(ev => ev.id !== removed.id);
    if (!events[selectedKey].length) delete events[selectedKey];
    save();
    renderCalendar();
    renderEvents();
    toast('Событие удалено', 'info', 5000, {
      actionLabel: 'Отменить',
      onAction: () => {
        if (!events[selectedKey]) events[selectedKey] = [];
        events[selectedKey].push(removed);
        save();
        renderCalendar();
        renderEvents();
      }
    });
  });

  eventList.addEventListener('change', e => {
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    const list = events[selectedKey] || [];
    const ev = list.find(item => item.id === cb.dataset.id);
    if (!ev) return;
    ev.done = cb.checked;
    save();
    renderEvents();
  });

  function shiftMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  }

  container.querySelector('#prevMonth').addEventListener('click', () => shiftMonth(-1));
  container.querySelector('#nextMonth').addEventListener('click', () => shiftMonth(1));

  renderCalendar();
  renderEvents();
}
