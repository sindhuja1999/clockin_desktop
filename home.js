const { remote } = require('electron');
const authProcess = remote.require('./main/auth-process');

const webContents = remote.getCurrentWebContents();

webContents.on('dom-ready', () => {
});

/* document.getElementById('logout').onclick =  () => {
  let curWindow = remote.getCurrentWindow();
  authProcess.createAuthWindow();
  curWindow.close();
}; */
document.getElementById('logout').onclick = async () => {
  await authProcess.createLogoutWindow();
  let curWindow = remote.getCurrentWindow();
  authProcess.createAuthWindow();
  curWindow.close();
};

