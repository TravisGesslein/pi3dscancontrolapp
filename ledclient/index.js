var common = require("common"); //code that is common to server and client
var gpio = require("rpi-gpio");

//read server address from config
var serverUrl = "http://192.168.1.5:1337";

var io = require('socket.io-client')(serverUrl, {
    query: "type=ledClient"
}); //options are ommited, server tries connection and reconnection in intervals automatically

var clientData = {
};

gpio.setup(3,gpio.DIR_OUT, function(error){
	console.log(error) 
});

gpio.setup(5,gpio.DIR_OUT, function(error){
	console.log(error);
});

io.on("connect", function (socket,a,b)
{
	console.log("Connected to server!");
});

io.on(common.EVENT_TYPES.LED_A_ON, function(data){
	console.log("Received server command: turn LED group A on");
	gpio.write(3,true,function(){
		console.log("LED A ON write callback");
	});
});

io.on(common.EVENT_TYPES.LED_A_OFF, function(data){
	console.log("Received server command: turn LED group A off");
	gpio.write(3,false,function(){
		console.log("LED A OFF write callback");
	});
});

io.on(common.EVENT_TYPES.LED_B_ON, function(data){
	gpio.write(5,true, function(){
		console.log("LED B ON write callback");
	});
	console.log("Received server command: turn LED group B on");
});

io.on(common.EVENT_TYPES.LED_B_OFF, function(data){
	gpio.write(5,false,function(){
		console.log("LED B OFF write callback");
	});
	console.log("Received server command: turn LED group B off");
});

//sends an error string to the server
function serverError(string) {
    io.emit(common.EVENT_TYPES.ERROR, { message: string });
}

