const { app, BrowserWindow, Menu, remote, dialog } = require('electron');
var path = require('path');
var log = require('electron-log');

function createAppWindow() {
  let win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      // nodeIntegration: true
    },

  });
  win.maximize();
  var menu = Menu.buildFromTemplate([
    {
      label: 'Clock-In',
      submenu: [
        {
          label: 'Exit',
          click() {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          role: 'reload'
        },
        {
          label: 'Force Reload',
          role: 'forceReload'
        },
        {
          label: 'Actual Size',
          role: 'resetZoom'
        },
        {
          label: 'Zoom In',
          role: 'zoomIn'
        },
        {
          label: 'Zoom Out',
          role: 'zoomOut'
        },
        {
          label: 'Toggle Full Screen',
          role: 'togglefullscreen'
        },
        {
          label: "Toggle Dev Tools",
          accelerator: "F12",
          click: () => {
            win.webContents.toggleDevTools();
          }
        }

      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          role: 'minimize'
        },
        {
          label: 'Zoom',
          role: 'zoom'
        },
        {
          label: 'Close',
          role: 'close'
        }

      ]
    },
    {
      label: 'Help',
      submenu: [

        {
          label: 'Learn More',
          click: async () => {
            const shell = require('electron').shell
            shell.openExternal('https://helpfiles.med.cornell.edu/gm/PerformSearch?SO=rel&format=EU_SearchXML.shtml&mode=EU&illegals=&O1=any&MH=2000&visibletext=timeevents-Display&P1=timeevents%5C-Display')
          }
        },
        {
          label: 'Support Log',
          click: async () => {
            const path = require('path');
            const shell = require('electron').shell
            shell.openPath(path.join(app.getPath('logs'), 'main.log'))
          }
        },
        {
          label: 'About',
          role: 'about'
        },
      ]
    }


  ])
  Menu.setApplicationMenu(menu);

  win.loadFile(`__file_url__:///../index.html`); // Actual UI5App
  win.on('closed', () => {
    win = null;
  });

  const options = {
    type: 'warning',
    buttons: ['Ok'],
    title: 'Warning',
    message: 'Data Sync in progress',
    detail: 'Please wait until the sync is complete before closing the app'
  };

  win.on('close', (e) => {
    console.log('Close button Called', e, global.close)
    if (global.close === 'true') {
      e.preventDefault();
      dialog.showMessageBox(null, options, (response, checkboxChecked) => {
        console.log(response);
      });
    }
    else {
      return e
    }
  });

}

module.exports = createAppWindow;