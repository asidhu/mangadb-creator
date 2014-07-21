

module.exports.providers= [
	require("./providers/eatmanga.js"),
	require("./providers/mangareader.js")
];
var requestHandler={
	requestQueues:[]
};

/*
	using these functions is safer because they use built in failsafes for each provider as well as attempt a request multiple times in case of a failure.
*/
function grabAll(provider, cb){
	
}


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