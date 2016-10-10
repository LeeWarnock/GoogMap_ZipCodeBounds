/******************************************************************
 * This is a small app that does these things:
 *  a.  serves up the contents of the 'app' dir
 *
 *  b.  turns data/data.json into a js object that will act as 
 *      a fake database of zip code data
 *
 *  c.  Defines API routes for the app to use to get data from
 *      this fake database
******************************************************************/


// STEP 1
/// let's create a JS object in the memory that will be used
/// as a fake database of our zip code data. Since JS objects
/// are already organized by "key/value", this is more like a
/// cache than a db.

var fs = require("fs");                                     
var pathDataFile = __dirname + "/data/data.json";
var contents = fs.readFileSync(pathDataFile,'utf-8');
var zipcodeData = JSON.parse(contents);

/// now all the zip code data sits inside 'zipcodeData' object
/// and can be accessed like : zipcodeData['11102']


// STEP 2
/// let's create our server side now. This server will use express
/// it will run on localhost on port 3000 and serve the app directory
/// This server will also have a route '/zipcode' that will return
/// the zipcode data for the specified zip code
var express = require('express');
var compression = require('compression');

var app = express();
var port = 3000;
var appDir = __dirname + "/app";

/// Define the routes to get zipcode data
/// Typical query would look like:
/// http://localhost:3000/zipcode?11102
/// ===> GET zipcode data for zips 11102

app.use("/zipcode",function(req,res){
    var zip = (Object.keys(req.query))[0];
    res.setHeader('Content-Type', 'application/json');
    
    //if this zip exists in our data, return the json
    if(zipcodeData.hasOwnProperty(zip)){
        res.status(200).send(JSON.stringify(zipcodeData[zip]));
    }
    else {
    //if this zip doesn't exist in our data, send 404
        res.status(404).send({reason:'not found in db'});
    }
    
});

app.use(compression());
app.use(express.static(appDir));
app.listen(process.env.PORT || port);

console.log("\n---> Serving Zipcodes on localhost:",port);

