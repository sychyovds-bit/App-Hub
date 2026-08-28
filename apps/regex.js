import { toast } from '../core/toast.js';

export function init(container) {
  container.innerHTML = `
    <h1>Regex-тестер</h1>
    <p class="subtitle">Проверка регулярных выражений в реальном времени</p>
    <div class="widget" style="max-width:640px">
      <input class="regex-input" id="regexPattern" placeholder="Введите паттерн, например: \\d+" aria-label="Регулярное выражение">
      <div class="regex-flags">
        <label><input type="checkbox" id="flagG" checked> g (global)</label>
        <label><input type="checkbox" id="flagI"> i (ignore case)</label>
        <label><input type="checkbox" id="flagM"> m (multiline)</label>
      </div>
      <textarea class="regex-test-area" id="regexTest" placeholder="Введите текст для проверки..." aria-label="Текст для проверки"></textarea>
      <div class="regex-results" id="regexResults" aria-live="polite"></div>
      <div class="regex-highlight" id="regexHighlight" hidden></div>
      <button class="btn-ghost" id="regexCopyAll" hidden>Копировать все совпадения</button>
    </div>
  `;

  const pattern = container.querySelector('#regexPattern');
  const testArea = container.querySelector('#regexTest');
  const results = container.querySelector('#regexResults');
  const highlight = container.querySelector('#regexHighlight');
  const copyAll = container.querySelector('#regexCopyAll');
  const flags = ['flagG', 'flagI', 'flagM'];
  let lastMatches = [];

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function test() {
    const p = pattern.value;
    const text = testArea.value;
    lastMatches = [];
    copyAll.hidden = true;
    if (!p || !text) { results.innerHTML = ''; highlight.hidden = true; return; }

    let flagStr = '';
    if (container.querySelector('#flagG').checked) flagStr += 'g';
    if (container.querySelector('#flagI').checked) flagStr += 'i';
    if (container.querySelector('#flagM').checked) flagStr += 'm';

    try {
      // matchAll требует флаг g — добавляем его независимо от чекбокса
      const re = new RegExp(p, flagStr + (flagStr.includes('g') ? '' : 'g'));
      const matches = [...text.matchAll(re)];

      if (matches.length === 0) {
        results.innerHTML = '<span class="regex-no-match">Совпадений не найдено</span>';
        highlight.hidden = true;
        return;
      }

      lastMatches = matches.map(m => m[0]);

      results.innerHTML = `
        <strong>${matches.length} совпадений:</strong><br>
        ${matches.slice(0, 50).map((m, i) => `<span class="regex-match">${i + 1}. "${esc(m[0])}" (позиция ${m.index})</span>`).join('')}
        ${matches.length > 50 ? `<span class="regex-no-match">… ещё ${matches.length - 50}</span>` : ''}
      `;
      copyAll.hidden = false;

      // Подсветка совпадений в тексте
      let html = '';
      let pos = 0;
      for (const m of matches) {
        if (m.index < pos) continue;
        html += esc(text.slice(pos, m.index));
        html += `<mark class="regex-hit">${esc(m[0] || '\u2205')}</mark>`;
        pos = m.index + m[0].length;
        if (m[0] === '') pos = m.index + 1;
      }
      html += esc(text.slice(pos));
      highlight.innerHTML = '<pre class="regex-highlight-pre">' + html + '</pre>';
      highlight.hidden = false;
    } catch (e) {
      results.innerHTML = `<span style="color:var(--danger)">${esc(e.message)}</span>`;
      highlight.hidden = true;
    }
  }

  copyAll.addEventListener('click', () => {
    if (!lastMatches.length) return;
    navigator.clipboard.writeText(lastMatches.join('\n')).then(
      () => toast('Совпадения скопированы (' + lastMatches.length + ')', 'info'),
      () => toast('Не удалось скопировать', 'error')
    );
  });

  pattern.addEventListener('input', test);
  testArea.addEventListener('input', test);
  flags.forEach(id => container.querySelector('#' + id).addEventListener('change', test));
}
