#!/usr/bin/env node
/*global require, console, process*/
var stat = require('node-static');
var argv = require('minimist')(process.argv.slice(2));
var port = argv.port || 8001;
var file = new stat.Server('.');

require('http').createServer(function (req, res){
    req.addListener('end', function () {
        file.serve(req, res);
    }).resume();
}).listen(port);

console.log('webserver listening on port ' + port + '...');

