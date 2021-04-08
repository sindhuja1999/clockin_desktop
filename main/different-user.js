const { app, BrowserWindow, Menu } = require('electron');


function differentUserWindow(userState) {
    let win = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            // nodeIntegration: true
        },
    });
    win.maximize()
    win.openDevTools();
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

    if (userState === 'UnAuthorized') {
        win.loadFile(`file:///../unauthorized-user.html`);
    }
    else if (userState === 'Not Registered') {
        win.loadFile(`file:///../different-user.html`);
    }
    win.on('closed', () => {
        win = null;
    });
}

module.exports = differentUserWindow;
