///---------------------------------------------------------------------
/// validate the arguments that were passed to the plotter object

var helper = require("./helpers");

var props = ['initLoc', 'domElem', 'zipcodes', 'apiRoute', 'colorNormal', 'colorHighlighted', 'infoResolver'];
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
 *	--------> mapDomElem 	: the DOM element where the map needs to be drawn
 *  --------> apiRoute	: the API route to get the zip code data from
 *  --------> colorNormal: the color of the polygon in normal state
 *  --------> colorHighlighted: color of the polygon in highlighted state
 *  --------> infoResolver: function to get HTML for tooltips / info windows
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
		colorHighlighted,
		infoResolver;
		
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

	//members to manage infoWindow / tooltip
	var info = null;
	
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
			infoResolver = params.infoResolver;
			
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
			
			//fetch the data from the initial zipcodes and draw it
			helper.getZipsFromServerInParts(zipcodes, apiRoute, draw);
		}
		else throw "You're missing one or more parameters to create this object"
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

		console.log(allData);

		var mouseEvents = {
			click: zipcode_clicked,
			mouseover: zipcode_mouseover,
			mouseout: zipcode_mouseout
		};

		if (allData != null) {
			clear();
			var polygon;
			
			//let's get a polygon for each of the zipcodes in the data
			for (var zipStr in allData) {
				if (allData[zipStr] != null) {
					var zipData = allData[zipStr];
					polygon = helper.converZipToPolygon(zipStr, zipData, 0.6, mouseEvents);
					
					//configure appearance
					polygon.strokeColor = colorNormal;
					polygon.fillColor = colorNormal;
					polygons.push(polygon);

					var textSize = map.getZoom();
					var marker = helper.getCustomMarker(polygon.centerCoord, zipStr, textSize);
					markers.push(marker);
				}
			}

			if (isPolygonShown) helper.drawPolygonsOnMap(polygons, map);
			if (isMarkerShown) helper.drawMarkersOnMap(markers, map);
		}

		callback(thisObj);
	}
	
	///------------------------------------------------------------------------
	/// Show the tooltip / info window over the specified polygon
	///------------------------------------------------------------------------
	var showInfoWindow = function (polygon) {

		if (typeof (infoResolver) == typeof (function () { })) {
			var zipcode = polygon.tag;
			var zipData = polygon.data;
			var infoHtml = infoResolver(zipcode, zipData);
			var infoPosition = { lat: polygon.bounds.getCenter().lat(), lng: polygon.bounds.getCenter().lng() };
			
			//there is no info window shown on the screen
			//let's create one, load the custom html into it and 
			//display it on the screen
			info = new google.maps.InfoWindow({
				content: infoHtml,
				position: infoPosition,
				zipcode: zipcode
			});
			
			//attach an event listener to see when it has been closed by pressing the ("x")
			//this basically resets the 'info' object to null, when the infoWindow is closed
			google.maps.event.addListener(info, 'closeclick', function () { info = null });
			
			//display it on the map
			info.open(map);
		}
	}
	
	
	///---------------------------------------------------------------------
	/// App supplied click event for polygon. Basically, since this function
	/// is attached to "this" object, the app can override this behavior
	/// to do more than what zipPlotter provides
	///---------------------------------------------------------------------
	this.zipcode_click = function (polygon, zipcode, info) {
		//Override this in the app
	}

	///---------------------------------------------------------------------
	/// click event handler
	///---------------------------------------------------------------------
	var zipcode_clicked = function (polygon, zipcode) {
		thisObj.zipcode_click(polygon, zipcode);
	}

	///---------------------------------------------------------------------
	/// mouseover handler for polygon
	///---------------------------------------------------------------------
	var zipcode_mouseover = function (polygon, zipcode) {
		
		if (info == null) {
			showInfoWindow(polygon);
		}
		else if (zipcode != info.zipcode) {
			info.close();
			showInfoWindow(polygon);
		}
		
		polygon.strokeWeight = 4;
		polygon.fillColor = colorHighlighted;
		redrawPolygon(polygon);
	}
	
	///---------------------------------------------------------------------
	/// mouseout handler for polygon
	///---------------------------------------------------------------------
	var zipcode_mouseout = function (polygon, zipcode) {
		polygon.strokeWeight = 2;
		polygon.fillColor = colorNormal;
		redrawPolygon(polygon);
	}
	
	///---------------------------------------------------------------------
	/// update the data (zipcodes) and redraw the maps
	///---------------------------------------------------------------------
	var redrawPolygon = function (polygon) {
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

		if (isMarkerShown && zoomLevel < zoomLevelThreshold) {
			isMarkerShown = false;
			helper.clearMarkersOnMap(markers);
			if (info!=null) info.close();
		}
		else if (!isMarkerShown && zoomLevel >= zoomLevelThreshold) {
			isMarkerShown = true;
			helper.drawMarkersOnMap(markers, map);			
		}
		else {
			draw(zipcodeData);
		}

	}
	
	//is the google maps API loaded, start init. If not, load it
	//and then start init
	if (helper.isGoogleMapsApiLoaded()) init(); else helper.loadGoogleMapsApi(init);
};


module.exports = ZipPlotter;