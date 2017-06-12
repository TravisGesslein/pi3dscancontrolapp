﻿var config = require('config');
var common = require("../common/common.js"); //code that is common to server and client
var fs = require('fs');
var raspicam = require('raspicam');

//read server address from config
var serverUrl = config.get('server');
var imageFolderName = config.get('imageDir');

var io = require('socket.io-client')(serverUrl, {
    query: "type=cameraClient"
}); //options are ommited, server tries connection and reconnection in intervals automatically

var clientData = {
};

io.on("connect", function (socket,a,b)
{

});

//server tells me to take image!
io.on(common.EVENT_TYPES.TAKE_IMAGE, function (data) {
    console.log("taking image");
    takeImage(function (imageFilename) {
		console.log("preparing SEND_IMAGE event");
        var image = fs.readFileSync(imageFilename);
        var str = image.toString('base64');
        io.emit(common.EVENT_TYPES.SEND_IMAGE, { image: str, setIndex: data.setIndex }); //server sends us a set index so it knows which set of images the currently set image belongs to. we send it back.
		console.log("sending response to server for image set " + data.setIndex);
	});
});


//sends an error string to the server
function serverError(string) {
    io.emit(common.EVENT_TYPES.ERROR, { message: string });
}

//takes an image using the pi cam and calls the given callback on success
//callback arguments are (imagefilename)
function takeImage(callback) {
    /*callback(imageFolderName + "/test.jpg");
	return; */
    var camera = new raspicam({
        mode: "photo",
        output: imageFolderName + "/%d.jpg",
		timeout: 1,
		nopreview: true
    });
	
	var readEvent = function(thisArg, error, filename) 
	{
		console.log("read event for filename: " + filename);
	        var filenameStr = imageFolderName + "/" + filename;
			if(filenameStr.charAt(filenameStr.length-1) !== "~"){
				callback(filenameStr);
				camera.removeListener("read",readEvent);
				console.log("removed listener. total read listeners: " + camera.listeners("read").length);
			}   
 }
    camera.on("read", readEvent );

    camera.start();
}
