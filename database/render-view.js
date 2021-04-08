const { remote } = require("electron");
const testFunction = require('./test');


const webContents = remote.getCurrentWebContents();

webContents.on("dom-ready", () => {
    document.getElementById("entities").innerText = 'No Entities Found';
    document.getElementById("entity").onclick = async () => {
        testFunction()

    };
});


