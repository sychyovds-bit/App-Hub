import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';
import { modal } from '../core/modal.js';
import { debounce, hookFileDrop } from '../core/utils.js';

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
    <div class="kanban-tools">
      <button class="btn-ghost" id="kanbanExportMdBtn" title="Скачать доску в Markdown">Экспорт MD</button>
      <button class="btn-ghost" id="kanbanExportJsonBtn" title="Скачать доску в JSON">Экспорт JSON</button>
      <button class="btn-ghost" id="kanbanImportBtn" title="Загрузить доску из JSON-файла">Импорт JSON</button>
    </div>
    <div class="kanban-board" id="kanbanBoard"></div>
  `;

  const boardEl = container.querySelector('#kanbanBoard');

  const save = debounce(() => storage.set('kanban', board), 1000);

  function download(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  container.querySelector('#kanbanExportMdBtn').addEventListener('click', () => {
    const md = board.columns.map(col =>
      `## ${col.title}\n\n` +
      (col.cards.length ? col.cards.map(c => `- ${c.text}`).join('\n') : '_пусто_')
    ).join('\n\n');
    download(md, 'kanban.md', 'text/markdown');
    toast('Markdown сохранён', 'success');
  });

  container.querySelector('#kanbanExportJsonBtn').addEventListener('click', () => {
    download(JSON.stringify(board, null, 2), 'kanban.json', 'application/json');
    toast('JSON сохранён', 'success');
  });

  function validateBoard(data) {
    if (!data || !Array.isArray(data.columns)) return false;
    return data.columns.every(col =>
      typeof col.title === 'string' &&
      Array.isArray(col.cards) &&
      col.cards.every(c => typeof c.text === 'string')
    );
  }

  function importBoard(data) {
    if (!validateBoard(data)) {
      toast('Неверный формат файла доски', 'error');
      return;
    }
    const oldBoard = board;
    board = {
      columns: data.columns.map((col, ci) => ({
        id: typeof col.id === 'string' ? col.id : 'col-' + ci,
        title: col.title,
        cards: col.cards.map((c, i) => ({
          id: typeof c.id === 'string' ? c.id : Date.now().toString(36) + '-' + i,
          text: c.text
        }))
      }))
    };
    storage.set('kanban', board);
    render();
    toast('Доска импортирована', 'success', 5000, {
      actionLabel: 'Отменить',
      onAction: () => {
        board = oldBoard;
        storage.set('kanban', board);
        render();
        toast('Импорт отменён', 'info');
      }
    });
  }

  container.querySelector('#kanbanImportBtn').addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.addEventListener('change', () => {
      const file = inp.files && inp.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try { importBoard(JSON.parse(reader.result)); }
        catch { toast('Некорректный JSON-файл', 'error'); }
      };
      reader.readAsText(file);
    });
    inp.click();
  });

  hookFileDrop(boardEl, {
    onText: (text) => {
      try { importBoard(JSON.parse(text)); }
      catch { toast('Некорректный JSON-файл', 'error'); }
    }
  });

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
            <button class="kanban-card-del" title="Удалить" aria-label="Удалить карточку">&times;</button>
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
                const remIdx = col.cards.findIndex(c => c.id === card.id);
                if (remIdx === -1) return;
                col.cards.splice(remIdx, 1);
                save(); render();
                toast('Карточка удалена', 'info', 5000, {
                  actionLabel: 'Отменить',
                  onAction: () => {
                    col.cards.splice(Math.min(remIdx, col.cards.length), 0, card);
                    save(); render();
                    toast('Карточка восстановлена', 'success');
                  }
                });
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
      body: `<input type="text" id="kanbanNewCard" placeholder="Текст задачи..." aria-label="Текст задачи" style="width:100%">`,
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

  window.addEventListener('pagehide', function onLeave() {
    storage.set('kanban', board);
    window.removeEventListener('pagehide', onLeave);
  });

  render();
}
