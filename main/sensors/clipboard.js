const { clipboard } = require('electron');
let last = '';
let debounceTimer = null;
const DEBOUNCE_MS = 1500;

function watchClipboard(callback) {
  setInterval(() => {
    const text = clipboard.readText();
    if (text && text !== last && text.length > 40) {
      last = text;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        callback(text);
      }, DEBOUNCE_MS);
    }
  }, 500);
}

module.exports = { watchClipboard };
