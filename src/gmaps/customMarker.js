if (!google.maps) throw "Ensure that the Google Maps API has been loaded before using this module";

var CustomMarker = function (coords, label) {
	this._div = null;
	this._coords = new google.maps.LatLng(coords.lat,coords.lng);
	this._text = label;
}

CustomMarker.prototype = new google.maps.OverlayView();

CustomMarker.prototype.onAdd = function () {
	var div = document.createElement('div');
	div.style.textAlign = 'center';
	div.style.backgroundColor = "rgb(255,255,255,0.5)";
	div.style.padding = "5px";
	div.style.borderLeftColor = "gray";
	div.style.position = 'absolute';
	div.style.fontSize = '12px';
	div.style.fontWeight = 'bold';
	div.style.zIndex = '1000';
	div.innerHTML = this._text;
	div.className = "zipCodeLabel";
	this._div = div;
	
	var panes = this.getPanes();
	panes.overlayLayer.appendChild(div);
}

CustomMarker.prototype.draw = function(){
	//use the overlay project to translate LatLng value to actual (x,y) coordinates
	var overlayProjection = this.getProjection();
	var point = overlayProjection.fromLatLngToDivPixel(this._coords);	
	
	//use these x,y coordinates to move the div to the appropriate place
	var h = this._div.style.height;
	var w = this._div.style.width;
	
	this._div.style.left =(point.x - (20)) + 'px';
	this._div.style.top = (point.y - (20)) + 'px';
}

CustomMarker.prototype.onRemove = function(){
	this._div.parentNode.removeChild(this._div);
	this._div = null;
}

module.exports = CustomMarker;