/*
 * Copyright (c) by Rich Budek
 * This is used to demonstrate PC or MAC based apps (programs)
 * Establishes a MicroSoft RDP (Remote Desktop Protocol) link to VM running 
 * my apps which can be safely run without worrying about having the user load anything on
 * their own PC
 *
 * This file is part of mstsc.js.
 *
 * mstsc.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 */

var rdp = require('node-rdpjs-2'); //upgrade to version to solve crypto errors

/**2
 * Create proxy between rdp layer and socket io
 * @param server {http(s).Server} http server
 */
module.exports = function(server) {
    var io = require('socket.io')(server);
    io.on('connection', function(client) {
        var rdpClient = null;
        client.on('infos', function(infos) {
            if (rdpClient) {
                // clean older connection
                rdpClient.close();
            };

            /* fix the connection to a static IP that the front end does not know about */
            // infos comes in from the front end change it here
            if (infos.username == 'GradeTronic') {
                //this hides everything from the prying eyes of the frontend
                infos.domain = '';
                infos.username = 'DemoAppsUser';
                infos.password = 'AppPa$$Demo';
                infos.alternateShell = 'c:\\Progs-Demo\\GradeTronics_PCver.exe';
            };
            //console.log(infos);
            rdpClient = rdp.createClient({
                domain: infos.domain,
                userName: infos.username,
                password: infos.password,
                enablePerf: true,
                autoLogin: true,
                alternateShell: infos.alternateShell, //'C:\\Progs-Demo\\GradeTronics_PCver.exe',
                launch: infos.launch,
                screen: infos.screen,
                locale: infos.locale,
                logLevel: process.argv[2] || 'INFO'
            }).on('connect', function() {
                client.emit('rdp-connect');
            }).on('bitmap', function(bitmap) {
                client.emit('rdp-bitmap', bitmap);
            }).on('close', function() {
                client.emit('rdp-close');
            }).on('error', function(err) {
                client.emit('rdp-error', err);
            }).connect(infos.ip, infos.port);
        }).on('mouse', function(x, y, button, isPressed) {
            if (!rdpClient) return;

            rdpClient.sendPointerEvent(x, y, button, isPressed);
        }).on('wheel', function(x, y, step, isNegative, isHorizontal) {
            if (!rdpClient) {
                return;
            }
            rdpClient.sendWheelEvent(x, y, step, isNegative, isHorizontal);
        }).on('scancode', function(code, isPressed) {
            if (!rdpClient) return;

            rdpClient.sendKeyEventScancode(code, isPressed);
        }).on('unicode', function(code, isPressed) {
            if (!rdpClient) return;

            rdpClient.sendKeyEventUnicode(code, isPressed);
        }).on('disconnect', function() {
            if (!rdpClient) return;

            rdpClient.close();
        });
    });
}