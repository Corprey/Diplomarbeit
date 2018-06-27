const electron = require("electron");
const {app, BrowserWindow, remote} = electron;

const {Application} = require('./application.js');

app.on("ready", () => {

  global.application= new Application();

});

exports.openWindow = filename => {
  //win.currentOpenWindow().close()
  let win = new BrowserWindow({width: 800, height: 600});
  win.loadURL(`file://${__dirname}/` + filename + `.html`);
};
