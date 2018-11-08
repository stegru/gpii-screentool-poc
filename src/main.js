"use strict";

var path = require("path"),
    os = require("os"),
    fs = require("fs"),
    edge = require("electron-edge-js"),
    electron = require("electron"),
    url = require("url");

var app = electron.app;

var screen = {
    capture: edge.func({
        assemblyFile: __dirname + "/../ocr/bin/gpii-tesseract.dll",
        typeName: "gpii.tesseract.Screen",
        methodName: "Capture"
    }),

    initEngine: edge.func({
        assemblyFile: __dirname + "/../ocr/bin/gpii-tesseract.dll",
        typeName: "gpii.tesseract.Screen",
        methodName: "InitEngine"
    }),

    getText: edge.func({
        assemblyFile: __dirname + "/../ocr/bin/gpii-tesseract.dll",
        typeName: "gpii.tesseract.Screen",
        methodName: "GetText"
    })
};

var screenshotFile = path.join(os.tmpdir(), "screen" + Math.random().toString(36));

screen.capture({imageFile: screenshotFile});

app.on("window-all-closed", function () {
    app.quit();
});

app.on("ready", function () {
    var screenWindow = new electron.BrowserWindow({
        frame: false,
        transparent: true,
        fullscreen: true
    });

    console.log(__dirname, __filename, app.getAppPath());
    screenWindow.loadURL(url.format({
        protocol: "file",
        slashes: true,
        pathname: path.resolve(app.getAppPath(), "renderer/screen.html"),
        hash: screenshotFile
    }));

    screen.initEngine();

    screenWindow.webContents.send("image");

    electron.ipcMain.on("quit", function () {
        app.quit();
    });
    electron.ipcMain.on("selection", function (e, rect) {
        screen.getText(rect, function (err, text) {
            console.log("got text:", text);
            screenWindow.webContents.send("gotText", {rect: rect, text: text});
        });
    });

});


