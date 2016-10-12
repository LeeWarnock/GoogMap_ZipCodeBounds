(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
/*********************************************************************
 * String.replaceAll
 * For a string, replace all occurrences of "search" with "replacement"
 ********************************************************************/
String.prototype.replaceAll = function (search, replacement) {
    return this.split(search).join(replacement);
};

/*********************************************************************
 * String.isDigits
 * Return true if all the characters in the string are digits
 *********************************************************************/
String.prototype.isDigits = function () {
	if (this.match(/^[0-9]+$/) != null) return true;
	return false;
}

/*********************************************************************
 * HTMLElement.show
 * set the style.display to inline
 *********************************************************************/
HTMLElement.prototype.show = function () {
	this.style.display = 'inline';
}

/*********************************************************************
 * HTMLElement.hide 
 * Set the style.display to none
 *********************************************************************/
HTMLElement.prototype.hide = function () {
	this.style.display = 'none';
}

/*********************************************************************
 * App specific helpers
*********************************************************************/
module.exports = {
	
	/// validate a given list of zipcodes
	/// each element in the list must be a string composed of
	/// numbers only. Return True if all elements are valid
	validateZips: function (lstZipcodes) {
		
		//let's assume the list is valid
		var isListValid = true;
		
		//go through each element, and ensure its valid
		lstZipcodes.forEach(function (zipString) {
			//if an invalid element is found, change the status
			//of the flag
			if (!zipString.isDigits()) {
				isListValid = false;
				return;
			}
		});

		return isListValid;
	},

	/// helper function to perform async Http GET calls
	/// calls the URL, then invokes the callback once the
	/// response is ready to be handled
	/// fakedelay - in case you want it to delay the response (for UI magic!!!)
	httpGetAsync: function (url, callback, fakedelay) {
		//create a GET request, assign callback 
		var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
			if (request.readyState == 4) {
				
				//type checking for fakedelay, make sure its a number 
				if (typeof (fakedelay) == typeof (1)) {
					setTimeout(function () {
						callback(request);
					}, fakedelay);
				}
				else callback(request);
			}
		}
               
		//ready to send it!
		request.open("GET", url, true);
		request.send(null);
	},

	/// Convert a string of format "lat1,lng1/lat2,lng2/lat3,lng3..."
	/// to a google polygon object that can be drawn on the map. Each coordString
	/// must represent a single polygon
	convertCoordStringToPolygon: function (coordStr) {
		
		if(!google.maps) throw "Google Maps API not found!";
		
		//the coordStr data is delimited by "/" character. when we split
		//we get ["lat1,lng1","lat2,lng2",...]
		var coords = [];
		var arrPairs = coordStr.split("/");
		var bounds = new google.maps.LatLngBounds();
		
		//Now take that list and turn everything into a json object
		//push that json object into the array 'coords'
		arrPairs.forEach(function (latLngString) {
			var lat = parseFloat(latLngString.split(",")[0]);
			var lng = parseFloat(latLngString.split(",")[1]);
			coords.push({
				'lat': lat
				, 'lng': lng
			});
			
			bounds.extend(new google.maps.LatLng(lat,lng));
		});
		
		//get the center of this region defined by the polygon
		var regionCenter = {lat: bounds.getCenter().lat(), lng: bounds.getCenter().lng()};
		
		//turn that array 'coords' into a google polygon
		var polygon = new google.maps.Polygon({
            paths: coords
            , strokeColor: '#ff0000'
            , strokeOpacity: 0.8
            , strokeWeight: 1
            , fillColor: '#ff0000'
            , fillOpacity: 0.3
			, centerCoord: regionCenter
        });
		
		return polygon;
	}

}


},{}],3:[function(require,module,exports){

var gMap = require("./gmap");
var helpers = require("./helpers");
var map;

// this array will contain all the polygons that may be drawn on this
// google map
var currentPolygons = [];

// load the maps module - it will add the google maps script to the body
// and bring us to the callback here
gMap.load(function () {

	//Let's say the init location of the map was San Diego
	var initLocation = {
		lat: 32.7157
		, lng: -117.1611
	}
	
	//let's init our map object and draw something
	//in the DOM element with id 'map'
	map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14
        , center: initLocation
        , mapTypeId: 'terrain'
    });
	
	//Our UI elements
	var button = document.getElementById("btnDo");
    var textBox = document.getElementById("txtData");
	var loader = document.getElementById("progLoader");
    
	/// 1 - Button clicked
	/// This triggers everything
	button.onclick = function () {
		
		//let's validate what the user's entered
        var entered = textBox.value.trim();			//get rid of all spaces
		var lstZipCodes = entered.split(',');		//split by commas
						
		if(helpers.validateZips(lstZipCodes)){
			
			//show the progress loader
			loader.show();
			
			//all the entered zips are valid. Let's do our thing now...
			//GET the /zipcode? route in our local server
			//once the request completes, handle the response
			var url = "/zipcode?" + lstZipCodes.join("&");
			helpers.httpGetAsync(url,handleResponse,1000);
		}
		else{
			alert("Dude! You need to enter valid zips. Don't be messing around now.");
		}
	}
	
	/// 2 - handle response of GET call
	/// Server's responded, process the response
	var handleResponse = function(req){
		loader.hide();
		if(req.status == 200){
			
			//if the request was executed successfully, get the response
			//parse the response, turn it into a json object
			var thesePolygons = [];
			var response = JSON.parse(req.responseText);
			
			for (var zip in response){
				var coordString = response[zip].coords[0];
				var polygon = helpers.convertCoordStringToPolygon(coordString);
				thesePolygons.push(polygon);	
			}
			
			//draw these polygons
			drawPolygonsOnMap(thesePolygons);
		}
		else alert("We tried to ask the server, but something went wrong!");
	}
	
	/// 3 - draw the polygons on the map
	/// Draw the polygons
	var drawPolygonsOnMap = function (polygons){
		
		if(!google.maps) throw "Google Maps API not loaded!";
		
		//this bounds will be useful in understanding the overall
		//region covered by all the zips
		var bounds = new google.maps.LatLngBounds();
		
		//clear the existing polygons (if any are drawn on the map)
		currentPolygons.forEach(function(polyToClear){
			if(polyToClear instanceof google.maps.Polygon){
				polyToClear.setMap(null);
			}
		});
		
		//now let currentPolygons point to the ones we need to draw. At the same
		//time we're adding the centers of the different polygons to our bounds
		currentPolygons = polygons;
		currentPolygons.forEach(function(polyToDraw){
			
			//these are the center coordinates of each polygon
			var lat = polyToDraw.centerCoord.lat;
			var lng = polyToDraw.centerCoord.lng;
			
			//extend the bounds of our region to these coords
			bounds.extend(new google.maps.LatLng(lat,lng));
			
			//draw the polygon
			polyToDraw.setMap(map);
		});
		
		//the polygons are on the map, and now we need to recenter the map
		//let's get the center of the bounds region
		map.panTo(bounds.getCenter());
		map.fitBounds(bounds);
	}	
});



},{"./gmap":1,"./helpers":2}]},{},[3]);
