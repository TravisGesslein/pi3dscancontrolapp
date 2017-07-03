# Requirements
Machines running server or any of the clients need node.js. The server can be run on any platform that can run Node, while all the clients are designed to run on Raspberry PIs (only tested on there). 

The Raspberry PI "beamer client" uses a precompiled port of NW.JS to open a window and draw stuff in there. You'll need to download the archive of https://github.com/jalbam/nwjs_rpi and follow the install instructions there to package the beamer client into something that can be run by NW.JS.

# Usage

## Setup and running the applications

To install all dependencies that the various apps rely on, navigate to their directories and run

`npm install`

This should be done on the machines that you actually want to run the app on. I.e. don't npm install on a Windows PC and then just transfer the files to the PI. This might work, but might not, because some of the required modules might depend on platform specific libraries that are only installed for the specific machine that npm install is run on. 

For clients, we suggest having a "master" SD card where you install everything once and make sure it works, and then just cloning that SD card for all the PIs you want running. This is simpler than trying to parallel-install everything on all the PIs.

One thing to note, when you clone this repository you should keep in mind to pull the submodules of the repository. There's only one for now that is required by the LED client. 

`git submodule init`
`git submodule update`

### Running
The entry point for LED Client, Camera Client and the server are index.js. You can navigate to their directories and run

`node index.js`

to start the application. 

(For various reasons) At the moment the clients have hardcoded server addresses in the code. You'll either need to set the machine running the server to a static ip of 192.168.1.5 or change the server addresses in the client's index.js to something else. You can configure the client's IPs however you want, the server doesn't need to know them as the clients are the ones initiating contact. Just make sure they are in the same subnet.

The clients should automatically reconnect themselves when losing connection, or if your server starts/restarts after the clients are already running. The server software will print information to the console whenever clients connect and disconnect.

## Server usage

Upon start the server will print instructions that tell you the hotkey setup for the things the server can do (taking images, turning off/on LEDs, etc.). 

By default all photos are saved to the ./images directory in the server's application directory. Every time you tell all the clients to take images, the server will create subdirectories with names that are just timestamps of when the images were taken. Example directory name:

`22-6-2017 14 27 14 137black_`

There will be two directories for each round of taken images. One with the beamer clients just showing a black screen, and the other one with the beamer clients showing a custom image pattern.

## Camera/LED client usage

The clients are non-interactive, as they are controlled by the server application, but will typically print debug information if you start them in a console (for example via SSH, or actual monitor/keyboard/mouse connected to the PI).

## Beamer client usage
Please follow the packaging instructions at https://github.com/jalbam/nwjs_rpi to package the application in the "beamerclient" directory into something that can be run by jalbam's NW.JS port.

There's a default image pattern in the ./images subfolder of the beamer client. You can just replace the file if you want to show a different pattern.

# Contributing

Any help is welcome. Most of the code was pragmatically grown to get a first version of our scanner running, and subject to change. That's why there are currently no easy config files and hardcoded values (config files caused problems when trying to auto start apps in debian to make PI clients connect themselves when plugging the power in), inconsistencies in the build process (for example, the rpi_gpio module is submoduled and npm installed locally because the PI we wanted as an LED client didn't have internet access, so we cloned the repo into our local repository and could install on the PI locally after copying the files there) and so on.

