ZIP PLOTTER LIBRARY
---------------------
This is the source code for a JS library that will allow you to plot zip code boundaries
on a google map. There are three main components that you must consider - the application, the zipPlotter library
and the server

1. Application
-----------------
There is a sample application in the 'app' directory. The files are:

/app
  
  ---lib								
      ---- zipPlotter.js		
    
  ---index.html					
  ---index.js					
  ---style.css					

The application is pretty simple. It creates a zipPlotter object, and then draws zip code boundaries based on the inputs provided by the user using the HTML form.

2. The ZipPlotter JS Library
-----------------------------
You can find the entire source code for this library in the "src" folder in the project. This folder contains:

/src

---lr-maps/

        ---zipPlotter.js		
        ---helpers.js			
        ---customMarker.js		
      
---makeLib.js						
  
Note: The "makelib.js" file is really just used by the npm build script in package.json

3. App Server
--------------
This is a simple nodeJS server (in server.js) that does these things:

a. When you launch the server, it deserializes "data/data.json" (which is a huge json file containing all the zipcode data) and caches it in the RAM. This will now act like our database
b. It serves the static pages of the app, so basically when you hit "http://localhost:3000", it serves up the 'app' directory
c. It responds to requests that the application makes to get zip code boundary data


GETTING STARTED
----------------
If you're simply looking to run the app, switch to the root directory at the terminal. Then type

$> node server.js

You'll then see the server running on localhost (port 3000). Simply type in "http://localhost:3000" in your browser and you'll get the application

EDITING THE SOURCE
-------------------
If you're looking to build the zip plotter library or make changes to the source code, focus your attention to the "lr-maps" folder. Once you've made your changes, switch
to the project root directory at the terminal, then type:

$> npm run build

This will launch the build script in package.json, which will in turn browserify the whole "src" folder and dump a fresh instance of "zipPlotter.js" in the app/lib directory