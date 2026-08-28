function supported() {
  return 'Notification' in window;
}

export const notify = {
  async request() {
    if (!supported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  },

  send(title, body = '') {
    if (!supported() || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png'
      });
    } catch {}
  }
};
