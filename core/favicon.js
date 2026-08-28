const ICON_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg fill='%237c6cf0'%3E%3Crect x='3' y='3' width='7' height='7' rx='2'/%3E%3Crect x='14' y='3' width='7' height='7' rx='2'/%3E%3Crect x='3' y='14' width='7' height='7' rx='2'/%3E%3Crect x='14' y='14' width='7' height='7' rx='2'/%3E%3C/g%3E%3C/svg%3E`;

let link = null;
let canvas = null;

function getLink() {
  if (!link) {
    link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
  }
  return link;
}

function getCanvas() {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
  }
  return canvas;
}

export const favicon = {
  set(progress) {
    const c = getCanvas();
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#ede9fe';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(32, 32, 22, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#d8d0f5';
    ctx.stroke();

    if (progress > 0) {
      ctx.beginPath();
      ctx.arc(32, 32, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress));
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#7c6cf0';
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    getLink().href = c.toDataURL('image/png');
  },

  reset() {
    getLink().href = ICON_SVG;
  }
};
