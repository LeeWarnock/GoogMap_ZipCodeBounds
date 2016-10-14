/*******************************************************************
 * This file is used to import the ZipPlotter library and add it
 * to the global namespace (window object).
 * When we build this js file using browserify, we effectively end
 * up creating a single JS library for ZipPlotter 
********************************************************************/

var ZipPlotter = require("./lr-maps/zipPlotter");
window['ZipPlotter'] = ZipPlotter;