//database interaction

var databaseURI = "mongodb://127.0.0.1:27017/test";
var mongojs = require('mongojs');
var db = mongojs(databaseURI,["master","providers","series","chapters","images"]);


function addSeries(series){
	
}
