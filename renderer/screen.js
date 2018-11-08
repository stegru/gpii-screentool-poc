"use strict";


document.addEventListener("DOMContentLoaded", onLoad, false);
document.addEventListener("mousemove", onMouseMove);
document.addEventListener("mouseup", onMouseUp);
document.addEventListener("keyup", quit);

var elems = {};
var electron = navigator.userAgent.indexOf(" Electron/") >= 0 && require("electron");

function onLoad() {
    var imageFile = location.hash.substr(1);

    var imageUrl;
    if (electron) {
        var screenImage = electron.nativeImage.createFromPath(imageFile);
        imageUrl = screenImage.toDataURL();
    } else {
        imageUrl = imageFile || "test.png";
    }

    var rule = "#screenshot { background-image: url(" + imageUrl + ")}";
    var elem = document.createElement("link");
    document.head.appendChild(elem);
    var style = window.document.styleSheets[0];
    style.insertRule(rule);

    elems.screen = window.document.querySelector("#screenshot");
    elems.selectbox = window.document.querySelector("#screenshot #selectbox");
    elems.text = window.document.querySelector("#screenshot #text");
}

function quit() {
    //electron.ipcRenderer.send("quit");
}

/**
 * onMouseMove
 * @param {MouseEvent} e event
 */
function onMouseMove(e) {
    if (e.buttons === 1) {
        setSelection(e.clientX, e.clientY);
    }
}

/**
 * onMouseUp
 * @param {MouseEvent} e event
 */
function onMouseUp(e) {
    if (e.button === 0) {
        stopSelection();
    }
}

var selection = {
    selecting: false,
    startPos: {x: null, y: null},
    endPos: {x: null, y: null},
    rect: {}
};

function setSelection(x, y) {
    if (!selection.selecting) {
        selection.startPos = {x: x, y: y};

        selection.selecting = true;

        elems.selectbox.offsetLeft;
        elems.screen.classList.add("showSelection", "selecting");
    }

    selection.endPos = {x: x, y: y};

    var rect = {
        x: Math.min(selection.startPos.x, selection.endPos.x),
        y: Math.min(selection.startPos.y, selection.endPos.y),
        right: Math.max(selection.startPos.x, selection.endPos.x),
        bottom: Math.max(selection.startPos.y, selection.endPos.y)
    };

    selection.rect = rect;

    rect.width = rect.right - rect.x;
    rect.height = rect.bottom - rect.y;

    var style = elems.selectbox.style;
    style.left = rect.x + "px";
    style.top = rect.y + "px";
    style.width = rect.width + "px";
    style.height = rect.height + "px";

}

function stopSelection() {
    if (selection.selecting) {
        selection.selecting = false;
        selection.selected = true;

        elems.screen.classList.remove("selecting");
    }

    electron.ipcRenderer.send("selection", selection.rect);
}

electron.ipcRenderer.on("gotText", function (sender, d) {
    var style = elems.text.style;
    style.left = (d.rect.x) + "px";
    style.top = (d.rect.y + d.rect.height) + "px";
    style.width = d.rect.width + "px";
    elems.text.innerHTML = d.text;
    elems.screen.classList.add("gotText");
});
