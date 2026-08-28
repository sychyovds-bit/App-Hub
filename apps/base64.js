import { toast } from '../core/toast.js';
import { hookFileDrop, readFileAsDataURL } from '../core/utils.js';

export function init(container) {
  container.innerHTML = `
    <h1>Base64</h1>
    <p class="subtitle">Кодирование и декодирование текста</p>
    <div class="widget" style="max-width:600px">
      <div class="b64-row">
        <textarea id="b64Input" placeholder="Введите текст..."></textarea>
        <div class="b64-actions">
          <button class="btn" id="b64EncodeBtn">Кодировать</button>
          <button class="btn" id="b64DecodeBtn">Декодировать</button>
          <button class="btn-ghost" id="b64SwapBtn">Поменять местами</button>
        </div>
        <textarea id="b64Output" placeholder="Результат..." readonly></textarea>
        <button class="btn-ghost" id="b64CopyBtn" style="align-self:flex-start">Копировать результат</button>
      </div>
    </div>
  `;

  const input = container.querySelector('#b64Input');
  const output = container.querySelector('#b64Output');

  hookFileDrop(input, {
    onFile: async (file) => {
      const dataUrl = await readFileAsDataURL(file);
      input.value = dataUrl;
      output.value = dataUrl;
      toast('Изображение загружено как data URL', 'success');
    },
    onText: (text, file) => {
      input.value = text;
      try {
        output.value = btoa(unescape(encodeURIComponent(text)));
        toast('Файл ' + file.name + ' закодирован', 'success');
      } catch { toast('Ошибка кодирования', 'error'); }
    }
  });

  container.querySelector('#b64EncodeBtn').addEventListener('click', () => {
    try {
      output.value = btoa(unescape(encodeURIComponent(input.value)));
      toast('Закодировано', 'success');
    } catch { toast('Ошибка кодирования', 'error'); }
  });

  container.querySelector('#b64DecodeBtn').addEventListener('click', () => {
    try {
      output.value = decodeURIComponent(escape(atob(input.value.trim())));
      toast('Декодировано', 'success');
    } catch { toast('Некорректный Base64', 'error'); }
  });

  container.querySelector('#b64SwapBtn').addEventListener('click', () => {
    const tmp = input.value;
    input.value = output.value;
    output.value = tmp;
  });

  container.querySelector('#b64CopyBtn').addEventListener('click', () => {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(() => toast('Скопировано', 'info'));
  });
}
