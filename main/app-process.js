const { app, BrowserWindow, Menu, remote, dialog } = require('electron');




function createAppWindow() {
  let win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      // nodeIntegration: true
    },

  });
  win.maximize()
  // win.openDevTools();
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
          label: 'About',
          click: async () => {
            const shell = require('electron').shell
            shell.openExternal('https://helpfiles.med.cornell.edu/gm/PerformSearch?SO=rel&format=EU_SearchXML.shtml&mode=EU&illegals=&O1=any&MH=2000&visibletext=timeevents-Display&P1=timeevents%5C-Display')
          }
        }
      ]
    }


  ])
  Menu.setApplicationMenu(menu);

  // win.loadFile(`file:///../index.html`);
  win.loadFile(`__file_url__:///../index.html`);
  // win.loadURL(`file:///../index.html`);
  // win.loadURL('http://localhost:49162/electron', { userAgent: 'Chrome' });
  // win.loadFile(`file:///../maps.html`);
  // win.loadFile(`file:///../database/test.html`);
  win.on('closed', () => {
    win = null;
  });
  // win.on('close', function (e) {
  //   // The dialog box below will open, instead of your app closing.
  //   e.preventDefault();
  //   console.log('Close event Clicked')
  //   dialog.showMessageBox({
  //     message: "Close button has been pressed!",
  //     buttons: ["OK"]
  //   });
  // });
  // win.onbeforeunload = (e) => {
  //   var answer = confirm('Do you really want to close the application?');
  //   e.returnValue = answer;  // this will *prevent* the closing no matter what value is passed
  //   if (answer) { win.destroy(); }  // this will close the app
  // };
}

module.exports = createAppWindow;
