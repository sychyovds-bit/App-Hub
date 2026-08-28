import { toast } from '../core/toast.js';
import { hookFileDrop } from '../core/utils.js';

export function init(container) {
  container.innerHTML = `
    <h1>Diff-сравнение текста</h1>
    <p class="subtitle">Построчное сравнение двух текстов · перетащите файлы в панели</p>
    <div class="diff-wrap">
      <div class="diff-pane">
        <div class="md-pane-title">Исходный текст</div>
        <textarea id="diffA" class="diff-input" spellcheck="false"></textarea>
      </div>
      <div class="diff-pane">
        <div class="md-pane-title">Изменённый текст</div>
        <textarea id="diffB" class="diff-input" spellcheck="false"></textarea>
      </div>
    </div>
    <div class="diff-legend">
      <span class="diff-legend-item diff-same">— одинаково</span>
      <span class="diff-legend-item diff-added">+ добавлено</span>
      <span class="diff-legend-item diff-removed">− удалено</span>
      <span class="diff-legend-item diff-changed">~ изменено</span>
      <span class="diff-stats" id="diffStats"></span>
      <button class="btn-ghost diff-mini" id="diffSwapBtn" title="Поменять панели местами">A⇄B</button>
      <button class="btn-ghost diff-mini" id="diffCopyBtn" title="Копировать результат">Копировать</button>
    </div>
    <div class="diff-result" id="diffResult"></div>
  `;

  const aEl = container.querySelector('#diffA');
  const bEl = container.querySelector('#diffB');
  const result = container.querySelector('#diffResult');
  const stats = container.querySelector('#diffStats');

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function lcsOps(a, b) {
    const n = a.length, m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const ops = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { ops.push({ type: 'same', text: a[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: 'removed', text: a[i] }); i++; }
      else { ops.push({ type: 'added', text: b[j] }); j++; }
    }
    while (i < n) { ops.push({ type: 'removed', text: a[i++] }); }
    while (j < m) { ops.push({ type: 'added', text: b[j++] }); }
    return ops;
  }

  function compare() {
    const a = aEl.value.split('\n');
    const b = bEl.value.split('\n');
    const ops = lcsOps(a, b);

    let added = 0, removed = 0, changed = 0, same = 0;
    const lines = [];

    let k = 0;
    while (k < ops.length) {
      const op = ops[k];
      if (op.type === 'same') {
        same++;
        lines.push({ cls: 'diff-same', sign: ' ', text: op.text, no: same });
        k++;
        continue;
      }
      let rm = [];
      while (k < ops.length && ops[k].type === 'removed') { rm.push(ops[k].text); k++; }
      let ad = [];
      while (k < ops.length && ops[k].type === 'added') { ad.push(ops[k].text); k++; }

      const pairCount = Math.min(rm.length, ad.length);
      for (let p = 0; p < pairCount; p++) {
        changed++;
        lines.push({ cls: 'diff-removed', sign: '−', text: rm[p] });
        lines.push({ cls: 'diff-added diff-pair', sign: '+', text: ad[p] });
      }
      for (let p = pairCount; p < rm.length; p++) { removed++; lines.push({ cls: 'diff-removed', sign: '−', text: rm[p] }); }
      for (let p = pairCount; p < ad.length; p++) { added++; lines.push({ cls: 'diff-added', sign: '+', text: ad[p] }); }
    }

    stats.textContent = `изменено: ${changed}, добавлено: ${added}, удалено: ${removed}`;

    result.innerHTML = lines.map(l => `
      <div class="diff-line ${l.cls}">
        <span class="diff-sign">${l.sign}</span><span class="diff-text">${esc(l.text) || '&nbsp;'}</span>
      </div>
    `).join('');
  }

  aEl.addEventListener('input', compare);
  bEl.addEventListener('input', compare);

  hookFileDrop(aEl, { onText: (text, file) => { aEl.value = text; compare(); toast('Загружен: ' + file.name, 'success'); } });
  hookFileDrop(bEl, { onText: (text, file) => { bEl.value = text; compare(); toast('Загружен: ' + file.name, 'success'); } });

  container.querySelector('#diffSwapBtn').addEventListener('click', () => {
    const tmp = aEl.value;
    aEl.value = bEl.value;
    bEl.value = tmp;
    compare();
  });

  container.querySelector('#diffCopyBtn').addEventListener('click', () => {
    const plain = Array.from(result.querySelectorAll('.diff-line'))
      .map(l => l.querySelector('.diff-sign').textContent + ' ' + (l.querySelector('.diff-text').textContent === '\u00a0' ? '' : l.querySelector('.diff-text').textContent))
      .join('\n');
    if (!plain.trim()) return;
    navigator.clipboard.writeText(plain).then(
      () => toast('Результат скопирован', 'info'),
      () => toast('Не удалось скопировать', 'error')
    );
  });
}
