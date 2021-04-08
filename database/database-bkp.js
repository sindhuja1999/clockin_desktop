const os = require('os');
const path = require('path');
const { app } = require('electron');
const Datastore = require('nedb'),
    // db = new Datastore({ filename: '' + os.userInfo().username + '.db', autoload: true });
db = new Datastore({ filename: path.join(process.env.APPDATA, '' + os.userInfo().username + '.db'), autoload: true });


const appName = app.getName();
const getAppPath = path.join(app.getPath('appData'), appName);

console.log('GetApp Path Name', getAppPath);
console.log('appName Name', appName )
console.log('appData Data Data', app.getPath('appData'))



db.loadDatabase(function (err) {
    if (err) {
        console.log("Error in connecting to the database", err)
    }
    else {
        console.log('Connection Succeeded')
    }
})

// function databaseConnection() {
//     global.database = db;
//     return db;
// }

module.exports = db;