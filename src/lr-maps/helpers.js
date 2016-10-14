module.exports = {
	
	///---------------------------------------------------------------------
	/// returns True if the google.maps namespace exists
	///---------------------------------------------------------------------
	isGoogleMapsApiLoaded: function () {
		if (typeof (google) == "undefined") return false;
		return true;
	},

	///---------------------------------------------------------------------
	/// injects the google maps library (JS file) into the DOM. Also injects
	/// the initMap() function that is needed to get the script going
	///---------------------------------------------------------------------
	loadGoogleMapsApi: function (callback_loadComplete) {
	
		//this is the URL to the API
		var googleMapsApiUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyA3Oa5uLCltGJkIyF5EVmUSQrz7-ujGdQA&callback=initMap";
	
		//once loaded, if the API doesn't find a function named "initMap", it yells
		//by throwing an error. We don't want that, so let's make sure this silly
		//function exists in our code. Inject a script into the body
		var lameScriptTag = document.createElement("script");
		lameScriptTag.innerHTML = "function initMap(){}";
		document.body.appendChild(lameScriptTag);
	
		//now let's load the google maps library. First create a script tag
		var googleMapsScriptTag = document.createElement("script");
		googleMapsScriptTag.src = googleMapsApiUrl;
		googleMapsScriptTag.type = "text/javascript";
		googleMapsScriptTag.onload = callback_loadComplete;
	
		//now inject that script into the body
		document.body.appendChild(googleMapsScriptTag);
	
		//as soon as the script is fetched and loaded, the callback_loadComplete function is called
	},
	
	///-------------------------------------------------------------------------
	/// helper function to perform async Http GET calls
	/// calls the URL, then invokes the callback once the
	/// response is ready to be handled
	/// fakedelay - in case you want it to delay the response (for UI magic!!!)
	///-------------------------------------------------------------------------
	httpGetAsync: function (url, callback, fakedelay) {

		if (!fakedelay) fakedelay = 0;
		
		//create a GET request, assign callback 
		var request = new XMLHttpRequest();
		request.open("GET", url, true);

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
		request.send(null);
	},
	
	///-------------------------------------------------------------------------
	/// Get zip code data from the server for all the zips in 'lstZips'
	/// in parts. Since there are limitations on how long the URL can be for
	/// HTTP requests, its likely that we'll have to handle this in parts
	/// if the user wants to request data for 2000 zipcodes, some zips may 
	/// get missed because of url truncation
	///
	/// To address this, we'll split the list of zips into smaller, manageble 
	/// chunks. Each chunk (which is a subset of the large list) will turn
	/// into a url. These URL will be requested one by one. And when all the requests
	/// have been served, we'll invoke the 'callback'
	///-------------------------------------------------------------------------
	getZipsFromServerInParts: function (lstZips, route, callback) {
		
		if(lstZips.length == 0) callback(null);
		
		//lstZips might be extremely large, so we'll split it into smaller chunk
		//sized lists. For each chunk sized list, we'll form a url and get the data 
		//from the server using the route specified		
		var chunkSize = 80;
		var numChunks = Math.floor(lstZips.length / chunkSize);
		if (lstZips.length % chunkSize > 0) numChunks++;

		var chunkSizedZips = [];
				
		//now we need to create as many lists as indicated in 'numChunks'
		for (var i = 0; i < numChunks; i++) {
			var startChunkAt = i * chunkSize;
			var endChunkAt = startChunkAt + chunkSize;
			chunkSizedZips.push(lstZips.slice(startChunkAt, endChunkAt));
		}
		
		
		//now we have split our larger list in small manageable chunk sizes
		//all these smaller lists contain zip codes, we'll now create URLs 
		//for each smaller list using the route provided as argument
		var urls = [];

		chunkSizedZips.forEach(function (chunk) {
			urls.push('' + route + chunk.join("&"));
		});
				
		//now we have all the urls we need to call in our 'urls' list
		//let's call them one by one. Each call will return a response
		//which will also have to be collated into one big response
		
		var responses = [];
		var GET = this.httpGetAsync;
		var counter = 0;
		
		//call each url, store its response in the list. When the list
		//has as many responses as urls, we know we're done. Invoke the callback
		urls.forEach(function (url) {
			GET(url, function (req) {
				//get this URL
				var resp = null;
				if (req.status == 200) {
					resp = JSON.parse(req.responseText);
					counter++;
				}
				
				//save the response in 'responses'
				responses.push(resp);
				
				//looks like we have no more URLs to fetch, invoke callback												
				if (responses.length == urls.length) { 
					//now every response object (in 'responses') is basically a collection
					//of key value pairs. We want to combine all this into a single object
					
					var bigObject_allZipData = {};
					responses.forEach(function (eachResp) {
						for (var zipcode in eachResp) {
							var dataForZip = eachResp[zipcode];
							bigObject_allZipData[zipcode] = dataForZip;
						}
					});
					
					//now throw it back to the callback
					callback(bigObject_allZipData);
				}
			});
		});

	},
	
	///-------------------------------------------------------------------------
	/// Convert a string of format "lat1,lng1/lat2,lng2/lat3,lng3..."
	/// to a google polygon object that can be drawn on the map. Each coordString
	/// must represent a single polygon
	///-------------------------------------------------------------------------
	converZipToPolygon: function (zipStr, zipData, opacity) {
		
		if(!google.maps) throw "Google Maps API not found!";
		
		//the coordStr data is delimited by "/" character. when we split
		//we get ["lat1,lng1","lat2,lng2",...]
		var coords = [];
		var coordStr = zipData.coords[0];
		var arrPairs = coordStr.split("/");
		var bounds = new google.maps.LatLngBounds();
		
		//Now take that list and turn everything into a json object
		//push that json object into the array 'coords'
		arrPairs.forEach(function (latLngString) {
			
			//string to {lat:.., lng:...}
			var lat = parseFloat(latLngString.split(",")[0]);
			var lng = parseFloat(latLngString.split(",")[1]);
			coords.push({'lat': lat, 'lng': lng});			
			
			//since we're using the bounds object to track the region
			//this polygon spreads over, let's add this point to our
			//bounds object as well
			bounds.extend(new google.maps.LatLng(lat,lng));
		});
		
		//get the center of this region defined by the polygon
		var regionCenter = {lat: bounds.getCenter().lat(), lng: bounds.getCenter().lng()};
		
		//turn that array 'coords' into a google polygon
		var polygon = new google.maps.Polygon({
            paths: coords
            , strokeColor: '#ff0000'
            , strokeOpacity: 0.8
            , strokeWeight: 2
            , fillColor: '#ff0000'
            , fillOpacity: opacity
			, centerCoord: regionCenter
			, tag: zipStr
			, bounds: bounds
        });
		
		return polygon;
	},
	
	///-------------------------------------------------------------------------
	/// Create a google.maps.Marker from the coordinates and the label
	/// provided in the arguments
	///-------------------------------------------------------------------------	
	getCustomMarker: function(coord,label){
		var CustomMarker = require("./customMarker");
		var cusMark = new CustomMarker(coord,label);
		return cusMark;		
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

	///--------------------------------------------------------------
	/// draw the markers on the map
	///--------------------------------------------------------------
	drawMarkersOnMap: function (markers, map) {
		markers.forEach(function (eachMarker) {
			eachMarker.setMap(map);
		});
	},
};

