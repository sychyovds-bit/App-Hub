export function init(container) {
  container.innerHTML = `
    <h1>Regex-тестер</h1>
    <p class="subtitle">Проверка регулярных выражений в реальном времени</p>
    <div class="widget" style="max-width:640px">
      <input class="regex-input" id="regexPattern" placeholder="Введите паттерн, например: \\d+">
      <div class="regex-flags">
        <label><input type="checkbox" id="flagG" checked> g (global)</label>
        <label><input type="checkbox" id="flagI"> i (ignore case)</label>
        <label><input type="checkbox" id="flagM"> m (multiline)</label>
      </div>
      <textarea class="regex-test-area" id="regexTest" placeholder="Введите текст для проверки..."></textarea>
      <div class="regex-results" id="regexResults"></div>
    </div>
  `;

  const pattern = container.querySelector('#regexPattern');
  const testArea = container.querySelector('#regexTest');
  const results = container.querySelector('#regexResults');
  const flags = ['flagG', 'flagI', 'flagM'];

  function test() {
    const p = pattern.value;
    const text = testArea.value;
    if (!p || !text) { results.innerHTML = ''; return; }

    let flagStr = '';
    if (container.querySelector('#flagG').checked) flagStr += 'g';
    if (container.querySelector('#flagI').checked) flagStr += 'i';
    if (container.querySelector('#flagM').checked) flagStr += 'm';

    try {
      const re = new RegExp(p, flagStr);
      const matches = [...text.matchAll(re)];

      if (matches.length === 0) {
        results.innerHTML = '<span class="regex-no-match">Совпадений не найдено</span>';
        return;
      }

      results.innerHTML = `
        <strong>${matches.length} совпадений:</strong><br>
        ${matches.map((m, i) => `<span class="regex-match">${i + 1}. "${m[0]}" (позиция ${m.index})</span>`).join('')}
      `;
    } catch (e) {
      results.innerHTML = `<span style="color:var(--danger)">${e.message}</span>`;
    }
  }

  pattern.addEventListener('input', test);
  testArea.addEventListener('input', test);
  flags.forEach(id => container.querySelector('#' + id).addEventListener('change', test));
}
