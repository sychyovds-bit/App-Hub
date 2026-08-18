import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';
import { modal } from '../core/modal.js';

export function init(container) {
  let board = storage.get('kanban', {
    columns: [
      { id: 'todo', title: 'К выполнению', cards: [] },
      { id: 'progress', title: 'В работе', cards: [] },
      { id: 'done', title: 'Готово', cards: [] }
    ]
  });

  let draggedCard = null;
  let dragSourceCol = null;

  container.innerHTML = `
    <h1>Канбан-доска</h1>
    <p class="subtitle">Перетаскивайте карточки между колонками</p>
    <div class="kanban-board" id="kanbanBoard"></div>
  `;

  const boardEl = container.querySelector('#kanbanBoard');

  function save() { storage.set('kanban', board); }

  function render() {
    boardEl.innerHTML = '';
    board.columns.forEach(col => {
      const colEl = document.createElement('div');
      colEl.className = 'kanban-col';
      colEl.dataset.colId = col.id;

      colEl.innerHTML = `
        <div class="kanban-col-header">
          <h3>${col.title}</h3>
          <span class="kanban-count">${col.cards.length}</span>
        </div>
        <div class="kanban-cards" data-col-id="${col.id}"></div>
        <button class="kanban-add-btn" data-col-id="${col.id}">+ Добавить</button>
      `;

      const cardsEl = colEl.querySelector('.kanban-cards');

      col.cards.forEach((card, idx) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'kanban-card';
        cardEl.draggable = true;
        cardEl.dataset.cardId = card.id;
        cardEl.dataset.colId = col.id;
        cardEl.dataset.idx = idx;

        cardEl.innerHTML = `
          <div class="kanban-card-text">${card.text.replace(/</g, '&lt;')}</div>
          <div class="kanban-card-actions">
            <button class="kanban-card-del" title="Удалить">&times;</button>
          </div>
        `;

        // Drag events
        cardEl.addEventListener('dragstart', (e) => {
          draggedCard = card;
          dragSourceCol = col.id;
          cardEl.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });
        cardEl.addEventListener('dragend', () => {
          cardEl.classList.remove('dragging');
          draggedCard = null;
        });

        // Delete
        cardEl.querySelector('.kanban-card-del').addEventListener('click', () => {
          modal({
            title: 'Удалить карточку?',
            body: `<p>"${card.text.replace(/</g, '&lt;')}"</p>`,
            actions: [
              { label: 'Удалить', class: 'btn', onClick: () => {
                col.cards.splice(idx, 1);
                save(); render();
                toast('Карточка удалена', 'info');
              }},
              { label: 'Отмена', class: 'btn-ghost' }
            ]
          });
        });

        cardsEl.appendChild(cardEl);
      });

      // Drop zone
      cardsEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        cardsEl.classList.add('drag-over');
      });
      cardsEl.addEventListener('dragleave', () => {
        cardsEl.classList.remove('drag-over');
      });
      cardsEl.addEventListener('drop', (e) => {
        e.preventDefault();
        cardsEl.classList.remove('drag-over');
        if (!draggedCard) return;

        // Удалить из исходной колонки
        const srcCol = board.columns.find(c => c.id === dragSourceCol);
        if (srcCol) {
          const i = srcCol.cards.findIndex(c => c.id === draggedCard.id);
          if (i !== -1) srcCol.cards.splice(i, 1);
        }

        // Добавить в целевую
        col.cards.push(draggedCard);
        save(); render();
        toast(`Перемещено в "${col.title}"`, 'success');
      });

      // Add button
      colEl.querySelector('.kanban-add-btn').addEventListener('click', () => {
        showAddModal(col);
      });

      boardEl.appendChild(colEl);
    });
  }

  function showAddModal(col) {
    const m = modal({
      title: 'Новая карточка',
      body: `<input type="text" id="kanbanNewCard" placeholder="Текст задачи..." style="width:100%">`,
      actions: [
        { label: 'Добавить', class: 'btn', onClick: () => {
          const input = document.getElementById('kanbanNewCard');
          const text = input.value.trim();
          if (!text) return;
          col.cards.push({ id: Date.now().toString(), text });
          save(); render();
          toast('Карточка добавлена', 'success');
        }},
        { label: 'Отмена', class: 'btn-ghost' }
      ]
    });
    setTimeout(() => document.getElementById('kanbanNewCard')?.focus(), 100);
  }

  render();
}
