const path = require('path') // path for database 
const Datastore = require("nedb") // of course you need NeDB
const crypto = require('crypto') // now is in node default module
const { app } = require('electron');
const os = require('os');

let algorithm = 'aes-256-cbc' // you can choose many algorithm from supported openssl
let secret = 'superSecretKey'
let key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32)

const appName = app.getName();
const getAppPath = path.join(app.getPath('appData'), appName);


const db = new Datastore({
  filename: path.join(getAppPath, os.userInfo().username + '.db'),
  autoload: true,
  afterSerialization(plaintext) {
    const iv = crypto.randomBytes(16)
    const aes = crypto.createCipheriv(algorithm, key, iv)
    let ciphertext = aes.update(plaintext)
    ciphertext = Buffer.concat([iv, ciphertext, aes.final()])
    return ciphertext.toString('base64')
  },
  beforeDeserialization(ciphertext) {
    const ciphertextBytes = Buffer.from(ciphertext, 'base64')
    const iv = ciphertextBytes.slice(0, 16)
    const data = ciphertextBytes.slice(16)
    const aes = crypto.createDecipheriv(algorithm, key, iv)
    let plaintextBytes = Buffer.from(aes.update(data))
    plaintextBytes = Buffer.concat([plaintextBytes, aes.final()])
    return plaintextBytes.toString()
  },
})




db.loadDatabase(function (err) {
    if (err) {
        console.log("Error in connecting to the database", err)
    }
    else {
        console.log('Connection Succeeded')
    }
})

module.exports = db;

