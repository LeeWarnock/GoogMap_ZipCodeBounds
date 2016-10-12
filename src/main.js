//import our modules
var gMap = require("./gmap");
var helpers = require("./helpers");


//global objects to track our map 
//and our polygons
var map;
var currentPolygons = [];
var currentMarkers = [];

//flags to toggle visibility of things
var showMarkers = false;
var isPolyOpacityRandom = false;

//TBD - get rid of this when deploying
var fakeDelayMillis = 1000;
var minOpacity = 30, maxOpacity = 70;

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
        zoom: 12
        , center: initLocation
        , mapTypeId: 'terrain'
    });
	
	//Our UI elements
	var button = document.getElementById("btnDo");
    var textBox = document.getElementById("txtData");
	var loader = document.getElementById("progLoader");
	var chkShowMarkers = document.getElementById("chkShowMarkers");
	var chkRandomOpacity = document.getElementById("chkRandomOpacity");
	
    
	///-------------------------------------------------------------------------
	/// Button clicked
	/// This triggers everything
	///-------------------------------------------------------------------------
	button.onclick = function () {
		
		//initialize our flags to match the state of our checkboxes
		isPolyOpacityRandom = chkRandomOpacity.checked;
		showMarkers = chkShowMarkers.checked;
		
		//clear anything that might have been drawn before
		gMap.clearPolygonsOnMap(currentPolygons);
		gMap.clearMarkersOnMap(currentMarkers);
			
		//let's validate what the user's entered
        var entered = textBox.value.trim();			//get rid of all spaces
		var lstZipCodes = entered.split(',');		//split by commas
		
						
		if (helpers.validateZips(lstZipCodes)) {
			
			//show the progress loader
			loader.show();
			
			//all the entered zips are valid. Let's do our thing now...
			//GET all the zip code data from the server
			helpers.getZipsFromServerInParts(lstZipCodes, "/zipcodes?", handleData);
			
			//helpers.httpGetAsync(url, handleResponse, fakeDelayMillis);
		}
		else {
			alert("Dude! You need to enter valid zips. Don't be messing around now.");
		}
	}

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
		drawPolygonsOnMap(thesePolygons);
		if (showMarkers) drawMarkersOnMap(theseMarkers);

	}
	
	///-------------------------------------------------------------------------
	/// handle response of GET call (Server sends zipcode data)
	/// Server's responded, process the response
	///-------------------------------------------------------------------------
	var handleResponse = function (req) {
		loader.hide();
		if (req.status == 200) {
			
			//if the request was executed successfully, get the response
			//parse the response, turn it into a json object
			var response = JSON.parse(req.responseText);
			
			//get a polygon for every zip in the response. store it in
			//a local array called 'thesePolygons'
			var thesePolygons = [];
			var theseMarkers = [];

			for (var zipStr in response) {
				
				//get a random opacity between 0.1 and 0.5 if the flag is true, else just use 0.5
				//dividing by ten since the function returns integers between a certain range
				var opacity = ((isPolyOpacityRandom) ? helpers.getRandomBetweenInts(minOpacity, maxOpacity) : maxOpacity) / 100;
				
				//get the zip, get the polygon for that zip, get the marker for that polygon
				var zipData = response[zipStr];
				var polygon = helpers.converZipToPolygon(zipStr, zipData, opacity);
				var marker = helpers.getCustomMarker(polygon.centerCoord, zipStr);
								
				//push into respective arrays
				thesePolygons.push(polygon);
				theseMarkers.push(marker);
			}
			
			
			//now that we have 'thesePolygons', lets draw them on the map
			drawPolygonsOnMap(thesePolygons);
			if (showMarkers) drawMarkersOnMap(theseMarkers);
		}
		else alert("We tried to ask the server, but something went wrong!");
	}

	///-------------------------------------------------------------------------
	/// draw the polygons on the map
	/// clear the current polygons (if any), then draw the new ones 
	///-------------------------------------------------------------------------
	var drawPolygonsOnMap = function (thesePolygons) {
		currentPolygons = thesePolygons;
		gMap.drawPolygonsOnMap(currentPolygons, map);
	}

	var drawMarkersOnMap = function (theseMarkers) {
		currentMarkers = theseMarkers;
		gMap.drawMarkersOnMap(currentMarkers, map);
	}
});


