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

