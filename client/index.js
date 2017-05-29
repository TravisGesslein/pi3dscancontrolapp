var config = require('config');
var common = require("../common/common.js"); //code that is common to server and client
var fs = require('fs');
var raspicam = require('raspicam');
var sdl = require('node-sdl2');

//var glfw = require('node-glfw-bindings'); 
//var gl = require('gl');

//read server address from config
var serverUrl = config.get('server');
var imageFolderName = config.get('imageDir');

var io = require('socket.io-client')(serverUrl); //options are ommited, server tries connection and reconnection in intervals automatically

var clientData = {
};

io.on("connect", function (socket)
{
});

//server tells me to take image!
io.on(common.EVENT_TYPES.TAKE_IMAGE, function (data) {
    takeImage(function (imageFilename) {
        var image = fs.readFileSync(imageFilename);
        var str = image.toString('base64');
        io.emit(common.EVENT_TYPES.SEND_IMAGE, { image: str, setIndex: data.setIndex }); //server sends us a set index so it knows which set of images the currently set image belongs to. we send it back.
    });
});


//sends an error string to the server
function serverError(string) {
    io.emit(common.EVENT_TYPES.ERROR, { message: string });
}

//takes an image using the pi cam and calls the given callback on success
//callback arguments are (imagefilename)
function takeImage(callback) {
    callback(imageFolderName + "/test.jpg");
	return;
    var camera = new raspicam({
        mode: "photo",
        output: imageFolderName + "/%d.jpg",
		timeout: 1,
		nopreview: true
    });
    camera.on("read", function (thisArg, error, filename) {
        var filenameStr = imageFolderName + "/" + filename;
			if(filenameStr.charAt(filenameStr.length-1) !== "~")
				callback(filenameStr);
    });

    camera.start();
}

//creates window for beamer output
function createWindow() {
    if (!glfw.glfwInit()) {
        console.log("failed initializing glfw");
        serverError("failed initializing glfw");
    }

    //using node-glfw

    var monitor = glfw.glfwGetPrimaryMonitor();
    var mode = glfw.glfwGetVideoMode(monitor);
    console.log(glfw.glfwGetVersion());
    glfw.glfwWindowHint(glfw.GLFW_RED_BITS, mode.redBits);
    glfw.glfwWindowHint(glfw.GLFW_GREEN_BITS, mode.greenBits);
    glfw.glfwWindowHint(glfw.GLFW_BLUE_BITS, mode.blueBits);
    glfw.glfwWindowHint(glfw.GLFW_REFRESH_RATE, mode.refreshRate);
    //glfw.glfwWindowHint(glfw.GLFW_DECORATED, 0);
    //var window = glfw.glfwCreateWindow(mode.width, mode.height, "window", monitor, null);
    var window = glfw.glfwCreateWindow(800,600, "window", monitor, null);
    return window;
}

function update(window) {
    glfw.glfwPollEvents();
    glfw.glfwSwapBuffers(window);
}

var isProjectorClient = config.get('isProjectorClient'); //tells us if this client is connected to a beamer, and should draw the pattern / black image

if (isProjectorClient) { //projector clients need to create a window to output images to 
    /*var window = createWindow();

    gl = gl(800, 600, { preserveDrawingBuffer: true });
    

    while (!glfw.glfwWindowShouldClose(window)) {
        update(window);
    }

    glfw.glfwTerminate();
    */

    const App = sdl.app;
    const Window = sdl.window;

    let win = new Window
    win.on('close', () => {
        App.quit()
    });

    win.on('change', () => {
        console.log("hello");
    });
}



