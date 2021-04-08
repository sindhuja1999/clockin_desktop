const electron = require('electron')
const path = require('path')
const BrowserWindow = electron.remote.BrowserWindow

const saveBtn = document.getElementById('save-passcode')

saveBtn.addEventListener('click', function (event) {
    alert('Save Clicked')
  // Stuff here soon
})