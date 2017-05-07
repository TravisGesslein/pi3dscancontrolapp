var config = require('config');
var common = require("../common/common.js")
var keypress = require("keypress");
var fs = require("fs");

keypress(process.stdin);

var serverPort = config.get('port');

var io = require('socket.io')(serverPort);

var serverData = {
    clients: []
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
    socket.on(common.EVENT_TYPES.SEND_IMAGE, function ( data)
    {
        var data = Buffer.from(data, 'base64');
        storeReceivedImage(data, client);
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

function storeReceivedImage(imageData, client)
{
    fs.writeFile("images/test.jpg", imageData);
}

//takes images from all clients and stores them in the images folder
function takeImages()
{
    var clients = serverData.clients;
    for (var i = 0; i < clients.length; ++i) {
        clients[i].socket.emit(common.EVENT_TYPES.TAKE_IMAGE);
    }
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