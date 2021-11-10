const { app, BrowserWindow, Menu } = require('electron');
var path = require('path');
var log = require('electron-log');
const createAppWindow = require('../main/app-process');
const differentUser = require('../main/different-user');
const urlParser = require('url');
const AutenticationService = require('../services/authentication-service');



let win = null;

function createAuthWindow(authenticationService) {
  destroyAuthWin();

  win = new BrowserWindow({
    width: 1200,
    height: 600,
  });
  win.maximize()
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
  win.loadURL(authenticationService.getAuthenticationURL(), { userAgent: 'Chrome' });

  const { session: { webRequest } } = win.webContents;
  const redirectUriPattern = authenticationService.getRedirectUri() + '*';
  console.log(redirectUriPattern);
  const filter = {
    urls: [
      redirectUriPattern
    ]
  };

  webRequest.onBeforeRequest(filter, async ({ url }) => {
    console.log(url);
    const urlParts = urlParser.parse(url, true);
    const query = urlParts.query;
    authenticationService.loadTokens(query.code).then(resp => {
      console.log(resp, 'Myresponse')
      authenticationService.checkEmployeeIdTally(resp).then(employeeData => {
        console.log(employeeData, 'EmployeeData inside the auth process')
        if (employeeData.isReturningUser) {
          createAppWindow();
          destroyAuthWin();
        }
        else if (employeeData.isDifferentUser && employeeData.isUnauthorizedUser) {
          differentUser('UnAuthorized');
          // console.log('====> Error Code', employeeData.errorCode)
          // console.log('========++====> Error message', employeeData.errorMessage)
          destroyAuthWin()
        }
        else if (employeeData.isDifferentUser && !employeeData.isUnauthorizedUser) {
          differentUser('Not Registered');
          destroyAuthWin()
        }
      })
      // createAppWindow();
      // destroyAuthWin();
    })
      .catch(err => {
        console.log(err);
      });


  });

  win.on('closed', () => {
    console.log("closing");
    win = null;
  });
  // win.on('close', function (e) {
  //   // The dialog box below will open, instead of your app closing.
  //   e.preventDefault();
  //   console.log('Close event Clicked in Auth Process')
  //   dialog.showMessageBox({
  //     message: "Close button has been pressed in Auth process!",
  //     buttons: ["OK"]
  //   });
  // });
}

function destroyAuthWin() {
  if (!win) return;
  win.close();
  win = null;
}
function createLogoutWindow() {
  return new Promise(resolve => {
    const logoutWindow = new BrowserWindow({
      show: false,
    });

    logoutWindow.loadURL(authService.getLogOutUrl());

    logoutWindow.on('ready-to-show', async () => {
      logoutWindow.close();
      await authService.logout();
      resolve();
    });
  });
}

module.exports = {
  createAuthWindow,
  createLogoutWindow,
};
