//San Diego - Initial view of the map
var initLocation = {
    lat: 32.7157
    , lng: -117.1611
};

//ref to the map object
var map = null;
var polygons = [];

/********************************************************************
 * this will be called by the google maps script that is
 * loaded in the previous step
 ********************************************************************/
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14
        , center: initLocation
        , mapTypeId: 'terrain'
    });
}

(function () {
    /********************************************************************
     * Load the other JS scripts dynamically. In this case, the google
     * maps API must be loaded. Once loaded, i will call doStuff()
     ********************************************************************/
    var scriptsToLoad = [
        {
            src: "https://maps.googleapis.com/maps/api/js?key=AIzaSyA3Oa5uLCltGJkIyF5EVmUSQrz7-ujGdQA&callback=initMap"
            , onload: doStuff
        }
    ];
    
    //load everything (dynamically insert script tags for each)
    scriptsToLoad.forEach(function (js, index) {
        var scriptTag = document.createElement("script");
        scriptTag.src = js.src;
        scriptTag.type = 'text/javascript';
        if (js.hasOwnProperty('onload')) scriptTag.onload = js.onload;
        document.body.appendChild(scriptTag);
    });
    
    //references to UI elements
    var button = document.getElementById("btnDo");
    var textBox = document.getElementById("txtData");
    
    
    /********************************************************************
     * Script loading is complete, do this next
     ********************************************************************/
    function doStuff() {
        button.onclick = function () {
            
            //button is clicked!
            //let's get the value of the text field 
            var entered = textBox.value.trim();
            
            //and do some basic validation (alldigits)
            if (entered.match(/^[0-9]+$/) != null) {
                
                //so all the chars in this string are digits
                //now let's ask the server if it has this
                //zipcode in its db
                
                var url = "/zipcode?" + entered;
                
                //create a GET request 
                var request = new XMLHttpRequest();
                
                // handle response here
                request.onreadystatechange = function () {
                    handleResponse(request);
                }
                
                //ready to send it!
                request.open("GET", url, true); 
                request.send(null);
            }
            
        }
    }
    
    /********************************************************************
     * Handle response from the server
     ********************************************************************/
    function handleResponse(request){
        if(request.readyState == 4){
            //request completed
            switch(request.status){
                case 200:
                    //got what we wanted... parse it
                    data = JSON.parse(request.responseText);
                    coordStr = data.coords[0];
                    
                    //coordStr is now a string that has this format
                    // "lat,lng/lat,lng/lat,lng..."
                    //In order to draw it on the map, we need to 
                    //turn it into a list that looks like:
                    //[{lat: ..., lng: ...},{lat:..., lng:...}]
                    
                    var coords = [];
                    
                    arrPairs = coordStr.split("/");
                    arrPairs.forEach(function (latLngString) {
                        var lat = parseFloat(latLngString.split(",")[0]);
                        var lng = parseFloat(latLngString.split(",")[1]);
                        coords.push({
                            'lat': lat
                            , 'lng': lng
                        });
                    });
                    
                    //Great, now coords is a list that we can
                    //draw on our map
                    drawDataOnMap(coords,map);
                    break;
                
                default:
                    //didn't get what we wanted...
                    textBox.value = '';
                    alert("Sorry, we don't have data on this zip");
                    break;
            }
        } 
    }
    
    /********************************************************************
     * when the zip code data is fetched, this function is called to 
     * obtain the polygons and draw them on the google map
     ********************************************************************/
    function drawDataOnMap(arrCoords, map) {
        clearPolygons(polygons);
        try {
            //assume a center for now, pan the map to that coordinate
            var centerLat = arrCoords[0].lat;
            var centerLng = arrCoords[0].lng;
            map.panTo(new google.maps.LatLng(centerLat, centerLng));
            //turn the array of coordinates into a google polygon
            //push that into the global polygons array
            polygons.push(getPolygonFromArrCoords(arrCoords));
            //draw all the polygons in the global polygon array
            //on the map
            polygons.forEach(function (eachPolygon) {
                eachPolygon.setMap(map);
            });
        }
        catch (err) {
            //catch and discard SyntaxError
            throw err;
        }
    }
    
    /********************************************************************
     * Get polygon object from a list of coordinates. List must look like:
     * [{lat:..., lng:...},.......,{lat:..., lng:...}]
     ********************************************************************/
    function getPolygonFromArrCoords(arrCoords) {
        var poly = new google.maps.Polygon({
            paths: arrCoords
            , strokeColor: '#ff0000'
            , strokeOpacity: 0.8
            , strokeWeight: 1
            , fillColor: '#ff0000'
            , fillOpacity: 0.3
        });
        return poly;
    }
    
    /********************************************************************
     * Clear polygons from the map
     ********************************************************************/
    function clearPolygons(allPolygons) {
        if (allPolygons.length == 0) return;
        //go through each polygon in this list, and setMap to null
        allPolygons.forEach(function (poly) {
            if (poly instanceof google.maps.Polygon) {
                poly.setMap(null);
            }
        });
    }
})();