///---------------------------------------------------------------------
/// validate the arguments that were passed to the plotter object

var helper = require("./helpers");

var props = ['initLoc', 'domElem', 'zipcodes', 'apiRoute', 'colorNormal','colorHighlight'];
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

	///global reference to this zipPlotter object
	var thisObj = this;
	
	///input parameters that are passed to this zipPlotter
	var initLoc,
		zipcodes,
		apiRoute,
		mapDomElem,
		colorNormal,
		colorHighlighted;
		
	//lists to store Polygons and Markers that might be drawn on the map
	var polygons = [], markers = [];
	
	//reference to the map object 
	var map = null;
	
	//flags to toggle visibility of markers and polygons
	var isMarkerShown = true, isPolygonShown = true;
	
	//the zip code data (fetched from the server)
	var zipcodeData = null;
	
	//the zoom level below which the marker labels are hidden
	var zoomLevelThreshold = 12;
	
	///---------------------------------------------------------------------
	/// this will initialize a map, configure the object based on the params
	/// provided and then call the callback
	///---------------------------------------------------------------------
	var init = function () {
		if (isParamsValid(params)) {
			
			//save the initial location of the map
			initLoc = params.initLoc;
			mapDomElem = params.domElem;
			colorNormal = params.colorNormal;
			colorHighlighted = params.colorHighlighted;
			
			//draw the map with the initial location
			map = new google.maps.Map(mapDomElem, {
				zoom: 12,
				center: initLoc,
				mapTypeId: 'terrain',
			});
			
			//attach a "zoom changed listener"
			map.addListener('zoom_changed', manageMarkersWithZoom);
			
			//save some of these params, we might need them later
			zipcodes = params.zipcodes;
			apiRoute = params.apiRoute;
			fetchAndDraw();
		}
		else throw "You're missing one or more parameters to create this object"
	}
	
	///---------------------------------------------------------------------
	/// Fetch the data from the server, draw it on the map
	///---------------------------------------------------------------------
	var fetchAndDraw = function () {
		helper.getZipsFromServerInParts(zipcodes, apiRoute, function (data) {
			zipcodeData = data;
			draw(zipcodeData);
		})
	}
	
	///---------------------------------------------------------------------
	/// clear any existing polygons/markers on the map
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

		var mouseEvents = {
			click: thisObj.zipcode_click,
			mouseover: zipcode_mouseover,
			mouseout: zipcode_mouseout
		};

		if (allData != null) {
			clear();
			
			var polygon;
			//now we have all the boundary data from the server
			//let's get a polygon for each of the zipcodes in the data
			for (var zipStr in allData) {
				if (allData[zipStr] != null) {
					var zipData = allData[zipStr];
					polygon = helper.converZipToPolygon(zipStr, zipData, 0.6,mouseEvents);
					
					//configure appearance
					polygon.strokeColor = colorNormal;
					polygon.fillColor = colorNormal;
					polygons.push(polygon);
									
					var marker = helper.getCustomMarker(polygon.centerCoord, zipStr);
					markers.push(marker);
				}
			}

			if (isPolygonShown) helper.drawPolygonsOnMap(polygons, map);
			if (isMarkerShown) helper.drawMarkersOnMap(markers, map);
		}

		callback(thisObj);
	}
	
	///---------------------------------------------------------------------
	/// these methods are called when a polygon (drawn on the map) is clicked,
	/// hovered over or hovered out of. The app developer can override these
	///---------------------------------------------------------------------
	this.zipcode_click = function(polygon,zipcode){
		//Override this in the app
	}
	
	var zipcode_mouseover = function(polygon,zipcode){
		polygon.strokeColor = colorHighlighted;
		polygon.fillColor = colorHighlighted;
		polygon.fillOpacity = 1;
		redrawPolygon(polygon);
	}
	
	var zipcode_mouseout = function(polygon,zipcode){
		polygon.strokeColor = colorNormal;
		polygon.fillColor = colorNormal;
		polygon.fillOpacity = polygon.origOpacity;
		redrawPolygon(polygon);
	}
	
	///---------------------------------------------------------------------
	/// update the data (zipcodes) and redraw the maps
	///---------------------------------------------------------------------
	var redrawPolygon = function(polygon){
		polygon.setMap(null); 
		polygon.setMap(map);
	}
	
	///---------------------------------------------------------------------
	/// update the data (zipcodes) and redraw the maps
	///---------------------------------------------------------------------
	this.update = function (newZips) {
		zipcodes = newZips;
		helper.getZipsFromServerInParts(zipcodes, apiRoute, draw);
	}

	///---------------------------------------------------------------------
	/// this function manages the visibility of the markers based on the 
	/// zoom level of the map. This is the callback for 'zoom_changed' event
	/// for the google map used by this zipPlotter object
	///---------------------------------------------------------------------
	var manageMarkersWithZoom = function () {
		var zoomLevel = map.getZoom();
		console.log("--> zoom:", zoomLevel,"thresh:",zoomLevelThreshold);

		if (isMarkerShown && zoomLevel < zoomLevelThreshold) {
			isMarkerShown = false;
			helper.clearMarkersOnMap(markers);
			console.log("-----> zoomed out, clearing markers", isMarkerShown);

		}
		else if (!isMarkerShown && zoomLevel >= zoomLevelThreshold) {
			isMarkerShown = true;
			helper.drawMarkersOnMap(markers, map);
			console.log("-----> zoomed in, showing markers");
		}
	}
	
	//is the google maps API loaded, start init. If not, load it
	//and then start init
	if (helper.isGoogleMapsApiLoaded()) init(); else helper.loadGoogleMapsApi(init);
};


module.exports = ZipPlotter;