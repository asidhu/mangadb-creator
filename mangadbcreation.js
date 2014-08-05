//database interaction

var databaseURI = "mongodb://127.0.0.1:27017/test";
var mongojs = require('mongojs');
var db = mongojs(databaseURI,["master","providers","series","chapters","images"]);
var providerAPI = require("./providers.js");

function updateProvider(provider){
	//get db record of provider and compare series list.
	db.providers.find({ _id : provider.name},function(err,docs){
		
		providerAPI.grabAll(provider, function(series){
			for(var i=0;i<series.length;i++){
				updateSeries(series[i]);
			}
			if(!err && (!docs || docs.length==0)){
				//Need to insert new copy of provider.
				//set id to provider.name
				provider._id = provider.name;
				provider.series = series;
				db.providers.save(provider);
			}
		});
	})
}


function updateSeries(series){
	//if series has _id then set to update mode, otherwise attempt to add
	
}

//input: chapter.imgs, maybe name,
// calculates img hashes
// checks img hashes 
function insertChapter(chapter){
	
}