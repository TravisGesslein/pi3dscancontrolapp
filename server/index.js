var config = require('config');
var common = require("common")
var keypress = require("keypress");
var fs = require("fs");

keypress(process.stdin);

var serverPort = config.get('port');
var imageDirectoryName = config.get('imageDir');
var photoOptions = config.get("photoOptions");

//make sure the image directory actually exists
if (!fs.existsSync(imageDirectoryName)) {
    fs.mkdirSync(imageDirectoryName);
}

var io = require('socket.io')(serverPort);

var serverData = {
    clients: [], //all connected clients
    cameraClients: [], //all connected clients that operate a camera
    projectorClients: [], //all connected clients that operate a projector
	ledClients: [], //all connected clients that operate LED stripes
    imageSets: [], //stores information about each set of taken images (every time the user wants to take images from all cameras = '1 set').
	addressConnects: {}
};

io.on("error", function (error) {
    console.log(error);
});

io.on('connection', function (socket)
{
	
    var client = handleNewClient(socket);

    socket.on('disconnect', function () {
        removeClient(client);
        console.log("Total clients connected: " + (serverData.clients.length));
    });
});

function socketAlreadyConnected(socket)
{
	
	for(var i=0;i<serverData.clients.length;++i)
	{
		if(serverData.clients[i].socket === socket)
			return true;
	}
	
	return false;
}

function printRealClients()
{
	var count = 0;
	for(var address in serverData.addressConnects)
	{
		if(serverData.addressConnects.hasOwnProperty(address))
		{
			if(serverData.addressConnects[address] > 0)
			{
				count++;
			}
		}
	}
	
	console.log("real clients connected: " + count);
	
}


function handleNewClient(socket)
{
	
    var type = socket.handshake.query.type; //client type, will send something like 'beamerClient' or 'cameraClient'
    var client = {
        socket: socket,
        type: type,
        requestedImages: 0,
        receivedImages: 0
    };
	
	console.log("Incoming client connection: " + socket.handshake.address );
    switch (type) {
        case "projectorClient":
            serverData.projectorClients.push(client);
            console.log("Projector client connected! (total: " + serverData.projectorClients.length + ")");
            break;
        case "cameraClient":
            serverData.cameraClients.push(client);
            console.log("Camera client connected! (total: " + serverData.cameraClients.length + ")");
            break;
		case "ledClient":
			serverData.ledClients.push(client);
			console.log("LED client connected! (total: " + serverData.ledClients.length + ")");
    }

    serverData.clients.push(client);
    console.log("Total clients connected: " + (serverData.clients.length));

    //register various events with socket

    //client sends taken image
    socket.on(common.EVENT_TYPES.SEND_IMAGE, function (data)
    {
		console.log("received SEND_IMAGE event");
        var imageSet = serverData.imageSets[data.setIndex];
        var image = Buffer.from(data.image, 'base64');
        processReceivedImage(image, imageSet, client);
    });

    socket.on(common.EVENT_TYPES.ERROR, function (data) {
        console.log("client sent exception: " + data.toString());
    });
	
	if(!serverData.addressConnects[client.socket.handshake.address])
	{
		serverData.addressConnects[client.socket.handshake.address] = 0;
	}
	
	serverData.addressConnects[client.socket.handshake.address]++;
	
	printRealClients();

    return client;
}

function removeClient(client)
{
	if(serverData.addressConnects[client.socket.handshake.address])
	{
		serverData.addressConnects[client.socket.handshake.address]--;
	}
	
    serverData.clients.splice(serverData.clients.indexOf(client));
    serverData.projectorClients.splice(serverData.projectorClients.indexOf(client));
    serverData.cameraClients.splice(serverData.cameraClients.indexOf(client));
}

function processReceivedImage(image, imageSet, client)
{
    var filename = serverData.clients.indexOf(client) + ".jpg"; //filenames are just numbers corresponding to the places of the clients in our clients array
    var path = imageDirectoryName + "/" + imageSet.directoryName + "/" + filename;
    imageSet.imagePaths.push(path);
    imageSet.imagesLeft--;
    client.receivedImages++;
    fs.writeFile(path, image);

    console.log("Received image for image set " + imageSet.roundIndex + ". " + imageSet.imagesLeft + " left...");
}

//takes images from all clients and stores them in the images folder
function takeImages(directoryNamePrefix, showBeamerPattern)
{
    var clients = serverData.cameraClients;

    var round = { //one 'round' of taken images
        imagesLeft: clients.length, //number of images that have yet to be received from clients
        imagePaths: [],
		roundIndex: -1,
        time: new Date(), //server time when the images were taken
        directoryName: null //computed later
    };

	
    round.directoryName =  round.time.getDate() + "-" + (round.time.getMonth()+1) + "-" + round.time.getFullYear() + " " + round.time.getHours() + " " + round.time.getMinutes() + " " + round.time.getSeconds() + " " + round.time.getMilliseconds() + directoryNamePrefix;

    //start the image taking process after folder is created (via callback)
    fs.mkdir(imageDirectoryName + "/" + round.directoryName, function ()
    {
        serverData.imageSets.push(round);
		round.roundIndex = serverData.imageSets.length-1;
        //we send the TAKE_IMAGE event to clients, and the setIndex which the clients will also send back once they send back images
        //this way we know the mapping between sent client images and an image set. this is important because it's possible for servers to wait on images from different sets
        //(for example, if two sets of images are taken immediately one after the other, but some time is needed for network transfer)
        var cameraClientEventData = {
            setIndex: round.roundIndex, //index of the image set that the taken image corresponds to
			photoOptions: photoOptions
        }

        for (var i = 0; i < serverData.projectorClients.length; ++i) {
            if (showBeamerPattern) {
                serverData.projectorClients[i].socket.emit(common.EVENT_TYPES.BEAMER_SHOW_PATTERN, {});
            }
            else {
                serverData.projectorClients[i].socket.emit(common.EVENT_TYPES.BEAMER_HIDE_PATTERN, {});
            }
        }

        for (var i = 0; i < serverData.cameraClients.length; ++i) {
            serverData.cameraClients[i].socket.emit(common.EVENT_TYPES.TAKE_IMAGE, cameraClientEventData);
            serverData.cameraClients[i].requestedImages++;
        }
    });
}

function ledAOn()
{
	for(var i=0;i<serverData.ledClients.length;++i)
	{
		serverData.ledClients[i].socket.emit(common.EVENT_TYPES.LED_A_ON, null);
	}
}

function ledAOff()
{
	for(var i=0;i<serverData.ledClients.length;++i)
	{
		serverData.ledClients[i].socket.emit(common.EVENT_TYPES.LED_A_OFF, null);
	}
}

function ledBOn()
{
	for(var i=0;i<serverData.ledClients.length;++i)
	{
		serverData.ledClients[i].socket.emit(common.EVENT_TYPES.LED_B_ON, null);
	}
}

function ledBOff()
{
	for(var i=0;i<serverData.ledClients.length;++i)
	{
		serverData.ledClients[i].socket.emit(common.EVENT_TYPES.LED_B_OFF, null);
	}
}
//startup

function beamerPatternOn()
{
	for (var i = 0; i < serverData.projectorClients.length; ++i) {
		serverData.projectorClients[i].socket.emit(common.EVENT_TYPES.BEAMER_SHOW_PATTERN, {});
    }
}

function beamerPatternOff()
{
	for (var i = 0; i < serverData.projectorClients.length; ++i) {
		serverData.projectorClients[i].socket.emit(common.EVENT_TYPES.BEAMER_HIDE_PATTERN, {});
    }
}

function cycleBeamerPattern()
{
	for (var i = 0; i < serverData.projectorClients.length; ++i) {
		serverData.projectorClients[i].socket.emit(common.EVENT_TYPES.BEAMER_NEXT_PATTERN, {});
    }
}

function resetBeamerPattern()
{
	for (var i = 0; i < serverData.projectorClients.length; ++i) {
		serverData.projectorClients[i].socket.emit(common.EVENT_TYPES.BEAMER_RESET_PATTERN, {});
    }
}

console.log("Press T to tell all connected PI-cams to take images and store them on the server.");
console.log("Press E to shut down server.");
console.log("Press U to update console (doesn't show new messages sometimes)");
console.log("Press A to turn LED group A on");
console.log("Press S to turn LED group A off");
console.log("Press B to turn LED group B on");
console.log("Press N to turn LED group B off");
console.log("Press I to turn projector pattern ON");
console.log("Press O to turn projector pattern OFF");
console.log("Press P to cycle through different available projector patterns");
console.log("Press K to reset pattern to the default pattern");


process.stdin.on("keypress", function (char, key) {
    if (key) {
        if (key.name === 't') {
            console.log("taking images...");
            takeImages("black_", false);
            /*setTimeout(function ()
            {
                takeImages("patterned_", true);
            }, 1000);*/
        }
        else if (key.name === 'e') {
            process.exit();
        }else if (key.name === 'u') {
			
		} else if(key.name === 'a')
		{
			ledAOn();
		} else if(key.name === 's')
		{
			ledAOff();
		}else if(key.name === 'b')
		{
			ledBOn();
		} else if(key.name === 'n')
		{
			ledBOff();
		} else if(key.name === 'i')
		{
			beamerPatternOn();
		}
		else if (key.name === 'o')
		{
			beamerPatternOff();
		}
		else if (key.name === 'p')
		{
			cycleBeamerPattern();
		}
		else if(key.name === 'k')
		{
			resetBeamerPattern();
		}
		
    }
});

process.stdin.setRawMode(true);
process.stdin.resume();