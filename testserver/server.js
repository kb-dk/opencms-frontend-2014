#!/usr/bin/env node
/*global require, console, process*/
var stat = require('node-static');
var argv = require('minimist')(process.argv.slice(2));
var port = argv.port || 8001;
var file = new stat.Server('../');

if (argv.help || argv.h) {
    console.log('Simple NodeJS webserver for testing ajax menu.\n\nUsage: ./server [--help][--port=X]\n\n--port\t\tThe port to listen for (defaults to 8001).\n--help | --h\tPrint this message.\n\nNote that the webroot is set to the parent directory.\nAfter starting the webserver, direct your prefered browser to http://localhost:8001/template.html to see the template with ajax calls enabled.');
} else {
    require('http').createServer(function (req, res){
        req.addListener('end', function () {
            file.serve(req, res);
        }).resume();
    }).listen(port);

    console.log('webserver listening on port ' + port + '...');
}
