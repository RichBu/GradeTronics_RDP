/*
 * By Rich Budek based on others work
 *
 * Client send mouse data to RDP
 * This file is part of mstsc.js.
 *
 * 
 *
 */

(function() {
    /**
     * Mouse button mapping
     * @param button {integer} client button number
     */
    function mouseButtonMap(button) {
        switch (button) {
            case 0:
                return 1;
            case 2:
                return 2;
            default:
                return 0;
        }
    };

    /**
     * Mstsc client
     * Input client connection (mouse and keyboard)
     * bitmap processing
     * @param canvas {canvas} rendering element
     */
    function Client(canvas) {
        this.canvas = canvas;
        // create renderer
        this.render = new Mstsc.Canvas.create(this.canvas);
        this.socket = null;
        this.activeSession = false;
        this.install();
    }

    Client.prototype = {
        install: function() {
            var self = this;
            // bind mouse move event
            this.canvas.addEventListener('mousemove', function(e) {
                if (!self.socket) return;

                var offset = Mstsc.elementOffset(self.canvas);
                self.socket.emit('mouse', e.clientX - offset.left, e.clientY - offset.top, 0, false);
                e.preventDefault || !self.activeSession();
                return false;
            });
            this.canvas.addEventListener('mousedown', function(e) {
                if (!self.socket) return;

                var offset = Mstsc.elementOffset(self.canvas);
                self.socket.emit('mouse', e.clientX - offset.left, e.clientY - offset.top, mouseButtonMap(e.button), true);
                e.preventDefault();
                return false;
            });
            this.canvas.addEventListener('mouseup', function(e) {
                if (!self.socket || !self.activeSession) return;

                var offset = Mstsc.elementOffset(self.canvas);
                self.socket.emit('mouse', e.clientX - offset.left, e.clientY - offset.top, mouseButtonMap(e.button), false);
                e.preventDefault();
                return false;
            });
            this.canvas.addEventListener('contextmenu', function(e) {
                if (!self.socket || !self.activeSession) return;

                var offset = Mstsc.elementOffset(self.canvas);
                self.socket.emit('mouse', e.clientX - offset.left, e.clientY - offset.top, mouseButtonMap(e.button), false);
                e.preventDefault();
                return false;
            });
            this.canvas.addEventListener('DOMMouseScroll', function(e) {
                if (!self.socket || !self.activeSession) return;

                var isHorizontal = false;
                var delta = e.detail;
                var step = Math.round(Math.abs(delta) * 15 / 8);

                var offset = Mstsc.elementOffset(self.canvas);
                self.socket.emit('wheel', e.clientX - offset.left, e.clientY - offset.top, step, delta > 0, isHorizontal);
                e.preventDefault();
                return false;
            });
            this.canvas.addEventListener('mousewheel', function(e) {
                if (!self.socket || !self.activeSession) return;

                var isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
                var delta = isHorizontal ? e.deltaX : e.deltaY;
                var step = Math.round(Math.abs(delta) * 15 / 8);

                var offset = Mstsc.elementOffset(self.canvas);
                self.socket.emit('wheel', e.clientX - offset.left, e.clientY - offset.top, step, delta > 0, isHorizontal);
                e.preventDefault();
                return false;
            });

            // bind keyboard event
            window.addEventListener('keydown', function(e) {
                if (!self.socket || !self.activeSession) return;

                self.socket.emit('scancode', Mstsc.scancode(e), true);

                e.preventDefault();
                return false;
            });
            window.addEventListener('keyup', function(e) {
                if (!self.socket || !self.activeSession) return;

                self.socket.emit('scancode', Mstsc.scancode(e), false);

                e.preventDefault();
                return false;
            });

            return this;
        },
        /**
         * connect
         * @param ip {string} ip target for rdp
         * @param domain {string} microsoft domain
         * @param username {string} session username
         * @param password {string} session password
         * @param next {function} asynchrone end callback
         * @param launch {string} starup program to launch
         */
        connect: function(ip, domain, username, password, next, launch) {
            // compute socket.io path (cozy cloud integration)
            var parts = document.location.pathname.split('/'),
                base = parts.slice(0, parts.length - 1).join('/') + '/',
                path = base + 'socket.io';


            // start connection
            var self = this;
            this.socket = io(window.location.protocol + "//" + window.location.host, { "path": path }).on('rdp-connect', function() {
                // this event can be occured twice (RDP protocol stack artefact)
                console.log('[mstsc.js] connected');
                self.activeSession = true;
            }).on('rdp-bitmap', function(bitmap) {
                console.log('[mstsc.js] bitmap update bpp : ' + bitmap.bitsPerPixel);
                self.render.update(bitmap);
            }).on('rdp-close', function() {
                next(null);
                console.log('[mstsc.js] close');
                self.activeSession = false;
            }).on('rdp-error', function(err) {
                next(err);
                console.log('[mstsc.js] error : ' + err.code + '(' + err.message + ')');
                self.activeSession = false;
            });

            // emit infos event
            this.socket.emit('infos', {
                ip: ip,
                port: 3389,
                screen: {
                    width: this.canvas.width,
                    height: this.canvas.height
                },
                domain: domain,
                username: username,
                password: password,
                locale: Mstsc.locale(),
                alternateShell: launch
            });
        }
    }

    Mstsc.client = {
        create: function(canvas) {
            return new Client(canvas);
        }
    }
})();