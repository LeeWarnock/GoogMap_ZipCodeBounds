
/*********************************************************************
 * App code goes in here
 ********************************************************************/
(function () {
	
	// params object
	var params = {
		initLoc: { lat: 32.7157, lng: -117.1611 },
		domElem: document.getElementById('map'),
		zipcodes: [],
		apiRoute: "/zipcodes?",
		colorNormal: "#9b42f4",
		colorHighlighted:"#bb40f3"
	};

	//UI elements here  
	var button = document.getElementById("btnDo");
	var textBox = document.getElementById("txtData");

	//let's instantiate a new ZipPlotter object. The callback inside
	//this will basically be called once the google maps script is loaded
	new ZipPlotter(params, function (plotterObject) {

		///Event handler for button click
		button.onclick = function () {
			var zips = getZipsFromInput(textBox.value);

			if (validateZips(zips))
				plotterObject.update(zips);
			else
				alert("Invalid input. Check what you've entered again");
		}
		
		plotterObject.zipcode_click = function(polygon,zipcode){
			console.log('clicked',zipcode);
		}

	});

	/*********************************************************************
	 * getZipsFromInput
	 * turn the value of the text box to a list of zipcode strings
	 ********************************************************************/
	function getZipsFromInput(text) {
		var entered = text.trim().replaceAll("\n", '').replaceAll(" ", "");
		var lstZipCodes = entered.split(',');
		return lstZipCodes;
	}

	/*********************************************************************
	 * validateZips
	 * check if all zips inside lstZipcodes are valid (made up of digits)
	 ********************************************************************/
	function validateZips(lstZipcodes) {		
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
	}

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

})();

