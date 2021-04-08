var keytar = require('../build/Release/keytar.node')
// let libname = 'keytar'
{/* <script type="module" src="../build/Release/keytar.node"></script> */ }
// var keytar1 = import keytar;
// import * as keytar from "../build/Release/keytar.node";
// import { keytar } from "../build/Release/keytar.node";
// import "keytar";
{/* <script type="module" src="../build/Release/keytar.node"></script> */}
// import { keytar } from "../build/Release/keytar.node";


// import keytar from '../build/Release/keytar.node';

// require([libname], function(keytar){
//   console.log('Keytar js file', keytar)
//   // do something with fooModule
// })

function checkRequired(val, name) {
  if (!val || val.length <= 0) {
    throw new Error(name + ' is required.');
  }
}

module.exports = {
  getPassword: function (service, account) {
    checkRequired(service, 'Service')
    checkRequired(account, 'Account')

    return keytar.getPassword(service, account)
  },

  setPassword: function (service, account, password) {
    checkRequired(service, 'Service')
    checkRequired(account, 'Account')
    checkRequired(password, 'Password')

    return keytar.setPassword(service, account, password)
  },

  deletePassword: function (service, account) {
    checkRequired(service, 'Service')
    checkRequired(account, 'Account')

    return keytar.deletePassword(service, account)
  },

  findPassword: function (service) {
    checkRequired(service, 'Service')

    return keytar.findPassword(service)
  },

  findCredentials: function (service) {
    checkRequired(service, 'Service')

    return keytar.findCredentials(service)
  }
}
