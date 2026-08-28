import { storage } from '../core/storage.js';
import { toast } from '../core/toast.js';

const DEFAULTS = ['Europe/Moscow', 'Europe/London', 'America/New_York', 'Asia/Dubai', 'Asia/Tokyo'];

function allZones() {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      const list = Intl.supportedValuesOf('timeZone');
      if (list && list.length) return list;
    }
  } catch {}
  return DEFAULTS.concat(['Europe/Paris', 'Europe/Berlin', 'Europe/Kyiv', 'Asia/Shanghai', 'Australia/Sydney', 'America/Los_Angeles', 'America/Chicago', 'Pacific/Auckland']);
}

function utcOffset(tz) {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' });
    const part = fmt.formatToParts(new Date()).find(p => p.type === 'timeZoneName');
    const m = /GMT([+-])(\d{2})(?::(\d{2}))?/.exec(part ? part.value : '');
    if (m) {
      const h = parseInt(m[2], 10);
      const min = m[3] ? parseInt(m[3], 10) : 0;
      if (h === 0 && min === 0) return 'UTC';
      const sign = m[1] === '-' ? '−' : '+';
      return min ? `UTC${sign}${h}:${String(min).padStart(2, '0')}` : `UTC${sign}${h}`;
    }
  } catch {}
  const now = new Date();
  const loc = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const diffH = Math.round((loc - now) / 3600000);
  const sign = diffH >= 0 ? '+' : '−';
  return diffH === 0 ? 'UTC' : `UTC${sign}${Math.abs(diffH)}`;
}

function zoneTitle(tz) {
  try {
    return new Intl.DisplayNames(['ru'], { type: 'region' }).of(tz.split('/')[1].replace(/_/g, ' ')) || tz;
  } catch {
    return tz;
  }
}

export function init(container) {
  const saved = storage.get('worldclock', DEFAULTS).filter(tz => typeof tz === 'string');
  let zones = saved.length ? saved : [...DEFAULTS];
  let clockTimer = null;

  container.innerHTML = `
    <h1>Мировое время</h1>
    <p class="subtitle">Часы в разных часовых поясах</p>
    <div class="widget" style="max-width:640px">
      <div class="world-grid" id="worldGrid"></div>
      <div class="world-add">
        <select id="zoneSelect" aria-label="Выбор часового пояса"></select>
        <button class="btn" id="addZoneBtn">Добавить</button>
      </div>
    </div>
  `;

  const grid = container.querySelector('#worldGrid');
  const select = container.querySelector('#zoneSelect');
  const addBtn = container.querySelector('#addZoneBtn');

  function save() { storage.set('worldclock', zones); }

  function render() {
    grid.innerHTML = '';
    zones.forEach(tz => {
      const card = document.createElement('div');
      card.className = 'world-card';
      card.innerHTML = `
        <div class="world-head">
          <span class="world-zone" title="${tz}">${zoneTitle(tz)}</span>
          <span class="world-offset">${utcOffset(tz)}</span>
          <span class="world-move">
            <button class="move-btn" data-move="up" data-tz="${tz}" aria-label="Выше">↑</button>
            <button class="move-btn" data-move="down" data-tz="${tz}" aria-label="Ниже">↓</button>
          </span>
          <button class="del" data-del="${tz}" aria-label="Удалить город">&times;</button>
        </div>
        <div class="world-time" data-clock="${tz}"></div>
        <div class="world-city">${tz.split('/')[0].replace(/_/g, ' ')}</div>
      `;
      grid.appendChild(card);
    });
    tick();

    select.innerHTML = '';
    const current = new Set(zones);
    const list = allZones().filter(tz => !current.has(tz)).sort();
    list.forEach(tz => {
      const opt = document.createElement('option');
      opt.value = tz;
      opt.textContent = tz;
      select.appendChild(opt);
    });
  }

  function tick() {
    const now = new Date();
    grid.querySelectorAll('[data-clock]').forEach(el => {
      const tz = el.dataset.clock;
      try {
        el.textContent = new Intl.DateTimeFormat('ru-RU', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(now);
      } catch {
        el.textContent = '—';
      }
    });
  }

  addBtn.addEventListener('click', () => {
    const tz = select.value;
    if (!tz || zones.includes(tz)) return;
    zones.push(tz);
    save();
    render();
    toast('Часовой пояс добавлен', 'success');
  });

  grid.addEventListener('click', e => {
    const delBtn = e.target.closest('[data-del]');
    if (delBtn) {
      zones = zones.filter(z => z !== delBtn.dataset.del);
      save();
      render();
      toast('Часовой пояс удалён', 'info');
      return;
    }
    const moveBtn = e.target.closest('[data-move]');
    if (!moveBtn) return;
    const i = zones.indexOf(moveBtn.dataset.tz);
    const dir = moveBtn.dataset.move === 'up' ? -1 : 1;
    const j = i + dir;
    if (i === -1 || j < 0 || j >= zones.length) return;
    [zones[i], zones[j]] = [zones[j], zones[i]];
    save();
    render();
  });

  clockTimer = setInterval(tick, 1000);

  document.addEventListener('router:leave', function onLeave(e) {
    if (e.detail.page !== 'worldclock') return;
    document.removeEventListener('router:leave', onLeave);
    clearInterval(clockTimer);
  });

  render();
}
