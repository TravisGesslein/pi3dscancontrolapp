var config = require('config');
var common = require("../common/common.js"); //code that is common to server and client
var fs = require('fs');

//read server address from config
var serverUrl = config.get('server');
var imageFolderName = config.get('imageDir');

var io = require('socket.io-client')(serverUrl); //options are ommited, server tries connection and reconnection in intervals automatically

var clientData = {
};

io.on("connect", function (socket)
{
});
console.log(process.cwd());

//server tells me to take image!
io.on(common.EVENT_TYPES.TAKE_IMAGE, function (data) {
    takeImage(function (imageFilename) {
        var image = fs.readFileSync(imageFilename);
        var str = image.toString('base64');
        io.emit(common.EVENT_TYPES.SEND_IMAGE, { image: str, setIndex: data.setIndex } ); //server sends us a set index so it knows which set of images the currently set image belongs to. we send it back.
    });
});

//takes an image using the pi cam and calls the given callback on success
//callback arguments are (imagefilename)
function takeImage(callback) {
    callback(imageFolderName + "/test.jpg");
}