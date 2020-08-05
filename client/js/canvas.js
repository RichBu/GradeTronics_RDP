/*
 * Copyright (c) 2020 Rich Budek 
 * based on work by others
 *
 * Canvas is the decompressor for bitmaps coming from RDP
 * This file is part of mstsc.js.
 *
 */

(function() {

    /**
     * decompress bitmap from RLE algorithm
     * @param	bitmap	{object} bitmap object of bitmap event of node-rdpjs
     */
    function decompress(bitmap) {
        var fName = null;
        switch (bitmap.bitsPerPixel) {
            case 15:
                fName = 'bitmap_decompress_15';
                break;
            case 16:
                fName = 'bitmap_decompress_16';
                break;
            case 24:
                fName = 'bitmap_decompress_24';
                break;
            case 32:
                fName = 'bitmap_decompress_32';
                break;
            default:
                throw 'invalid bitmap data format';
        }

        var input = new Uint8Array(bitmap.data);
        var inputPtr = Module._malloc(input.length);
        var inputHeap = new Uint8Array(Module.HEAPU8.buffer, inputPtr, input.length);
        inputHeap.set(input);

        var output_width = bitmap.destRight - bitmap.destLeft + 1;
        var output_height = bitmap.destBottom - bitmap.destTop + 1;
        var ouputSize = output_width * output_height * 4;
        var outputPtr = Module._malloc(ouputSize);

        var outputHeap = new Uint8Array(Module.HEAPU8.buffer, outputPtr, ouputSize);

        var res = Module.ccall(fName,
            'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], [outputHeap.byteOffset, output_width, output_height, bitmap.width, bitmap.height, inputHeap.byteOffset, input.length]
        );

        var output = new Uint8ClampedArray(outputHeap.buffer, outputHeap.byteOffset, ouputSize);

        Module._free(inputPtr);
        Module._free(outputPtr);

        return { width: output_width, height: output_height, data: output };
    }

    /**
     * Un compress bitmap are reverse in y axis
     */
    function reverse(bitmap) {
        return { width: bitmap.width, height: bitmap.height, data: new Uint8ClampedArray(bitmap.data) };
    }

    /**
     * Canvas renderer
     * @param canvas {canvas} use for rendering
     */
    function Canvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }

    Canvas.prototype = {
        /**
         * update canvas with new bitmap
         * @param bitmap {object}
         */
        update: function(bitmap) {
            var output = null;
            if (bitmap.isCompress) {
                output = decompress(bitmap);
            } else {
                output = reverse(bitmap);
            }

            // use image data to use asm.js
            var imageData = this.ctx.createImageData(output.width, output.height);
            imageData.data.set(output.data);
            this.ctx.putImageData(imageData, bitmap.destLeft, bitmap.destTop);
        }
    }

    /**
     * Module export
     */
    Mstsc.Canvas = {
        create: function(canvas) {
            return new Canvas(canvas);
        }
    }
})();