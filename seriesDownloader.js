var providerAPI = require("./providers.js");
var fs = require("fs");
var provider=[0,1];
var numProvidersNeeded=providerAPI.providers.length;
var seriesName="Baby Steps";
var numChaptersNeeded=0;
var numChaptersFound=0;
var numImagesNeeded=0;
var numImagesFound=0;
var numImagesToDownload=0;
var numImagesDownloaded=0;
var seriesArray=[];
var request = require("request");
var mkdirp = require('mkdirp');

providerAPI.options.reqhandler = providerAPI.LIFO;



function pad(s,i){
	i=i-s.length;
	while(i-->0)
		s="0"+s;
	return s;
}

function updateStatus()
{
	process.stdout.write("Progress: Chapters:"+numChaptersFound+"/"+numChaptersNeeded+" Image Extraction:"+numImagesFound+"/"+numImagesNeeded+" Image DL:"+numImagesDownloaded+"/"+numImagesToDownload+"\033[0G");

}


var grabAllSuccessCreator = function(idx){
	return function(series){
		var provider=providerAPI.providers[idx];
		var success = grabSeriesDetsSuccessCreator(idx);
		for(var i=0;i<series.length;i++){
			if(series[i].name.indexOf(seriesName)!=-1)
				providerAPI.grabSeriesDetails(provider,series[i],success,function(error){console.log(error);});
		}
	};
};
var grabChaptersSuccessCreator = function(pid,series,idx){ return function(chapter){
	var provider=providerAPI.providers[pid];
	numImagesNeeded+=chapter.pages.length;
	numChaptersFound++;
	updateStatus();
	for(var i=0;i<chapter.pages.length;i++){
		var success = extractImageSuccess(series,provider,idx,i);
		providerAPI.extractImage(provider,chapter,i,success,function(error){console.log(error);});
	}
}};


var extractImageSuccess =  function(series,provider,chapteridx,imgidx){
	return function(img){
		var dir = "downloaded/"+series.name+"/"+provider.name+"/"+pad(""+chapteridx,4)+"/";
		var imgpath = dir+pad(""+imgidx,5)+".png";
		mkdirp.sync(dir);
		numImagesFound++;
		request(img).pipe(fs.createWriteStream(imgpath)).on("finish",function(){numImagesDownloaded++; updateStatus();});
		numImagesToDownload++;
	};
}
var grabSeriesDetsSuccessCreator = function(idx){ return function(series){
	var provider=providerAPI.providers[idx];
	numChaptersNeeded+=series.numchapters;
	updateStatus();
	for(var i=0;i<series.chapters.length;i++){
		var success = grabChaptersSuccessCreator(idx,series,i);
		providerAPI.grabChapterPages(provider,series.chapters[i],success,function(error){console.log(error);});
	}
}};



var absolutefailure = function(err){console.log(err);numProvidersFound=-1;providerAPI.clearAllPending();}
for(var	 i=0;i<provider.length;i++)
	providerAPI.grabAll(providerAPI.providers[provider[i]],grabAllSuccessCreator(provider[i]),absolutefailure);