export function init(container) {
  const today = new Date().toISOString().slice(0, 10);

  container.innerHTML = `
    <h1>Разница дат</h1>
    <p class="subtitle">Сколько дней между двумя датами и калькулятор дат</p>
    <div class="widget" style="max-width:600px">
      <h3 style="font-size:14px;margin-bottom:10px;">Между двумя датами</h3>
      <div class="conv-row">
        <input type="date" id="dateA" value="${today}" aria-label="Первая дата">
        <span style="color:var(--muted)">→</span>
        <input type="date" id="dateB" value="${today}" aria-label="Вторая дата">
      </div>
      <div id="diffResult" class="datediff-result"></div>

      <h3 style="font-size:14px;margin:24px 0 10px;">Дата ± дни</h3>
      <div class="conv-row">
        <input type="date" id="calcDate" value="${today}" aria-label="Исходная дата">
        <select id="calcDir" aria-label="Направление">
          <option value="1">+ плюс дней</option>
          <option value="-1">− минус дней</option>
        </select>
        <input type="number" id="calcDays" value="30" min="0" max="36500" aria-label="Количество дней">
        <button class="btn" id="calcBtn">Рассчитать</button>
      </div>
      <div id="calcResult" class="datediff-result"></div>
    </div>
  `;

  const dateA = container.querySelector('#dateA');
  const dateB = container.querySelector('#dateB');
  const diffResult = container.querySelector('#diffResult');
  const calcDate = container.querySelector('#calcDate');
  const calcDir = container.querySelector('#calcDir');
  const calcDays = container.querySelector('#calcDays');
  const calcResult = container.querySelector('#calcResult');

  function parse(v) {
    if (!v) return null;
    const d = new Date(v + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  function fmt(d) {
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  }

  function renderDiff() {
    const a = parse(dateA.value);
    const b = parse(dateB.value);
    if (!a || !b) {
      diffResult.innerHTML = '<p style="color:var(--muted)">Выберите обе даты</p>';
      return;
    }
    const days = Math.round((b - a) / 86400000);
    const abs = Math.abs(days);
    const weeks = Math.floor(abs / 7);
    const hours = abs * 24;
    const months = Math.round(abs / 30.44);
    const years = Math.floor(abs / 365.25);
    const sign = days < 0 ? 'в обратную сторону (B раньше A)' : days > 0 ? 'от A к B' : 'одна и та же дата';

    diffResult.innerHTML = `
      <div class="datediff-big">${abs} ${plural(abs, 'день', 'дня', 'дней')} <small>${sign}</small></div>
      <div class="datediff-lines">
        <span>${weeks} ${plural(weeks, 'неделя', 'недели', 'недель')} ${abs % 7 ? `и ${abs % 7} ${plural(abs % 7, 'день', 'дня', 'дней')}` : ''}</span>
        <span>≈ ${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}</span>
        <span>≈ ${years} ${plural(years, 'год', 'года', 'лет')}</span>
        <span>${hours.toLocaleString('ru-RU')} часов</span>
      </div>
    `;
  }

  function renderCalc() {
    const base = parse(calcDate.value);
    const n = parseInt(calcDays.value, 10);
    if (!base || Number.isNaN(n) || n < 0) {
      calcResult.innerHTML = '<p style="color:var(--muted)">Выберите дату и число дней</p>';
      return;
    }
    const result = new Date(base.getTime() + parseInt(calcDir.value, 10) * n * 86400000);
    calcResult.innerHTML = `<div class="datediff-big">${fmt(result)}</div>`;
  }

  container.querySelector('#calcBtn').addEventListener('click', renderCalc);
  [dateA, dateB].forEach(el => el.addEventListener('input', renderDiff));
  [calcDate, calcDir, calcDays].forEach(el => el.addEventListener('input', renderCalc));

  renderDiff();
  renderCalc();
}
