const activeWin = require('active-win');
async function getActiveWindowTitle() {
  const result = await activeWin();
  return result?.title || 'Unknown';
}
module.exports = { getActiveWindowTitle };
