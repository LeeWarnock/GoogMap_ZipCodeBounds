//import our modules
var gMap = require("./gmaps/gmap");
var helpers = require("./helpers");

//get the DOM elem where the map will be drawn
var mapElem = document.getElementById('map');

//global objects to track our map 
//and our polygons
var currentPolygons = [];
var currentMarkers = [];

//flags to toggle visibility of things
var showMarkers = false;
var isPolyOpacityRandom = true;

//TBD - get rid of this when deploying
var minOpacity = 15, maxOpacity = 50;

// load the maps module - it will add the google maps script to the body
// and bring us to the callback here
gMap.init(mapElem, function (map) {
	
	console.log("---> Loaded GMaps API")
	
	//Our UI elements
	var button = document.getElementById("btnDo");
    var textBox = document.getElementById("txtData");
	var loader = document.getElementById("progLoader");
	
	///-------------------------------------------------------------------------
	/// Button clicked
	/// This triggers everything
	///-------------------------------------------------------------------------
	button.onclick = function () {
				
		//clear anything that might have been drawn before
		gMap.clearPolygonsOnMap(currentPolygons);
		gMap.clearMarkersOnMap(currentMarkers);
			
		//let's validate what the user's entered
        var entered = textBox.value.trim().replaceAll("\n",'').replaceAll(" ","");			//get rid of all spaces and new lines
		var lstZipCodes = entered.split(',');												//split by commas
								
		if (helpers.validateZips(lstZipCodes)) {
			
			//show the progress loader
			loader.show();
			
			//all the entered zips are valid. Let's do our thing now...
			//GET all the zip code data from the server
			helpers.getZipsFromServerInParts(lstZipCodes, "/zipcodes?", handleData);			
		}
		else {
			alert("Dude! You need to enter valid zips. Don't be messing around now.");
		}
	}
	
	///-------------------------------------------------------------------------
	/// handle the zipcode data returned by the server
	///-------------------------------------------------------------------------
	var handleData = function (data) {
		var thesePolygons = [];
		var theseMarkers = [];
		var failed = [];

		for (var zipStr in data) {

			if (data[zipStr] != null) {	
				//get a random opacity between 0.1 and 0.5 if the flag is true, else just use 0.5
				//dividing by ten since the function returns integers between a certain range
				var opacity = ((isPolyOpacityRandom) ? helpers.getRandomBetweenInts(minOpacity, maxOpacity) : maxOpacity) / 100;
				
				//get the zip, get the polygon for that zip, get the marker for that polygon
				var zipData = data[zipStr];
				var polygon = helpers.converZipToPolygon(zipStr, zipData, opacity);
				var marker = helpers.getCustomMarker(polygon.centerCoord, zipStr);
								
				//push into respective arrays
				thesePolygons.push(polygon);
				theseMarkers.push(marker);
			}
			else {
				console.log('this zipcode', zipStr, "is", data[zipStr]);
				failed.push(zipStr);
			}
		}
		
		loader.hide();
		drawOnMap(thesePolygons, theseMarkers);
	}
	
	///-------------------------------------------------------------------------
	/// draw the polygons and markers on the map	 
	///-------------------------------------------------------------------------
	
	var drawOnMap = function(polygons, markers){
		currentPolygons = polygons;
		currentMarkers = markers;
		gMap.drawPolygonsOnMap(currentPolygons,map);
		gMap.drawMarkersOnMap(currentMarkers,map); 
	}
	
});


