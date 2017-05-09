var config = require('config');
var common = require("../common/common.js")
var keypress = require("keypress");
var fs = require("fs");

keypress(process.stdin);

var serverPort = config.get('port');
var imageDirectoryName = config.get('imageDir');

//make sure the image directory actually exists
if (!fs.existsSync(imageDirectoryName)) {
    fs.mkdirSync(imageDirectoryName);
}

var io = require('socket.io')(serverPort);

var serverData = {
    clients: [], //all connected clients
    imageSets: [], //stores information about each set of taken images (every time the user wants to take images from all cameras = '1 set').
};

io.on("error", function (error) {
    console.log(error);
});

io.on('connection', function (socket)
{
    handleNewClient(socket);

    socket.on('disconnect', function ()
    {
        removeClient(socket);
        console.log("Total clients connected: " + (serverData.clients.length));
    });

    
});

function handleNewClient(socket)
{
    var client = { socket: socket };
    serverData.clients.push(client);
    console.log("Total clients connected: " + (serverData.clients.length));

    //register various events with socket

    //client sends taken image
    socket.on(common.EVENT_TYPES.SEND_IMAGE, function (data)
    {
        var imageSet = serverData.imageSets[data.setIndex];
        var image = Buffer.from(data.image, 'base64');
        processReceivedImage(image, imageSet, client);
    });

    socket.on(common.EVENT_TYPES.ERROR, function (data) {
        console.log("client sent exception: " + data.toString());
    });
}

function removeClient(socket)
{
    var clients = serverData.clients;

    //find client by socket and remove it
    for (var i = 0; i < clients.length; ++i) {
        if (clients[i].socket === socket) {
            clients.splice(i, 1); 
            break;
        }
    }
}

function processReceivedImage(image, imageSet, client)
{
    var filename = serverData.clients.indexOf(client) + ".jpg"; //filenames are just numbers corresponding to the places of the clients in our clients array
    var path = imageDirectoryName + "/" + imageSet.directoryName + "/" + filename;
    imageSet.imagePaths.push(path);
    imageSet.imagesLeft--;
    fs.writeFile(path, image);

    console.log("Received image. " + imageSet.imagesLeft + " left...");
}

//takes images from all clients and stores them in the images folder
function takeImages()
{
    var clients = serverData.clients;

    var round = { //one 'round' of taken images
        imagesLeft: clients.length, //number of images that have yet to be received from clients
        imagePaths: [],
        time: new Date(), //server time when the images were taken
        directoryName: null //computed later
    };

    round.directoryName = round.time.getDate() + "-" + (round.time.getMonth()+1) + "-" + round.time.getFullYear() + " " + round.time.getHours() + " " + round.time.getMinutes() + " " + round.time.getSeconds() + " " + round.time.getMilliseconds();

    fs.mkdir(imageDirectoryName + "/" + round.directoryName, function () {
        serverData.imageSets.push(round);

        //we send the TAKE_IMAGE event to clients, and the setIndex which the clients will also send back once they send back images
        //this way we know the mapping between sent client images and an image set. this is important because it's possible for servers to wait on images from different sets
        //(for example, if two sets of images are taken immediately one after the other, but some time is needed for network transfer)
        var eventData = {
            setIndex: serverData.imageSets.length - 1, //index of the image set that the taken image corresponds to
        }

        for (var i = 0; i < clients.length; ++i) {
            clients[i].socket.emit(common.EVENT_TYPES.TAKE_IMAGE, eventData);
        }
    });
}

//startup

console.log("Press T to tell all connected PI-cams to take images and store them on the server.");
console.log("Press E to shut down server.");

process.stdin.on("keypress", function (char, key) {
    if (key) {
        if (key.name === 't') {
            console.log("taking images...");
            takeImages();
        }
        else if (key.name === 'e') {
            process.exit();
        }
    }
});

process.stdin.setRawMode(true);
process.stdin.resume();