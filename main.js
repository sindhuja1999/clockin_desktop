const electron = require('electron');
const { app } = require('electron');

const log = require('electron-log')

const { createAuthWindow } = require('./main/auth-process');
const createAppWindow = require('./main/app-process');
const keytar = require('keytar');
const envVariables = require('./env-variables');
const axios = require('axios');
const querystring = require('querystring');
const WcmProvider = require('./providers/wcm');
const moment = require('moment');
const os = require('os');
const AuthenticationService = require('./services/authentication-service');

//server code starts
var express = require('express');
var path = require('path');
var myapp = express();
var debug = require('debug')('timevents:server');
var http = require('http');
const jwt = require('jsonwebtoken')
myapp.use(express.json());
myapp.use(express.urlencoded({ extended: false }));



var port = normalizePort(process.env.PORT || '5858');
myapp.set('port', port);
var server = http.createServer(myapp);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
const appName = app.getName();
const getAppPath = path.join(app.getPath('appData'), appName);

global.close = false;



// console.log('getAppPath', getAppPath, 'appName', appName, 'appData', app.getPath('appData'))
// console.log(os.type(), '1', os.release(), '2', os.platform(), '3')
//server code ends

async function showWindow() {
  try {
    const { clientId, clientSecret, redirectUri } = envVariables.wcm;
    let oAuthprovider = new WcmProvider(axios, querystring, clientId, clientSecret);
    // let authenticationService = new AuthenticationService(keytar, moment, os, oAuthprovider, redirectUri);
    let authenticationService = new AuthenticationService(keytar, moment, os, oAuthprovider, redirectUri, axios);
    authenticationService.getAccessToken((token) => {
      if (token) {
        createAppWindow();
        // authenticationService.increaseAccessTokenValidity()
      } else {
        createAuthWindow(authenticationService);
      }
    });

    electron.powerMonitor.on('lock-screen', () => { app.quit(); });

    // if (electron.powerMonitor.getSystemIdleState(10) == 'idle') {
    //   console.log('State idle');
    //   app.quit()
    // }
    setInterval(() => {
      let a = electron.powerMonitor.getSystemIdleTime()
      if (a == 30 * 60 * 1000) {
        console.log('Entering Idle State of the app, as the app is idle for 30 minutes.')
        app.quit();
      }
    }, 600 * 1000)

  } catch (err) {
    log.error('Error in creating App window', err)
    createAuthWindow();
  }
}


app.on('ready', showWindow);

app.on('window-all-closed', () => {
  app.quit();
});



myapp.get('/electron', (req, res, next) => {

  let osUserName = os.userInfo().username;
  let osHostName = os.hostname();
  let accessTokenAccount = osUserName + "accessToken";
  let refreshTokenAccount = osUserName + 'refreshToken';
  let accessTokenExpiresAccount = osUserName + 'accessTokenExpires';
  let service = 'timeevents';
  keytar.getPassword(service, accessTokenExpiresAccount).then((expiryTime) => {
    console.log('Expiry Time of the token', expiryTime)
  })
  keytar.getPassword(service, accessTokenAccount).then((token) => {
    keytar.getPassword(service, refreshTokenAccount).then((refreshToken) => {
      jwt.sign({
        accessToken: token,
        refreshToken
      }, 'mysecret', function (err, data) {
        if (err) {
          log.error('Error in Signing the Jwt Token', err)
          res.json({
            error: err,
            errorMessage: 'Error in Signing the Jwt Token'
          })
        }
        else if (data) {
          // console.log('Data after jwt conversion', data)
          res.json({
            accessToken: new Buffer(token).toString('base64'),
            refreshToken: new Buffer(refreshToken).toString('base64'),
            osHostName,
            closeParameter: global.close
          })
          // res.send(data)
        }
      })
    }).catch((error) => {
      log.error('Error in Fetching the Refresh Token', error)
      res.json({
        error: error,
        errorMessage: 'Error in Fetching  Refresh Token'
      })
    })
  }).catch((err) => {
    log.error('Error in Fetching the Access Token', err)
    res.json({
      error: err,
      errorMessage: 'Error in Fetching the Access Token'
    })
  })
})


//Service to change the global variable value for closing of the app.
myapp.post('/change-value', (req, res, next) => {

  console.log(req.body.closeFlag, typeof req.body.closeFlag)
  global.close = req.body.closeFlag;
  res.json({
    statusCode: 1,
    statusMessage: 'Updated',
    data: global.close
  })


})

// catch 404 and forward to error handler
myapp.use(function (req, res, next) {
  next(createError(404));
});

// error handler
myapp.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      log.error(bind + ' requires elevated privileges')
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      log.error(bind + ' is already in use')
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  console.log("Server running on ", port)
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

//module.exports = tokenapp;
