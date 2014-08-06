module.exports = {
	name:"MangaReader",
	numAttempts:10,
	defaultTimeout:500,
	failureTimeouts:[500,10000,120000,300000],
	grabAll:MangaReader_grabAll,
	grabSeriesDetails:MangaReader_grabSeriesDetails,
	grabChapterPages:MangaReader_grabChapterPages,
	extractImage:MangaReader_extractImage
};
var common =  require("./providers-common.js");
var requestAPI = common.requestAPI;


var MangaReader_ROOTURL = "http://www.mangareader.net";
var MangaReader_SERIESDIR = "http://www.mangareader.net/alphabetical";
function MangaReader_grabAll(req){
	requestAPI(MangaReader_SERIESDIR, function($){
			var series =[];	
			$("div.series_col div.series_alpha ul li a").each(function(idx,ele){
				var entry = {
					name: $(ele).text(),
					url: MangaReader_ROOTURL+$(ele).attr("href")
				};
				req.data(entry);
				series[series.length] = entry;
			});
			series.name = module.exports.name;
			req.done(series);
	
	},function(e){req.error(e);});
}

// Get information for the series
function MangaReader_grabSeriesDetails( series,req){
	requestAPI(series.url, function($){
			//get images
			var imgs=$("div#mangaimg img");
			if(imgs.length>0){
				series.imgs=[];
				imgs.each(function(idx,ele){
					series.imgs[series.imgs.length]=$(ele).attr("src");
				});
			}
			//get alternate titles
			var alternate = $('div#mangaproperties td:contains("Alternate Name")').next("td");
			if(alternate.length>0 && alternate.text().trim().length>1)
				var titles = alternate.text().split(",");
				if(titles){
					titles.every(function(ele,idx,arr){
						arr[idx]=ele.trim();
						return true;
					});
					titles.filter(function(ele,idx,arr){
						return ele.split('').filter(function(ele,idx,arr){return ele!="?";}).length>0;
					});
					if(titles.length>0)
						series.alternatetitles = titles;
				}
			
			
			//get genre
			var genre = $('div#mangaproperties td:contains("Genre")').next("td").find("a");
			if(genre.length>0)
			{
				series.genre = [];
				genre.each(function(idx,ele){
					series.genre[idx]=$(ele).text().trim();
				});
			}
			
			//get Author
			var author = $('div#mangaproperties td:contains("Author")').next("td");
			if(author.length>0 && author.text().length>1)
				series.author = [ author.text().trim() ];
			
			//get Artist
			var artist = $('div#mangaproperties td:contains("Artist")').next("td");
			if(artist.length>0 && artist.text().length>1)
				series.artist = [ artist.text().trim() ];
			
			//get release year
			var year = $('div#mangaproperties td:contains("Year of Release")').next("td");
			if(year.length>0 && year.text().length>1)
				series.releaseyear = parseInt(year.text());
			//get status
			var status = $('div#mangaproperties td:contains("Status")').next("td");
			if(status.length>0 && status.text().length>1)
				series.status = status.text().trim();
			//get description
			var desc = $("div#readmangasum p");
			if(desc.length>0 && desc.text().length>1)
				series.description = desc.text().trim();
			
			//get chapters
			var chapters = $("div#chapterlist table td a");
			if(chapters.length>0){
				series.numchapters = chapters.length;
				series.chapters=[];
				chapters.each(function(idx,ele){
					var href = $(ele).attr("href");
					series.chapters[idx]={url:MangaReader_ROOTURL+href};
				});
				//remove links to find names
				chapters.remove();
				var names = $("div#chapterlist div.chico_manga").parent();
				if(names.length==series.numchapters){
					names.each(function(idx,ele){
						var title = $(ele).text().trim();
						if(title.indexOf(":")==0)title=title.substr(1).trim();
						if(title.length>1)
							series.chapters[idx].name = title;
					});
				}else{
					console.log("WTF");
				}
			}
			req.data(series);
	
	},function(e){req.error(e);});
}

function MangaReader_grabChapterPages(chapter,req){
	requestAPI(chapter.url, function($){
			//find all pages
			chapter.pages=[];
			chapter.imgs=[];
			var allPages=$("select#pageMenu option");
			chapter.numpages = allPages.length;
			allPages.each(function(idx,ele){
				chapter.pages[chapter.pages.length] = MangaReader_ROOTURL+$(ele).attr("value");
			});
			var img =$("div#imgholder img").attr("src");
			chapter.imgs[0]=img;
			req.data(chapter);
	},function(e){req.error(e);});
}

function MangaReader_extractImage(chapter,idx,req){
	requestAPI(chapter.pages[idx], function($){
		var img =$("div#imgholder img").attr("src");
		chapter.imgs[idx]=img;
		req.data(img);
	},function(e){req.error(e);});
}