export function init(container) {
  const data = {
    length: {
      'мм': 0.001, 'см': 0.01, 'м': 1, 'км': 1000,
      'дюйм': 0.0254, 'фут': 0.3048, 'ярд': 0.9144, 'миля': 1609.34
    },
    weight: {
      'мг': 0.000001, 'г': 0.001, 'кг': 1, 'т': 1000,
      'унция': 0.02835, 'фунт': 0.4536, 'стоун': 6.3503
    },
    temp: ['°C', '°F', 'K'],
    speed: {
      'м/с': 1, 'км/ч': 0.27778, 'миля/ч': 0.44704, 'узел': 0.51444
    },
    data: {
      'Б': 1, 'КБ': 1024, 'МБ': 1048576, 'ГБ': 1073741824, 'ТБ': 1099511627776
    }
  };

  container.innerHTML = `
    <h1>Конвертер величин</h1>
    <p class="subtitle">Длина, вес, температура, скорость, данные</p>
    <div class="widget">
      <div class="conv-row">
        <select id="convType">
          <option value="length">Длина</option>
          <option value="weight">Вес</option>
          <option value="temp">Температура</option>
          <option value="speed">Скорость</option>
          <option value="data">Данные</option>
        </select>
      </div>
      <div class="conv-row">
        <input id="convInput" type="number" value="1" style="width:120px">
        <select id="convFrom"></select>
        <span style="color:var(--muted)">→</span>
        <select id="convTo"></select>
      </div>
      <div class="conv-result" id="convResult"></div>
      <div class="conv-history" id="convHistory"></div>
    </div>
  `;

  const typeEl = container.querySelector('#convType');
  const inputEl = container.querySelector('#convInput');
  const fromEl = container.querySelector('#convFrom');
  const toEl = container.querySelector('#convTo');
  const resultEl = container.querySelector('#convResult');
  const historyEl = container.querySelector('#convHistory');
  let history = [];

  function buildUnits() {
    const type = typeEl.value;
    const units = Array.isArray(data[type]) ? data[type] : Object.keys(data[type]);
    const opts = units.map(u => `<option>${u}</option>`).join('');
    fromEl.innerHTML = opts;
    toEl.innerHTML = opts;
    toEl.selectedIndex = Math.min(1, units.length - 1);
    convert();
  }

  function convert() {
    const type = typeEl.value;
    const val = parseFloat(inputEl.value) || 0;
    const from = fromEl.value;
    const to = toEl.value;
    let r;

    if (type === 'temp') {
      let c = from === '°C' ? val : from === '°F' ? (val - 32) * 5 / 9 : val - 273.15;
      r = to === '°C' ? c : to === '°F' ? c * 9 / 5 + 32 : c + 273.15;
    } else {
      r = val * data[type][from] / data[type][to];
    }

    const formatted = Math.abs(r) >= 1e9 || (Math.abs(r) < 0.001 && r !== 0)
      ? r.toExponential(4)
      : +r.toFixed(6);

    resultEl.textContent = `${val} ${from} = ${formatted} ${to}`;

    // История
    history.unshift(`${val} ${from} → ${formatted} ${to}`);
    if (history.length > 5) history.pop();
    historyEl.innerHTML = history.map(h => `<div class="conv-history-item">${h}</div>`).join('');
  }

  typeEl.addEventListener('change', buildUnits);
  inputEl.addEventListener('input', convert);
  fromEl.addEventListener('change', convert);
  toEl.addEventListener('change', convert);

  buildUnits();
}
