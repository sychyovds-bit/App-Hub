import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';
import { hookFileDrop } from '../core/utils.js';

export function init(container) {
  container.innerHTML = `
    <h1>Markdown-превью</h1>
    <p class="subtitle">Живой рендер Markdown разметки · перетащите .md-файл</p>
    <div class="md-wrap">
      <div class="md-pane">
        <div class="md-pane-title">Исходник
          <span class="md-actions">
            <button class="btn-ghost md-mini-btn" id="mdOpenBtn" title="Открыть файл">Файл</button>
            <button class="btn-ghost md-mini-btn" id="mdCopyHtmlBtn" title="Копировать HTML">HTML</button>
          </span>
        </div>
        <textarea id="mdInput" class="md-input" spellcheck="false"></textarea>
      </div>
      <div class="md-pane">
        <div class="md-pane-title">Результат</div>
        <div id="mdOutput" class="md-output" aria-live="polite"></div>
      </div>
    </div>
  `;

  const input = container.querySelector('#mdInput');
  const output = container.querySelector('#mdOutput');

  const saved = storage.get('markdown-src', null);
  input.value = saved !== null ? saved : `# Заголовок

Текст с **жирным** и *курсивом*.

- список работает

\`inline код\`

[Ссылка](https://example.com)`;

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  function render(src) {
    const lines = esc(src).split('\n');
    let html = '';
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (/^```/.test(line)) {
        const code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        html += `<pre><code>${code.join('\n')}</code></pre>`;
        continue;
      }

      const h = line.match(/^(#{1,6})\s+(.*)/);
      if (h) { html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; i++; continue; }

      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html += '<hr>'; i++; continue; }

      if (/^\s*&gt;\s?/.test(line)) {
        const quote = [];
        while (i < lines.length && /^\s*&gt;\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^\s*&gt;\s?/, ''));
          i++;
        }
        html += `<blockquote>${inline(quote.join('<br>'))}</blockquote>`;
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          items.push(`<li>${inline(lines[i].replace(/^\s*[-*+]\s+/, ''))}</li>`);
          i++;
        }
        html += `<ul>${items.join('')}</ul>`;
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`);
          i++;
        }
        html += `<ol>${items.join('')}</ol>`;
        continue;
      }

      if (line.trim() === '') { i++; continue; }

      const para = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+\.\s|\s*&gt;|\s*(-{3,}|\*{3,})\s*$)/.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      html += `<p>${inline(para.join(' '))}</p>`;
    }

    return html;
  }

  function update() {
    output.innerHTML = render(input.value);
    const src = input.value;
    clearTimeout(update.saveTimer);
    update.saveTimer = setTimeout(() => storage.set('markdown-src', src), 600);
  }

  input.addEventListener('input', update);

  const pane = input.closest('.md-pane') || input;
  hookFileDrop(pane, {
    onText: (text, file) => {
      input.value = text;
      update();
      toast('Загружен файл: ' + file.name, 'success');
    }
  });

  container.querySelector('#mdOpenBtn').addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.md,.markdown,.txt,text/plain';
    inp.addEventListener('change', () => {
      const file = inp.files && inp.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        input.value = reader.result;
        update();
        toast('Загружен файл: ' + file.name, 'success');
      };
      reader.readAsText(file);
    });
    inp.click();
  });

  container.querySelector('#mdCopyHtmlBtn').addEventListener('click', () => {
    if (!output.innerHTML) return;
    navigator.clipboard.writeText(output.innerHTML).then(
      () => toast('HTML скопирован', 'info'),
      () => toast('Не удалось скопировать', 'error')
    );
  });

  update();
}
