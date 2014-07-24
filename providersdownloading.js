/*
	Method of Operation:
	Collect series info and details on each series for each provider, add to array in an object to be sorted by name.
	Search through array for close matches and link records.
	Save results to DB in some format?
*/

//test code
var providerAPI = require("./providers.js");
var fs = require("fs");
var numProvidersFound=0;
var numProvidersNeeded=providerAPI.providers.length;
var numSeriesFound=0;
var numSeriesNeeded=0;
var seriesArray=[];
var grabAllSuccessCreator = function(idx){
	return function(series){
		if(numProvidersFound==-1)return;
		numProvidersFound++;
		var provider=providerAPI.providers[idx];
		numSeriesNeeded+=series.length;
		var success = grabSeriesDetsSuccessCreator(idx);
		for(var i=0;i<series.length;i++){
			providerAPI.grabSeriesDetails(provider,series[i],success,function(error){console.log(error); numSeriesNeeded--;});
		}
	};
};
var s_id=0;
var grabSeriesDetsSuccessCreator = function(pid){ return function(series){
	
	process.stdout.write("Progress: Providers:"+numProvidersFound+"/"+numProvidersNeeded+" Series:"+numSeriesFound+"/"+numSeriesNeeded+"\033[0G");
	numSeriesFound++;
	//should Strip unnecessary chapter info to conserve space
	delete series.chapters;
	series._id = s_id;
	series._provider_id=pid;
	//ADD TO MY DATA STRUCTURE
	seriesArray[s_id]= series;
	s_id++;
	if(numProvidersFound>=numProvidersNeeded && numSeriesFound>=numSeriesNeeded){
		console.log("found all series required begin crosslinking");
		fs.writeFile("seriesArray.json",JSON.stringify(seriesArray));
	}
}};



var absolutefailure = function(err){console.log(err);numProvidersFound=-1;providerAPI.clearAllPending();}
for(var i=0;i<providerAPI.providers.length;i++)
	providerAPI.grabAll(providerAPI.providers[i],grabAllSuccessCreator(i),absolutefailure);