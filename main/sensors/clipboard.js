const { clipboard } = require('electron');
let last = '';
function watchClipboard(callback) {
  setInterval(() => {
    const text = clipboard.readText();
    if (text && text !== last && text.length > 40) {
      last = text;
      callback(text);
    }
  }, 500);
}
module.exports = { watchClipboard };
