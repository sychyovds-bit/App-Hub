import { toast } from '../core/toast.js';

export function init(container) {
  container.innerHTML = `
    <h1>Генератор паролей</h1>
    <p class="subtitle">Создавайте надёжные случайные пароли</p>
    <div class="widget">
      <div class="pwd-output" id="pwdOutput">Нажмите «Сгенерировать»</div>
      <div class="pwd-strength" id="pwdStrength">
        <div class="pwd-strength-bar"><div class="pwd-strength-fill" id="pwdStrengthFill"></div></div>
        <span class="pwd-strength-label" id="pwdStrengthLabel"></span>
      </div>
      <div class="conv-row" style="margin-top:16px">
        <label style="font-size:14px;white-space:nowrap">Длина: <b id="pwdLenVal">16</b></label>
        <input type="range" id="pwdLen" min="6" max="40" value="16" style="flex:1;accent-color:var(--accent)">
      </div>
      <div class="pwd-opts">
        <label><input type="checkbox" id="pwdUpper" checked> Заглавные буквы (A-Z)</label>
        <label><input type="checkbox" id="pwdLower" checked> Строчные буквы (a-z)</label>
        <label><input type="checkbox" id="pwdDigits" checked> Цифры (0-9)</label>
        <label><input type="checkbox" id="pwdSymbols" checked> Спецсимволы (!@#$...)</label>
      </div>
      <div style="display:flex;gap:10px;margin-top:18px">
        <button class="btn" id="pwdGenBtn">Сгенерировать</button>
        <button class="btn-ghost" id="pwdCopyBtn">Копировать</button>
      </div>
    </div>
  `;

  const output = container.querySelector('#pwdOutput');
  const lenSlider = container.querySelector('#pwdLen');
  const lenVal = container.querySelector('#pwdLenVal');
  const strengthFill = container.querySelector('#pwdStrengthFill');
  const strengthLabel = container.querySelector('#pwdStrengthLabel');

  lenSlider.addEventListener('input', () => { lenVal.textContent = lenSlider.value; });

  function calcStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return Math.min(score, 7);
  }

  function updateStrength(pwd) {
    const score = calcStrength(pwd);
    const percent = (score / 7) * 100;
    const colors = ['#f87171', '#f87171', '#fbbf24', '#fbbf24', '#34d399', '#34d399', '#10b981', '#10b981'];
    const labels = ['Очень слабый', 'Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Сильный', 'Очень сильный', 'Максимальный'];

    strengthFill.style.width = percent + '%';
    strengthFill.style.background = colors[score];
    strengthLabel.textContent = labels[score];
    strengthLabel.style.color = colors[score];
  }

  container.querySelector('#pwdGenBtn').addEventListener('click', () => {
    const len = parseInt(lenSlider.value);
    let chars = '';
    if (container.querySelector('#pwdLower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (container.querySelector('#pwdUpper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (container.querySelector('#pwdDigits').checked) chars += '0123456789';
    if (container.querySelector('#pwdSymbols').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) { toast('Выберите хотя бы один набор символов', 'warning'); return; }

    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    const pwd = [...arr].map(n => chars[n % chars.length]).join('');
    output.textContent = pwd;
    updateStrength(pwd);
    toast('Пароль сгенерирован', 'success');
  });

  container.querySelector('#pwdCopyBtn').addEventListener('click', () => {
    if (output.textContent === 'Нажмите «Сгенерировать»') return;
    navigator.clipboard.writeText(output.textContent).then(() => {
      toast('Скопировано в буфер обмена', 'info');
    });
  });
}
