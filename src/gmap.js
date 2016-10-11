/**********************************************************
 * This module does the following:
 * - adds a script tag to the DOM that loads the maps API
 * - invokes the callback after script load
 * - passes the global 'map' object to that callback
**********************************************************/
var map = null;
var urlGoogleMapsApi = "https://maps.googleapis.com/maps/api/js?key=AIzaSyA3Oa5uLCltGJkIyF5EVmUSQrz7-ujGdQA&callback=initMap";

// for some reason, google Maps API wants you to have this ugly
// function titled 'initMap()' sitting in your global namespace
// otherwise it keeps throwing an error.

// So I'm just inserting one here before I actually load the API
// Feel like an idiot doing this, but here goes...
var dumbInitFuncForMapsAPI = "function initMap(){}";
var lameScriptTag = document.createElement("script");
lameScriptTag.innerHTML = dumbInitFuncForMapsAPI;
document.body.appendChild(lameScriptTag);


/***************************************************************
 * This module exports a function called 'load' that will 
 * load the Google Maps API and invoke a call back
***************************************************************/
module.exports = {
	load: function (callAfterLoad) {	
		//create a script tag that points the google maps API
		//this API will create a global class named "google.maps.Map"
		//append this script tag into the DOM, the browser will then load
		//the google maps API
		var scriptTag = document.createElement("script");
		scriptTag.src = urlGoogleMapsApi;
		scriptTag.type = 'text/javascript';
		scriptTag.onload = callAfterLoad;
		document.body.appendChild(scriptTag);
	}
};
