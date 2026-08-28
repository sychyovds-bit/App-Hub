import { storage } from '../core/storage.js';
import { modal } from '../core/modal.js';

export function init(container) {
  const prefs = storage.get('guess-prefs', { limit: 10 });
  let target = rand();
  let tries = 0;
  let over = false;
  let best = storage.get('guess-best', null);

  function rand() {
    return Math.floor(Math.random() * 100) + 1;
  }

  function plural(n) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'попытка';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'попытки';
    return 'попыток';
  }

  container.innerHTML = `
    <h1>Угадай число</h1>
    <p class="subtitle">Я загадал число от 1 до 100</p>
    <div class="widget" style="max-width:440px;text-align:center">
      <div class="conv-row guess-limit-row">
        <label>Лимит попыток:
          <select id="guessLimit" aria-label="Лимит попыток">
            <option value="0">Без лимита</option>
            <option value="7">7 (мастер)</option>
            <option value="10">10</option>
            <option value="15">15</option>
          </select>
        </label>
      </div>
      <div class="todo-row">
        <input type="number" id="guessInput" min="1" max="100" placeholder="Ваше число..." aria-label="Ваше число">
        <button class="btn" id="guessBtn">Проверить</button>
      </div>
      <div id="guessHint" class="guess-hint">Введите число и нажмите «Проверить»</div>
      <div class="guess-stats" id="guessStats"></div>
      <button class="btn-ghost" id="guessNewBtn">Новая игра</button>
    </div>
  `;

  const input = container.querySelector('#guessInput');
  const hint = container.querySelector('#guessHint');
  const stats = container.querySelector('#guessStats');
  const guessBtn = container.querySelector('#guessBtn');
  const limitSel = container.querySelector('#guessLimit');

  // сохранённый лимит (0 = без лимита) — только если он среди вариантов
  if (!Array.from(limitSel.options).some(o => o.value === String(prefs.limit))) {
    limitSel.value = '10';
  } else {
    limitSel.value = String(prefs.limit);
  }

  function getLimit() { return parseInt(limitSel.value, 10) || 0; }

  function renderStats() {
    const limit = getLimit();
    const leftStr = limit ? ` · Осталось: ${Math.max(0, limit - tries)}` : '';
    const bestTxt = best !== null ? `Рекорд: ${best} ${plural(best)}` : 'Рекорд ещё не установлен';
    stats.textContent = `Попыток: ${tries}${leftStr} · ${bestTxt}`;
  }

  function lose() {
    over = true;
    input.disabled = true;
    hint.textContent = 'Попытки закончились. Нажмите «Новая игра».';
    hint.classList.add('lose');
    modal({
      title: 'Не угадали',
      body: `<p>Было загадано число <strong>${target}</strong>. Потрачено попыток: ${tries}.</p>`,
      actions: [
        { label: 'Играть снова', class: 'btn', onClick: reset },
        { label: 'Закрыть', class: 'btn-ghost' }
      ]
    });
  }

  function check() {
    if (over) return;
    const n = parseInt(input.value, 10);
    if (Number.isNaN(n) || n < 1 || n > 100) {
      hint.textContent = 'Введите число от 1 до 100';
      return;
    }
    tries++;
    input.value = '';
    if (n === target) {
      over = true;
      hint.textContent = `Угадали! Это было ${target}. Потрачено попыток: ${tries}.`;
      hint.classList.add('win');
      if (best === null || tries < best) {
        best = tries;
        storage.set('guess-best', best);
        hint.textContent += ' Новый рекорд!';
      }
    } else {
      hint.textContent = n < target ? 'Больше ↑' : 'Меньше ↓';
      const limit = getLimit();
      if (limit && tries >= limit) {
        lose();
      }
    }
    renderStats();
    if (!over) input.focus();
  }

  function reset() {
    target = rand();
    tries = 0;
    over = false;
    input.disabled = false;
    hint.textContent = 'Я загадал новое число. Угадывайте!';
    hint.classList.remove('win', 'lose');
    input.value = '';
    renderStats();
    input.focus();
  }

  guessBtn.addEventListener('click', check);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  container.querySelector('#guessNewBtn').addEventListener('click', reset);
  limitSel.addEventListener('change', () => {
    storage.set('guess-prefs', { limit: getLimit() });
    reset();
  });

  renderStats();
  input.focus();
}
