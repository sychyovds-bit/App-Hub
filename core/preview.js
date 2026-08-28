import { registry } from './registry.js';
import { icons } from './icons.js';

const PREVIEW_EXCLUDE = new Set(['snake']);

let panel = null;
let hoverTimer = null;
let pendingCard = null;
let currentCard = null;
const contents = new Map();

function ensurePanel() {
  if (panel) return;
  panel = document.createElement('div');
  panel.className = 'preview-pop';
  document.body.appendChild(panel);
}

function position() {
  const card = currentCard;
  if (!card || !panel) return;
  const rect = card.getBoundingClientRect();
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  let x = rect.right + 12;
  if (x + pw > window.innerWidth - 12) x = rect.left - pw - 12;
  if (x < 12) x = Math.max(12, rect.left + rect.width / 2 - pw / 2);
  let y = rect.bottom - ph;
  if (y < 12) y = 12;
  if (y + ph > window.innerHeight - 12) y = window.innerHeight - ph - 12;
  panel.style.left = x + 'px';
  panel.style.top = y + 'px';
}

function hide() {
  clearTimeout(hoverTimer);
  hoverTimer = null;
  pendingCard = null;
  if (currentCard) {
    currentCard = null;
    if (panel) panel.classList.remove('visible');
  }
}

function fallbackInner(app) {
  const el = document.createElement('div');
  el.className = 'preview-fallback';
  el.innerHTML = `
    <div class="icon-wrap">${icons[app.icon] || ''}</div>
    <h3>${app.title}</h3>
    <p>${app.description}</p>
  `;
  return el;
}

function makeFallback(app) {
  const wrap = document.createElement('div');
  wrap.className = 'preview-inner';
  wrap.appendChild(fallbackInner(app));
  return wrap;
}

async function show(card) {
  const id = card.dataset.page;
  const app = registry.getById(id);
  if (!app) return;

  ensurePanel();
  currentCard = card;
  panel.classList.add('visible');

  if (contents.has(id)) {
    panel.replaceChildren(contents.get(id));
    position();
    return;
  }

  if (PREVIEW_EXCLUDE.has(id)) {
    const el = makeFallback(app);
    contents.set(id, el);
    panel.replaceChildren(el);
    position();
    return;
  }

  try {
    const module = await registry.loadApp(id);
    if (currentCard !== card) return;
    const el = document.createElement('div');
    el.className = 'preview-inner';
    if (module && module.init) {
      module.init(el);
    } else {
      el.appendChild(fallbackInner(app));
    }
    contents.set(id, el);
    panel.replaceChildren(el);
    position();
  } catch {
    if (currentCard === card) {
      const el = makeFallback(app);
      contents.set(id, el);
      panel.replaceChildren(el);
      position();
    }
  }
}

export function initHoverPreview() {
  document.addEventListener('pointerover', (e) => {
    const card = e.target.closest('.card[data-page]');
    if (!card || card === currentCard || card === pendingCard) return;
    if (!registry.getById(card.dataset.page)) return;
    registry.preload(card.dataset.page);
    clearTimeout(hoverTimer);
    pendingCard = card;
    hoverTimer = setTimeout(() => {
      hoverTimer = null;
      const target = pendingCard;
      pendingCard = null;
      if (target) show(target);
    }, 350);
  });

  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.card[data-page]');
    if (!card) return;
    if (e.relatedTarget && card.contains(e.relatedTarget)) return;
    if (card === pendingCard) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
      pendingCard = null;
    } else if (card === currentCard) {
      hide();
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.card[data-page]')) hide();
  });

  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
}
