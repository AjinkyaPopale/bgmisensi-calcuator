let _timer = null;

/**
 * @param {string} msg
 * @param {'default'|'success'|'warn'|'error'} type
 * @param {number} duration  ms
 */
export function showToast(msg, type = 'default', duration = 2800) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent  = msg;
  t.dataset.type = type;
  t.classList.add('show');
  clearTimeout(_timer);
  _timer = setTimeout(() => t.classList.remove('show'), duration);
}
