module.exports = {
	name:"EatManga",
	numAttempts:1,
	defaultTimeout:1000,
	failureTimeouts:[500,10000,120000,300000],
	grabAll:EatManga_grabAll,
	grabSeriesDetails:EatManga_grabSeriesDetails,
	grabChapterPages:EatManga_grabChapterPages,
	extractImage:EatManga_extractImage
};

var common =  require("./providers-common.js");
var requestAPI = common.requestAPI;

var EatManga_ROOTURL = "http://eatmanga.com";
var EatManga_SERIESDIR = "http://eatmanga.com/Manga-Scan/";
function EatManga_grabAll(req){
	requestAPI(EatManga_SERIESDIR, function($){
		var series =[];
		$("table#updates th a").each(function(idx,ele){
			var entry = {
				name: $(ele).text(),
				url: EatManga_ROOTURL+$(ele).attr("href")
			};
			req.data(entry);
			series[series.length] = entry;
		});
		series.name = module.exports.name;
		req.done(series);
	},function(e){req.error(e);});
}

// Get information for the series
function EatManga_grabSeriesDetails(series,req){
	requestAPI(series.url, function($){
			//get images
			var imgs=$("td#info img");
			if(imgs.length>0){
				series.imgs=[];
				imgs.each(function(idx,ele){
					series.imgs[series.imgs.length]=$(ele).attr("src");
				});
			}
			
			//get genre
			var genre = $('table#info_summary th:contains("Genre")').next("td");
			if(genre.length>0)
			{
				series.genre = genre.text().split(",");
				series.genre.every(function(ele,idx,arr){
					arr[idx]=ele.trim();
					return true;
				});
			}
			
			//get Author
			var author = $('table#info_summary th:contains("Author")').next("td");
			if(author.length>0)
				series.author = [ author.text().trim() ];
			
			//get Artist
			var artist = $('table#info_summary th:contains("Artist")').next("td");
			if(artist.length>0)
				series.artist = [ artist.text().trim() ];
			
			//get release year
			var year = $('table#info_summary th:contains("Start Date")').next("td");
			if(year.length>0 && year.text().length>1)
				series.releaseyear = parseInt(year.text());
			
			//get num chapters
			var chs = $('table#info_summary th:contains("Chapters")').next("td");
			if(chs.length>0){
				series.numchapters = parseInt(chs.text().split("-")[0]);
				series.status = chs.text().split("-")[1].trim();
			}
			//get description
			var desc = $("td#info p");
			if(desc.length>0)
				series.description = desc.text().trim();
			
			//get chapters
			var chapters = $("table#updates th.title a");
			if(chapters.length>0){
				series.chapters=[];
				chapters.each(function(idx,ele){
					var href = $(ele).attr("href");
					if(href.toLowerCase().indexOf("/upcoming")==-1)
						series.chapters.splice(0,0,{url:EatManga_ROOTURL+href});
				});
				series.numchapters = series.chapters.length;
			}
			
			
			req.data(series);
		
	},function(e){req.error(e);});
}

function EatManga_grabChapterPages(chapter,req){
	requestAPI(chapter.url, function($){
			//find all pages
			chapter.pages=[];
			chapter.imgs=[];
			var allPages=$("select#pages").first().find("option");
			chapter.numpages = allPages.length;
			allPages.each(function(idx,ele){
				chapter.pages[chapter.pages.length] = EatManga_ROOTURL+$(ele).attr("value");
			});
			var img =$("img#eatmanga_image, img#eatmanga_image_big").attr("src");
			chapter.imgs[0]=img;
			req.data(chapter);
	},function(e){req.error(e);});
}
function EatManga_extractImage(chapter,idx,req){
	requestAPI(chapter.pages[idx], function($){
		var img =$("img#eatmanga_image, img#eatmanga_image_big").attr("src");
		chapter.imgs[idx]=img;
		req.data(img);
	},function(e){req.error(e);});
}