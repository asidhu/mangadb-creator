
var providers = [
	require("./providers/eatmanga.js"),
	require("./providers/mangareader.js")
];


function clearAllPending(){
	for(var i=0;i<providers.length;i++){
		handlers[providers[i].name].clearRequests();
	}
}

function RequestQueue(){
	this.provider = undefined;
	this.queue = [];
	this.attempts =0;
	this.errors=[];
	this.timerObject=undefined;
	this.handleRequests= function(){
		if(this.attempts>this.provider.numAttempts){
			this.attempts=0;
			this.errors=[];
			options.reqhandler.erase(this.queue);// remove first item from queue
		}
		if(this.queue.length<=0){
			this.timerObject=undefined;
			return;
		}
		var handler = this;
		var req = options.reqhandler.pop(this.queue);
		var provider = req.provider;
		var onfailtimeout = provider.failureTimeouts[this.attempts] || provider.failureTimeouts[provider.failureTimeouts.length-1] || provider.defaultTimeout || 500;
		var onsuccesstimeout = provider.defaultTimeout || 500;
		var success = function(arg){
			handler.timerObject=setTimeout(function(){handler.handleRequests();},onsuccesstimeout);
			options.reqhandler.erase(handler.queue);
			req.success(arg);
			handler.attempts=0;
			handler.errors=[];
		};
		var failure = function(arg){
			handler.timerObject=setTimeout(function(){handler.handleRequests();},onfailtimeout);
			handler.errors.push(arg);
			handler.attempts++;
		};
		switch(req.type){
			case 1:
				req.provider.grabAll(success,failure);
				break;
			case 2:
				req.provider.grabSeriesDetails(req.args[0],success,failure);
				break;
			case 3:
				req.provider.grabChapterPages(req.args[0],success,failure);
				break;
			case 4:
				req.provider.extractImage(req.args[0],req.args[1],success,failure);
				break;
		}
	};
	this.pushRequest= function(req){
		if(!this.timerObject){
			var handler = this;
			this.timerObject=setTimeout(function(){handler.handleRequests();},0);
		}
		this.queue.push(req);
	};
	this.clearRequests = function(req){
		if(this.timerObject){
			clearTimeout(this.timerObject);
		}
		this.queue=[];
		this.attempts=0;
		this.errors=[];
	};
};
var handlers = initHandlers();
function initHandlers(){
	var handlers={};
	for(var i=0;i<providers.length;i++){
		handlers[providers[i].name] = new RequestQueue();
		handlers[providers[i].name].provider = providers[i];
	}
	return handlers;
}


/*
	using these functions is safer because they use built in failsafes for each provider as well as attempt a request multiple times in case of a failure.
*/
function grabAll(provider, success,failure){
	var req = {
		provider:provider,
		type:1,
		args:[],
		success:success,
		failure:failure,
	};
	handlers[provider.name].pushRequest(req);
}

function grabSeriesDetails(provider, series, success,failure){
	var req = {
		provider:provider,
		type:2,
		args:[series],
		success:success,
		failure:failure,
	};
	handlers[provider.name].pushRequest(req);
}

function grabChapterPages(provider, chapter, success,failure){
	var req = {
		provider:provider,
		type:3,
		args:[chapter],
		success:success,
		failure:failure,
	};
	handlers[provider.name].pushRequest(req);
}
function extractImage(provider, chapter,idx, success,failure){
	var req = {
		provider:provider,
		type:4,
		args:[chapter,idx],
		success:success,
		failure:failure,
	};
	handlers[provider.name].pushRequest(req);
}

var FIFO ={
	pop:function(queue){
		return queue[0];
	},
	erase:function(queue){
	
		queue.splice(0,1);
	}
};
var LIFO ={
	pop:function(queue){
		return queue[queue.length-1];
	},
	erase:function(queue){
		queue.splice(queue.length-1,1);
	}
};


var options= {
	reqhandler:FIFO
};
module.exports= {
	LIFO:LIFO,
	FIFO:FIFO,
	options: options,
	providers:providers,
	grabAll:grabAll,
	grabSeriesDetails:grabSeriesDetails,
	grabChapterPages:grabChapterPages,
	extractImage:extractImage,
	clearAllPending:clearAllPending,
};

//Other providers to be added later
//=========== mangahere.co EXPORTS
/*
var MangaHere_SERIESDIR="http://www.mangahere.co/mangalist/";
function MangaHere_grabAll(cb){
	request(MangaHere_SERIESDIR, function(error,response,html){
		if(!error && response.statusCode == 200){
			var series =[];	
			var $ = cheerio.load(html);
			$("div.list_manga li a.manga_info").each(function(idx,ele){
				series[series.length] = {
					name: $(ele).text().replace (/(^")|("$)/g, ''),
					url: $(ele).attr("href")
				};
			});
			cb(series);
		}
	
	});
}

//=========== goodmanga EXPORTS

var GoodManga_SERIESDIR="http://www.goodmanga.net/manga-list";
function GoodManga_grabAll(cb){
	request(GoodManga_SERIESDIR, function(error,response,html){
		if(!error && response.statusCode == 200){
			var series =[];	
			var $ = cheerio.load(html);
			$("table.series_index td a").each(function(idx,ele){
				series[series.length] = {
					name: $(ele).text(),
					url: $(ele).attr("href")
				};
			});
			cb(series);
		}
	
	});
}

//========= mangafox EXPORTS
var MangaFox_SERIESDIR = "http://mangafox.me/manga/";
function MangaFox_grabAll(cb){
	request(MangaFox_SERIESDIR, function(error,response,html){
		if(!error && response.statusCode == 200){
			var series =[];	
			var $ = cheerio.load(html);
			$("div.manga_list li a").each(function(idx,ele){
				series[series.length] = {
					name: $(ele).text(),
					url: $(ele).attr("href")
				};
			});
			cb(series);
		}
	
	});
}
*/
/*
MangaReader_grabAll(function(series){

console.log(series);
MangaReader_grabSeriesDetails(series[2], function(series){
	console.log(series);
	//MangaReader_grabChapterImages(series.chapters[0],console.log);
});
//

for(var i=0;i<10;i++)
	MangaReader_grabSeriesDetails(series[Math.floor(Math.random()*series.length)], console.log);

});*/