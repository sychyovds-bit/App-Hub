import { toast } from '../core/toast.js';
import { storage } from '../core/storage.js';

export function init(container) {
  container.innerHTML = `
    <h1>Палитра цветов</h1>
    <p class="subtitle">Подбор, конвертация и генерация палитр</p>
    <div class="widget" style="max-width:600px">
      <div class="color-main">
        <div class="color-preview" id="colorPreview"></div>
        <div class="color-inputs">
          <div class="row">
            <label>Picker</label>
            <input type="color" id="colorPicker" value="#7c6cf0">
          </div>
          <div class="row">
            <label>HEX</label>
            <input type="text" id="colorHex" value="#7c6cf0" maxlength="7">
          </div>
          <div class="row">
            <label>RGB</label>
            <input type="text" id="colorRgb" readonly>
          </div>
          <div class="row">
            <label>HSL</label>
            <input type="text" id="colorHsl" readonly>
          </div>
        </div>
      </div>
      <div class="color-values">
        <div class="val-row"><code id="valHex"></code><button data-copy="valHex">Копировать</button></div>
        <div class="val-row"><code id="valRgb"></code><button data-copy="valRgb">Копировать</button></div>
        <div class="val-row"><code id="valHsl"></code><button data-copy="valHsl">Копировать</button></div>
      </div>
      <h3 style="margin-top:20px;font-size:14px;">Последние цвета</h3>
      <div class="recent-row" id="recentRow"></div>
      <h3 style="margin-top:20px;font-size:14px;">Случайная палитра</h3>
      <div class="palette-strip" id="paletteStrip"></div>
      <button class="btn-ghost" id="genPaletteBtn" style="margin-top:12px">Сгенерировать палитру</button>
      <h3 style="margin-top:20px;font-size:14px;">Схемы гармонии</h3>
      <div id="harmonies"></div>
    </div>
  `;

  const preview = container.querySelector('#colorPreview');
  const picker = container.querySelector('#colorPicker');
  const hexInput = container.querySelector('#colorHex');
  const rgbInput = container.querySelector('#colorRgb');
  const hslInput = container.querySelector('#colorHsl');
  const valHex = container.querySelector('#valHex');
  const valRgb = container.querySelector('#valRgb');
  const valHsl = container.querySelector('#valHsl');
  const strip = container.querySelector('#paletteStrip');
  const recentRow = container.querySelector('#recentRow');
  let recent = storage.get('recent-colors', []).filter(c => /^#[0-9a-fA-F]{6}$/.test(c));

  function addRecent(hex) {
    const h = hex.toLowerCase();
    recent = [h, ...recent.filter(c => c !== h)].slice(0, 10);
    storage.set('recent-colors', recent);
    renderRecent();
  }

  function renderRecent() {
    recentRow.innerHTML = '';
    if (!recent.length) {
      recentRow.innerHTML = '<span style="color:var(--muted);font-size:12px">Пока пусто</span>';
      return;
    }
    recent.forEach(color => {
      const sw = document.createElement('div');
      sw.className = 'palette-swatch';
      sw.style.background = color;
      sw.title = color;
      sw.addEventListener('click', () => { update(color); toast('Цвет выбран: ' + color, 'info'); });
      recentRow.appendChild(sw);
    });
  }

  renderRecent();

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function update(hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    const { r, g, b } = hexToRgb(hex);
    const { h, s, l } = rgbToHsl(r, g, b);

    preview.style.background = hex;
    picker.value = hex;
    hexInput.value = hex;
    rgbInput.value = `rgb(${r}, ${g}, ${b})`;
    hslInput.value = `hsl(${h}, ${s}%, ${l}%)`;
    valHex.textContent = hex;
    valRgb.textContent = `rgb(${r}, ${g}, ${b})`;
    valHsl.textContent = `hsl(${h}, ${s}%, ${l}%)`;
    addRecent(hex);
    renderHarmonies(h, s, l);
  }

  picker.addEventListener('input', () => update(picker.value));
  hexInput.addEventListener('input', () => update(hexInput.value));

  container.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = document.getElementById(btn.dataset.copy).textContent;
      navigator.clipboard.writeText(text).then(() => toast('Скопировано: ' + text, 'info'));
    });
  });

  function genPalette() {
    strip.innerHTML = '';
    const baseHue = Math.random() * 360;
    for (let i = 0; i < 6; i++) {
      const h = (baseHue + i * 30 + Math.random() * 15) % 360;
      const s = 50 + Math.random() * 30;
      const l = 40 + Math.random() * 30;
      const color = hslToHex(h, s, l);
      const swatch = document.createElement('div');
      swatch.className = 'palette-swatch';
      swatch.style.background = color;
      swatch.title = color;
      swatch.addEventListener('click', () => {
        update(color);
        toast('Цвет выбран: ' + color, 'info');
      });
      strip.appendChild(swatch);
    }
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  container.querySelector('#genPaletteBtn').addEventListener('click', genPalette);

  const harmoniesEl = container.querySelector('#harmonies');

  function harmonyScheme(h, s, l) {
    return [
      { name: 'Комплементарная', shifts: [180] },
      { name: 'Аналоговая', shifts: [-30, 30] },
      { name: 'Триада', shifts: [-120, 120] },
      { name: 'Монохром', lightness: [Math.max(l - 25, 10), Math.min(l + 25, 90)] }
    ];
  }

  function renderHarmonies(h, s, l) {
    harmoniesEl.innerHTML = '';
    harmonyScheme(h, s, l).forEach(scheme => {
      let colors;
      if (scheme.lightness) {
        colors = [hslToHex(h, s, scheme.lightness[0]), hslToHex(h, s, l), hslToHex(h, s, scheme.lightness[1])];
      } else {
        colors = scheme.shifts.map(d => hslToHex((h + d + 360) % 360, s, l));
        colors = [hslToHex(h, s, l), ...colors];
      }
      const row = document.createElement('div');
      row.className = 'harmony-row';
      row.innerHTML = `<span class="harmony-name">${scheme.name}</span>
        <div class="palette-strip"></div>`;
      const stripEl = row.querySelector('.palette-strip');
      colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        swatch.style.background = color;
        swatch.title = color;
        swatch.addEventListener('click', () => {
          navigator.clipboard.writeText(color).then(() => toast('Скопировано: ' + color, 'info'));
        });
        stripEl.appendChild(swatch);
      });
      harmoniesEl.appendChild(row);
    });
  }

  genPalette();
  update('#7c6cf0');
}
