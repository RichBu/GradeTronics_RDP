/*
 * Copyright (c) 2020 Rich Budek
 *
 * This program calls up a virtual machine and launches an app 
 * all within the browser and the Windows App looks like a cloud based app.
 * I use it to demo my app but also the concept of making an app look like a cloud app
 * 
 * This file is part of mstsc.js.
 *
 */

var express = require('express');
var http = require('http');

var app = express();
app.use(express.static(__dirname + '/client'))
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/html/index.html');
});
app.get('/GradeTronics', function(req, res) {
    res.sendFile(__dirname + '/client/html/gradetronics.html');
});
app.get('/SerialNum', function(req, res) {
    res.sendFile(__dirname + '/client/html/serialnum.html');
});
app.get('/Calculator', function(req, res) {
    res.sendFile(__dirname + '/client/html/caclulator.html');
});

var server = http.createServer(app).listen(process.env.PORT || 9250);

require('./server/mstsc')(server);