export function debounce(fn, delay = 200) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, interval = 200) {
  let last = 0;
  let timer;
  return function (...args) {
    const now = Date.now();
    const remaining = interval - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = now;
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function hookFileDrop(el, { onFile, onText }) {
  const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  el.addEventListener('dragover', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    el.classList.add('drop-hint');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drop-hint'));
  el.addEventListener('drop', async (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    el.classList.remove('drop-hint');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    try {
      if (onFile && (file.type.startsWith('image/') || !onText)) {
        onFile(file);
      } else if (onText) {
        onText(await readTextFile(file), file);
      }
    } catch (err) {
      console.error('[AppHub] file drop:', err);
    }
  });
}
