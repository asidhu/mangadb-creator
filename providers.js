













var util = require("util");
var events = require("events");
var fs = require("fs");
var request = require("request");
var providers = [
	(require("./providers/eatmanga.js")),
	(require("./providers/mangareader.js"))
];
var handlers = initHandlers();
function Request() {
	this.attempts=0;
    events.EventEmitter.call(this);
}

util.inherits(Request, events.EventEmitter);

Request.prototype.error = function(data) {
	if(this.attempts<=0){
		this.emit("error", data);
	}else{
		this.handler.pushRequest(this);
	}
}

Request.prototype.done = function(data) {
    this.emit("done", data);
}
Request.prototype.data = function(data) {
    this.emit("data", data);
}
Request.prototype.retry = function(num) {
    this.attempts=num;
	return this;
}





function clearAllPending(){
	for(var i=0;i<providers.length;i++){
		var h =handlers[providers[i].name];
		h.clearRequests();
		
	}
}


function RequestQueue(){
	this.provider = undefined;
	this.queue = [];
	this.timerobject=undefined;
	this.handleRequests= function(){
		if(this.queue.length<=0){
			this.timerobject=undefined;
			return;
		}
		var req = options.reqhandler.pop(this.queue);
		req.func.apply(req,req.args);
		options.reqhandler.erase(this.queue);
		var handler = this;
		this.timerobject = setTimeout(function(){handler.handleRequests();},this.provider.defaultTimeout);
	};
	this.pushRequest= function(req){
		var handler = this;
		if(!this.timerobject){
			this.timerobject = setTimeout(function(){handler.handleRequests();},this.provider.defaultTimeout);
		}
		this.queue.push(req);
	};
	this.clearRequests = function(){
		this.queue=[];
		if(this.timerobject)
			clearTimeout(this.timerobject);
	};
};



/*
	using these functions is safer because they use built in failsafes for each provider as well as attempt a request multiple times in case of a failure.
*/
function grabAll(provider){
	
	var req = new Request();
	req.func= provider.grabAll;
	req.args=[req];
	req.handler = handlers[provider.name];
	handlers[provider.name].pushRequest(req);
	return req;
}

function grabSeriesDetails(provider, series){
	if(!Array.isArray(series)){
		series = [series];
	}
	var req = new Request();
	req.func= provider.grabSeriesDetails;
	req.args=[series[0],req];
	req.list = [];
	req.handler = handlers[provider.name];
	handlers[provider.name].pushRequest(req);
	req.on("data", function(data){
		req.list.push(data);
		if(req.list.length>=series.length){
			req.done(req.list);
		}else{
			req.args=[series[req.list.length],req];
			handlers[provider.name].pushRequest(req);
		}
	});
	return req;
}

function grabChapterPages(provider, chapter){
	if(!Array.isArray(chapter)){
		chapter = [chapter];
	}
	var req = new Request();
	req.func= provider.grabChapterPages;
	req.args=[chapter[0],req];
	req.handler = handlers[provider.name];
	handlers[provider.name].pushRequest(req);
	req.list = [];
	req.on("data", function(data){
		req.list.push(data);
		if(req.list.length>=chapter.length){
			req.done(req.list);
		}else{
			req.args=[chapter[req.list.length],req];
			handlers[provider.name].pushRequest(req);
		}
	});
	return req;
}
function extractImage(provider, chapter,idx){
	var req = new Request();
	req.func= provider.extractImage;
	req.handler = handlers[provider.name];
	handlers[provider.name].pushRequest(req);
	if(!idx){
		if(chapter.imgs.length==1){
			req.args=[chapter,1,req];
			req.list = [chapter.imgs[0]];
		}
		else{
			req.args=[chapter,0,req];
			req.list = [];
		}
		req.on("data", function(data){
			req.list.push(data);
			if(req.list.length>=chapter.pages.length){
				req.done(req.list);
			}else{
				req.args=[chapter,req.list.length,req];
				handlers[provider.name].pushRequest(req);
			}
		});
	}
	else{
		req.args=[chapter,idx,req];
	}
	return req;
}

function downloadImage_helper(img,path,req){
	request(img).pipe(fs.createWriteStream(path)).on("error",function(err){req.error(err);}).on("finish",function(){req.data(img);});
}

function downloadImage(provider, img, path){
	if(!Array.isArray(img) && !Array.isArray(path)){
		img = [img];
		path = [path];
	}
	if(img.length!=path.length)return undefined;
	var req = new Request();
	req.func= downloadImage_helper;
	req.handler = handlers[provider.name];
	handlers[provider.name].pushRequest(req);
	req.args=[img[0],path[0],req];
	req.num=0;
	req.on("data", function(data){
		req.num++;
		if(req.num>=img.length){
			req.done();
		}else{
			req.args=[img[req.num],path[req.num],req];
			handlers[provider.name].pushRequest(req);
		}
	});
	return req;
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
	reqhandler:LIFO
};

function wrap(provider){
	return {
		name:provider.name,
		defaultTimeout:provider.defaultTimeout,
		grabAll:function(){return grabAll(provider);},
		grabSeriesDetails:function(series){return grabSeriesDetails(provider,series);},
		grabChapterPages:function(chapter){return grabChapterPages(provider,chapter);},
		extractImage:function(ch,idx){return extractImage(provider,ch,idx);},
		downloadImage:function(img,path){return downloadImage(provider,img,path);}
	};
}

function wrapall(providers){
	var ret = [];
	for(var i=0;i<providers.length;i++){
		ret.push(wrap(providers[i]));
	}
	return ret;
}
function initHandlers(){
	var handlers={};
	for(var i=0;i<providers.length;i++){
		handlers[providers[i].name] = new RequestQueue();
		handlers[providers[i].name].provider = providers[i];
	}
	return handlers;
}


module.exports= {
	LIFO:LIFO,
	FIFO:FIFO,
	options: options,
	providers:wrapall(providers),
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