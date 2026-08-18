import { toast } from '../core/toast.js';

export function init(container) {
  const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

  container.innerHTML = `
    <h1>Lorem Ipsum</h1>
    <p class="subtitle">Генератор текста-заполнителя</p>
    <div class="widget" style="max-width:640px">
      <div class="lorem-opts">
        <label>Количество: <input type="number" id="loremCount" value="3" min="1" max="20"></label>
        <label>Тип:
          <select id="loremType">
            <option value="paragraphs">Абзацы</option>
            <option value="sentences">Предложения</option>
            <option value="words">Слова</option>
          </select>
        </label>
        <button class="btn" id="loremGenBtn">Сгенерировать</button>
        <button class="btn-ghost" id="loremCopyBtn">Копировать</button>
      </div>
      <div class="lorem-output" id="loremOutput"></div>
    </div>
  `;

  const output = container.querySelector('#loremOutput');

  function randWord() { return words[Math.floor(Math.random() * words.length)]; }

  function genSentence() {
    const len = 8 + Math.floor(Math.random() * 12);
    let s = Array.from({ length: len }, randWord).join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }

  function genParagraph() {
    const sentences = 3 + Math.floor(Math.random() * 4);
    return Array.from({ length: sentences }, genSentence).join(' ');
  }

  container.querySelector('#loremGenBtn').addEventListener('click', () => {
    const count = parseInt(container.querySelector('#loremCount').value) || 1;
    const type = container.querySelector('#loremType').value;
    let result;
    if (type === 'paragraphs') result = Array.from({ length: count }, genParagraph).join('\n\n');
    else if (type === 'sentences') result = Array.from({ length: count }, genSentence).join(' ');
    else result = Array.from({ length: count }, randWord).join(' ');
    output.textContent = result;
    toast('Текст сгенерирован', 'success');
  });

  container.querySelector('#loremCopyBtn').addEventListener('click', () => {
    if (!output.textContent) return;
    navigator.clipboard.writeText(output.textContent).then(() => toast('Скопировано', 'info'));
  });
}
