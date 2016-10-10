Google Maps Polygons
---------------------
This is a sample application that can be used to test the accuracy of the zip code boundary data of a given source.

There are three major parts to this app:

a. Client side app - stored in "app" directory
b. Server - a small "expressJs" server that serves the client app
c. Data - a json file which will be used by the server to get the data

Before you run the app, ensure that you have a file named "data.json" stored in the 'data' directory. This file will contain the boundary coordinates for all the zipcode you want to test.

I've mined the US Census bureau data and created a data.json to demonstrate the concept. Download it from here:

    https://www.dropbox.com/s/7k89nr8o32cvikf/data.json?dl=0
    
To run the app on your terminal, do this:

a. Ensure you've put data.json in the data directory
b. GoogleMaps_Polygon$ node server.js
c. open your browser to http://localhost:3000 and enter "11102" to test

CLIENT
-------
All the client source code is contained in the app directory. Its pretty basic. Three files:

-- index.html
-- script.js
-- style.css

Basically draws a google map, shows some UI to accept a single zip code, communicates with the server (on localhost:3000) and draws the zip boundary

SERVER
-------
Really tiny nodeJS server. Built using express. It deserializes the contents of "data.json" (turns it into a JS object that stays in the RAM for the runtime of the server). This object also acts as a data store (almost like a cache/db)

The server also provides a routes named 'zipcode', which can be used like so: 

    http://localhost:3000/zipcode?11102

This route will check if the zipcode requested exists in our data store. If it does it will return the boundary data for it. If not, it returns 404.


