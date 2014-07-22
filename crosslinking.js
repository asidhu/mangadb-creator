/*
	Do actual crosslinking of downloaded data from providers...
*/

var fs = require("fs");
var providerAPI = require("./providers.js"); //? not sure if necessary yet
var SERIESDB = "./seriesDB.json";
var SERIESARRAY = "./seriesArray.json";

var seriesDB = JSON.parse(fs.readFileSync(SERIESDB));
var seriesArray = JSON.parse(fs.readFileSync(SERIESARRAY));

