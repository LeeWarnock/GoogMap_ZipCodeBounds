/**********************************************************
 * This module does the following:
 * - adds a script tag to the DOM that loads the maps API
 * - invokes the callback after script load
 * - passes the global 'map' object to that callback
**********************************************************/
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

//Let's say the init location of the map was San Diego
//TBD - this will not exist in the final version
var initLocation = {
	lat: 32.7157
	, lng: -117.1611
}

module.exports = {
	
	///--------------------------------------------------------------
	/// this method loads the Google Maps API using script
	/// injection. Once that API loads, it invokes the callback
	///--------------------------------------------------------------
	init: function (mapElem, callback) {		
		
		//<script> tag params
		var scriptTag = document.createElement("script");
		scriptTag.src = urlGoogleMapsApi;
		scriptTag.type = 'text/javascript';
		
		//once its loaded, do this
		scriptTag.onload = function () {			
			//let's init our map object and draw something
			//in the DOM element with id 'map'
			var map = new google.maps.Map(mapElem, {
				zoom: 12
				, center: initLocation
				, mapTypeId: 'terrain'
			});
			
			//send the map object
			callback(map);
		};
		
		//add the <script> tag
		document.body.appendChild(scriptTag);
	},
	
	///--------------------------------------------------------------
	/// this method will clear the 'polygons' from the map
	/// polygons - the list of polygons you want to clear from the map
	/// to clear a set of polygons, simply make them point to null, instead
	/// of an actual map object
	///--------------------------------------------------------------
	clearPolygonsOnMap: function (polygons) {
		if (google.maps) {
			polygons.forEach(function (eachPoly) {
				eachPoly.setMap(null);
			});
		}
		else throw "Google Maps API not loaded or map object is invalid"
	},

	///--------------------------------------------------------------
	/// this method will draw a list of 'polygons' on the 'map'
	///--------------------------------------------------------------	
	drawPolygonsOnMap: function (polygons, map) {

		if (google.maps && map instanceof google.maps.Map) {		
			
			//We also want to understand where the center of this polygon is
			//we'll do this using a LatLngBounds object provided by google maps
			var bounds = new google.maps.LatLngBounds();
		
			//iterate through each polygon in the list and draw it on the map
			polygons.forEach(function (polyToDraw) {
			
				//these are the center coordinates of each polygon
				var lat = polyToDraw.centerCoord.lat;
				var lng = polyToDraw.centerCoord.lng;
			
				//extend the bounds of our region to include the bounds
				//of this polygon
				//this is very important as it allows you to scale to the
				//correct zoom level 
				bounds.union(polyToDraw.bounds);
				
				//draw the polygon
				polyToDraw.setMap(map);

			});
			
			//the object 'bounds' now contains the largest outer rect
			//that represents the best view of the map. Use this to 
			//recenter the map and adjust the zoom level
			map.panTo(bounds.getCenter());
			map.fitBounds(bounds);
		}
		else throw "Google Maps API not loaded or map object is invalid"
	},
	
	///--------------------------------------------------------------
	/// this method will clear all the 'markers' from the map
	/// markers - a list of google.maps.Marker objects that need to
	/// be cleared from the maps they're currently drawn on
	///--------------------------------------------------------------
	clearMarkersOnMap: function (markers) {
		if (google.maps) {
			markers.forEach(function (eachMarker) {
				eachMarker.setMap(null);
			});
		}
	},

	drawMarkersOnMap: function (markers, map) {
		markers.forEach(function (eachMarker) {
			eachMarker.setMap(map);
		});
	}
}