///---------------------------------------------------------------------
/// validate the arguments that were passed to the plotter object

var helper = require("./helpers");

var props = ['initLoc', 'domElem', 'zipcodes', 'apiRoute'];
var isParamsValid = function (params) {
	var keys = Object.keys(params);
	for (var i in props) {
		if (!params.hasOwnProperty(keys[i])) return false;
	}
	return true;
}

/******************************************************************************
 * ZipPlotter - a class that plots various zip codes on a google map
 * Parameters:
 * 	--- params: 
 * 		This is an object that must contain the following fields
 *	--------> initLoc 	: the initial location of the map
 *	--------> zipcodes	: the list of zipcodes that need to be fetched
 *	--------> domElem 	: the DOM element where the map needs to be drawn
 *  --------> apiRoute	: the API route to get the zip code data from
 * 
 * --- callback: 
 * 		This is a function that will be called when the map is loaded
 * 		the callback will also receive a "map" object as a parameter
 ******************************************************************************/
var ZipPlotter = function (params, callback) {

	var thisObj = this;
	var zipcodes, apiRoute, map;
	var polygons = [];
	var markers = [];
	var map = null;
	
	///---------------------------------------------------------------------
	/// this will initialize a map, configure the object based on the params
	/// provided and then call the callback
	///---------------------------------------------------------------------
	var init = function () {
		if (isParamsValid(params)) {
			
			//draw the map with the initial location
			map = new google.maps.Map(params.domElem, {
				zoom: 12,
				center: params.initLoc,
				mapTypeId: 'terrain',
			});
			
			//save some of these params, we might need them later
			zipcodes = params.zipcodes;
			apiRoute = params.apiRoute;
			
			//pull all the data from the data API
			helper.getZipsFromServerInParts(zipcodes, apiRoute, draw);
		}
		else throw "You're missing one or more parameters to create this object"
	}
	
	///---------------------------------------------------------------------
	/// clear any existing polygons on the map
	///---------------------------------------------------------------------
	var clear = function () {
		helper.clearPolygonsOnMap(polygons);
		helper.clearMarkersOnMap(markers);
		polygons = [];
		markers = [];
	}
	
	///---------------------------------------------------------------------
	/// draw all polygons on the map
	///---------------------------------------------------------------------
	var draw = function (allData) {

		if (allData != null) {
			clear();
				
			//now we have all the boundary data from the server
			//let's get a polygon for each of the zipcodes in the data
			for (var zipStr in allData) {
				if (allData[zipStr] != null) {
					var zipData = allData[zipStr];
					var polygon = helper.converZipToPolygon(zipStr, zipData, 0.6);
					var marker = helper.getCustomMarker(polygon.centerCoord, zipStr);
					polygons.push(polygon);
					markers.push(marker);
				}
			}

			helper.drawPolygonsOnMap(polygons, map);
			helper.drawMarkersOnMap(markers, map);
		}
		
		callback(thisObj);
	}
	
	///---------------------------------------------------------------------
	/// update the data (zipcodes) and redraw the maps
	///---------------------------------------------------------------------
	this.update = function (newZips) {
		zipcodes = newZips;
		helper.getZipsFromServerInParts(zipcodes, apiRoute, draw);
	}
	
	//is the google maps API loaded, start init. If not, load it
	//and then start init
	if (helper.isGoogleMapsApiLoaded()) init(); else helper.loadGoogleMapsApi(init);
};




module.exports = ZipPlotter;