var config = require('config');
var common = require("../common/common.js"); //code that is common to server and client
var fs = require('fs');

//read server address from config
var serverUrl = config.get('server');
var imageFolderName = config.get('imageDir');


var io = require('socket.io-client')(serverUrl,{
    query: "type=projectorClient"
}); //options are ommited, server tries connection and reconnection in intervals automatically

var clientData = {
};

io.on("connect", function (socket)
{
});

//server tells me to show pattern!
io.on(common.EVENT_TYPES.BEAMER_SHOW_PATTERN, function (data) {
    showPattern();
});

//server tells me to hide pattern!
io.on(common.EVENT_TYPES.BEAMER_HIDE_PATTERN, function (data)
{
    hidePattern();
});

var currentWindow = null;
var mainCanvas = null;
var context = null;
var patternImage = null;

function showPattern()
{
    if (currentWindow)
    {
        context.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        context.drawImage(patternImage, 0, 0, patternImage.width, patternImage.height, 0, 0, mainCanvas.width, mainCanvas.height);
    }
}

function hidePattern()
{
    if (currentWindow)
    {
        context.fillStyle = 'rgba(0,0,0,255)';
        context.fillRect(0, 0, currentWindow.window.screen.width, currentWindow.window.screen.height);
    }
}

nw.Screen.Init();

var screens = nw.Screen.screens;
//if only 1 screen is connected, we show the window on that one. otherwise, we show it on the last available, which assumes that the first connected screen 



nw.Window.open("beamercontent.html", function (win) {
    currentWindow = win;
    console.log("asdf");
    win.window.onload = function () {
        console.log("loading");
        mainCanvas = currentWindow.window.document.getElementById("mainCanvas");
        mainCanvas.width = currentWindow.window.screen.width;
        mainCanvas.height = currentWindow.window.screen.height;
        context = mainCanvas.getContext("2d");

        patternImage = currentWindow.window.document.getElementById("pattern");

        console.log("width and height:" + mainCanvas.width + " " + mainCanvas.height);

        currentWindow.enterFullscreen();

        hidePattern();
    };

    
});