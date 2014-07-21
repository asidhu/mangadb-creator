var http = require('http');
var path = require('path');

var jsdom = require('jsdom');
var providers = require('./providers.js').providers;

//still need to add authentication to mongodb
var databaseURI = "mongodb://127.0.0.1:27017";
var mongojs = require('mongojs');
var db = mongojs(databaseURI,["test"]);

var REQUEST_TIMEOUT=1000;
var NUMBER_TRIES=5;
var requestHandler = {
	providerIdx:0,
	allSeries:[],
	seriesIdx:-1,
	chaptersIdx:-1,
	numTries:0
};

function num_with_suffix(num){
	var tens = num % 100;
	var ones = num % 10;
	if(tens >10 && tens< 20) return num+"th";
	else if(ones == 1) return num+"st";
	else if (ones == 2) return num+"nd";
	else if (ones == 3) return num+"rd";
	else return num+"th";

}

function advanceProvider(requestHandler){
	requestHandler.providerIdx++;
	//if done with providers finish!
	if(requestHandler.providerIdx>=providers.length){
		console.log("finished all providers... exiting...");
		requestHandler.providerIdx=-1;
	}
}

function advanceSeries(requestHandler){
					console.log("Finished series:",requestHandler.allSeries[requestHandler.seriesIdx].name);
					requestHandler.chaptersIdx=-1;
					db.test.save(requestHandler.allSeries[requestHandler.seriesIdx], function(err,docs){
						if(err)
							console.log("MONGODB ERROR:",err);
					});
					//remove reference from array
					requestHandler.allSeries[requestHandler.seriesIdx]={};
					requestHandler.seriesIdx++;
					if(requestHandler.seriesIdx>=requestHandler.allSeries.length){
						console.log("Finished provider:",provider.name);
						//finished all series. ONTO NEXT PROVIDERRRRRR
						requestHandler.seriesIdx=-1;
						advanceProvider(requestHandler);
					}
}

function advanceChapter(requestHandler){
				console.log("Grabbed " + num_with_suffix(requestHandler.chaptersIdx+1) +" chapter info :",requestHandler.allSeries[requestHandler.seriesIdx].name);
				requestHandler.chaptersIdx++;
				if(requestHandler.chaptersIdx>= requestHandler.allSeries[requestHandler.seriesIdx].numchapters){
					//save series to mongodb and erase info for GC
					advanceSeries(requestHandler);
				}
}

function handleRequest(requestHandler){
	if(requestHandler.providerIdx==-1)return;
	var provider = providers[requestHandler.providerIdx];
	if(requestHandler.seriesIdx==-1){
		//provider series list not downloaded yet.
		if(requestHandler.numTries>NUMBER_TRIES){
			requestHandler.numTries=0;
			console.log("Too many errors getting list of series for provider:", provider, "Moving onto next provider.");
			advanceProvider(requestHandler);
		}
		provider.grabAll(function(error,series){
			if(error){
				console.log("Error getting list of series for provider:",provider,error);
				requestHandler.numTries++;
			}else{
				requestHandler.numTries=0;
				//setup requestHandler for next step
				requestHandler.allSeries=series;
				requestHandler.seriesIdx=0;
				console.log("Grabbed list of series for provider:",provider.name);
			}
			setTimeout(function(){handleRequest(requestHandler);},REQUEST_TIMEOUT);
		});
	}else if(requestHandler.chaptersIdx==-1){
		if(requestHandler.numTries>NUMBER_TRIES){
			requestHandler.numTries=0;
			console.log("Too many errors getting series info(",requestHandler.allSeries[requestHandler.seriesIdx],") for provider:", provider, "Moving onto next series.");
			advanceSeries(requestHandler);
		}
		//series chapter list has not been downloaded.
		provider.grabSeriesDetails(requestHandler.allSeries[requestHandler.seriesIdx],
			function(error,series){
				if(error){
					console.log("Error getting series(",requestHandler.allSeries[requestHandler.seriesIdx],") details for provider:",provider,error);
					requestHandler.numTries++;
				}else{
					requestHandler.numTries=0;
					requestHandler.numTries=0;
					requestHandler.chaptersIdx=0;
					console.log("Grabbed series info:",requestHandler.allSeries[requestHandler.seriesIdx].name);
				}
				setTimeout(function(){handleRequest(requestHandler);},REQUEST_TIMEOUT);
			});
	}
	else{
		//download chapter image list
		//console.log(requestHandler.allSeries[requestHandler.seriesIdx].chapters[requestHandler.chaptersIdx]);
		provider.grabChapterImages(requestHandler.allSeries[requestHandler.seriesIdx].chapters[requestHandler.chaptersIdx],
			function(error,chapter){
				if(error){
					if(error.length){
						var numfailed=0;
						for(var i=0;i<error.length;i++){
							if(error[i]){
								console.log("Error getting picture:",error);
								numfailed++;
							}
						}
						console.log("Missed some pictures for chapter:",requestHandler.allSeries[requestHandler.seriesIdx].chapters[requestHandler.chaptersIdx], ", found:",error.length-numfailed,"/",error.length,":");
						advanceChapter(requestHandler);
					}else{
						console.log("Error getting chapter's(",requestHandler.allSeries[requestHandler.seriesIdx].chapters[requestHandler.chaptersIdx],") pictures for provider:",provider,error);
						requestHandler.numTries++;
					}
				}else{
					advanceChapter(requestHandler);
				}
				setTimeout(function(){handleRequest(requestHandler);},REQUEST_TIMEOUT);
			});
	}
	
	
}

handleRequest(requestHandler);
