const keytar = require('keytar')
const os = require('os')

console.log(os.userInfo().username, "accessToken", os.userInfo().username + "accessToken")
console.log(os.userInfo().username, "refreshToken", os.userInfo().username + "refreshToken")
let osUserName = os.userInfo().username;
let accessTokenAccount = osUserName + "accessToken";
let refreshTokenAccount = osUserName + 'refreshToken';
// let service = 'electron-openid-oauth'
let service = 'timeevents'

let myarr = [accessTokenAccount, refreshTokenAccount, osUserName + 'accessTokenExpires', osUserName + 'EmployeeId']
myarr.map((record) => {
    let account = record;
    keytar.deletePassword(service, account).then((data) => {
        console.log('Account' + account + ' is deleted')
    }).catch((error) => {
        console.log('Unable to delete account' + account + ' from the keychain')
    })
})


const http = require('http');

var options = {
  host: 'ipv4bot.whatismyipaddress.com',
  port: 80,
  path: '/'
};

http.get(options, function(res) {
  console.log("status: " + res.statusCode);

  res.on("data", function(chunk) {
    console.log("BODY: " + chunk);
  });
}).on('error', function(e) {
  console.log("error: " + e.message);
});