/*
 * Copyright (c) 2020 by Rich Budek
 *
 * Based on files by Sylvain Peyrefitte
 * 
 * This is MSTSC (MS Terminal Services) code that runs in the browser
 *
 */

(function() {

    /**
     * Use for domain declaration
     */
    Mstsc = function() {}

    Mstsc.prototype = {
        // shortcut
        $: function(id) {
            return document.getElementById(id);
        },

        /**
         * Compute screen offset for a target element
         * @param el {DOM element}
         * @return {top : {integer}, left {integer}}
         */
        elementOffset: function(el) {
            var x = 0;
            var y = 0;
            while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
                x += el.offsetLeft - el.scrollLeft;
                y += el.offsetTop - el.scrollTop;
                el = el.offsetParent;
            }
            return { top: y, left: x };
        },

        /**
         * Try to detect browser
         * @returns {String} [firefox|chrome|ie]
         */
        browser: function() {
            if (typeof InstallTrigger !== 'undefined') {
                return 'firefox';
            }

            if (!!window.chrome) {
                return 'chrome';
            }

            if (!!document.docuemntMode) {
                return 'ie';
            }

            return null;
        },

        /**
         * Try to detect language
         * @returns
         */
        locale: function() {
            return window.navigator.userLanguage || window.navigator.language;
        }
    }

})();

this.Mstsc = new Mstsc();