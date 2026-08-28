import { modal } from './modal.js';
import { storage } from './storage.js';

const body = `
  <p style="margin-bottom:12px">Все подсказки AppHub в одном месте.</p>
  <table class="help-table">
    <tr><th colspan="2">Горячие клавиши</th></tr>
    <tr><td><kbd>Alt</kbd>+<kbd>1…9</kbd></td><td>Переключение между категориями</td></tr>
    <tr><td><kbd>Alt</kbd>+<kbd>0</kbd></td><td>На главную</td></tr>
    <tr><td><kbd>Ctrl</kbd>+<kbd>K</kbd></td><td>Палитра команд — быстрый поиск по приложениям</td></tr>
    <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>Открыть карточку под курсором</td></tr>
    <tr><td><kbd>Esc</kbd></td><td>Закрыть модальное окно</td></tr>
    <tr><th colspan="2">Фишки портала</th></tr>
    <tr><td>⭐</td><td>Закрепите приложение — появится первым в списке избранного</td></tr>
    <tr><td>Undo</td><td>Удалили задачу/карточку — нажмите «Отменить» в уведомлении в течение 5 секунд</td></tr>
    <tr><td>Превью</td><td>Наведите курсор на карточку — увидите живой предпросмотр приложения</td></tr>
    <tr><td>Облако</td><td>Синхронизация данных между устройствами через Supabase</td></tr>
    <tr><td>Возврат</td><td>Кнопка «← Назад» в хлебных крошках возвращает на предыдущую страницу</td></tr>
  </table>
`;

export const help = {
  show() {
    modal({
      title: 'Подсказки и горячие клавиши',
      body,
      actions: [
        { label: 'Понятно', class: 'btn' }
      ]
    });
  },

  showOnce() {
    if (storage.get('helpShown', false)) return;
    storage.set('helpShown', true);
    setTimeout(() => this.show(), 400);
  },

  init(btnId) {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener('click', () => this.show());
  }
};
