import { toast } from '../core/toast.js';
import { hookFileDrop } from '../core/utils.js';

export function init(container) {
  container.innerHTML = `
    <h1>JSON-форматтер</h1>
    <p class="subtitle">Форматирование, валидация и минификация JSON · перетащите .json-файл</p>
    <div class="widget" style="max-width:640px">
      <textarea class="json-area" id="jsonInput" placeholder='Вставьте JSON сюда... {"key": "value"}' aria-label="Исходный JSON"></textarea>
      <div class="json-actions">
        <button class="btn" id="jsonFormatBtn">Форматировать</button>
        <button class="btn-ghost" id="jsonMinifyBtn">Минифицировать</button>
        <button class="btn-ghost" id="jsonValidateBtn">Проверить</button>
        <button class="btn-ghost" id="jsonCopyBtn">Копировать результат</button>
      </div>
      <div class="json-error" id="jsonError" hidden></div>
      <div class="json-output" id="jsonOutput" aria-live="polite"></div>
    </div>
  `;

  const input = container.querySelector('#jsonInput');
  const output = container.querySelector('#jsonOutput');
  const error = container.querySelector('#jsonError');

  hookFileDrop(input, {
    onText: (text, file) => {
      input.value = text;
      try {
        const parsed = JSON.parse(text);
        output.textContent = JSON.stringify(parsed, null, 2);
        hideError();
        toast('Файл ' + file.name + ' отформатирован', 'success');
      } catch (e) {
        showError('Ошибка: ' + e.message);
      }
    }
  });

  function showError(msg) {
    error.textContent = msg;
    error.hidden = false;
  }

  function hideError() { error.hidden = true; }

  container.querySelector('#jsonFormatBtn').addEventListener('click', () => {
    try {
      const parsed = JSON.parse(input.value);
      output.textContent = JSON.stringify(parsed, null, 2);
      hideError();
      toast('JSON отформатирован', 'success');
    } catch (e) {
      showError('Ошибка: ' + e.message);
    }
  });

  container.querySelector('#jsonMinifyBtn').addEventListener('click', () => {
    try {
      const parsed = JSON.parse(input.value);
      output.textContent = JSON.stringify(parsed);
      hideError();
      toast('JSON минифицирован', 'success');
    } catch (e) {
      showError('Ошибка: ' + e.message);
    }
  });

  container.querySelector('#jsonValidateBtn').addEventListener('click', () => {
    try {
      JSON.parse(input.value);
      hideError();
      toast('JSON валиден', 'success');
    } catch (e) {
      showError('Невалидный JSON: ' + e.message);
      toast('JSON содержит ошибки', 'error');
    }
  });

  container.querySelector('#jsonCopyBtn').addEventListener('click', () => {
    if (!output.textContent) return;
    navigator.clipboard.writeText(output.textContent).then(() => {
      toast('Скопировано в буфер обмена', 'info');
    });
  });
}
