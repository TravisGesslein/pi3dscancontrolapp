var common = require("common"); //code that is common to server and client
var patterns = require("./images/patterns.js").patternFilenames;
var fs = require('fs');
var nw = require("nw.gui");

var serverUrl = "http://192.168.1.5:1337";


var io = require('socket.io-client')(serverUrl,{
    query: "type=projectorClient"
}); //options are ommited, server tries connection and reconnection in intervals automatically

var clientData = {
	currentPatternIndex: 0
};

io.on("connect", function (socket)
{
});

//server tells me to cycle through available patterns!
io.on(common.EVENT_TYPES.BEAMER_NEXT_PATTERN, function (data) {
    cyclePattern();
});

//server tells me to reset pattern!
io.on(common.EVENT_TYPES.BEAMER_RESET_PATTERN, function (data) {
    resetPattern();
});

//server tells me to show pattern!
io.on(common.EVENT_TYPES.BEAMER_SHOW_PATTERN, function (data) {
	var timeout = data.timeout || 0;
	
	setTimeout(function(){
		showPattern();
	},timeout);
});

//server tells me to hide pattern!
io.on(common.EVENT_TYPES.BEAMER_HIDE_PATTERN, function (data)
{
	var timeout = data.timeout || 0;
	
	setTimeout(function(){
		hidePattern();
	});
});

var currentWindow = null;
var mainCanvas = null;
var context = null;
var patternImage = null;

function changePattern(patternIdx)
{
	var patternFilename = patterns[patternIdx];
	console.log("switching pattern to " + patternFilename);
	patternImage.src = "./images/" + patternFilename;
}

function resetPattern()
{
	changePattern(0);
	clientData.currentPatternIndex = 0;
}

function cyclePattern()
{
	console.log("cycling pattern");
	clientData.currentPatternIndex++;
	if(clientData.currentPatternIndex >= patterns.length)
	{
		clientData.currentPatternIndex = 0;
	}

	changePattern(clientData.currentPatternIndex);
	
	showPattern();
}

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

var win = nw.Window.get();

win.on("loaded", function () {
    currentWindow = win;
    console.log("asdf");
   
	console.log("loading");
	mainCanvas = currentWindow.window.document.getElementById("mainCanvas");
	currentWindow.enterFullscreen();
	mainCanvas.width = currentWindow.window.screen.width;
	mainCanvas.height =currentWindow.window.screen.height;
	context = mainCanvas.getContext("2d");

	patternImage = currentWindow.window.document.getElementById("pattern");

	console.log("width and height:" + mainCanvas.width + " " + mainCanvas.height);

	

	hidePattern();
    

    
});
