//
//
var http = require('http');
var path = require('path');

var jsdom = require('jsdom');

//still need to add authentication to mongodb
var databaseURI = "mongodb://127.0.0.1:27017";
var mongojs = require('mongojs');
var db = mongojs(databaseURI,["test"]);


var acceptedFields = [
	"Description",
	"Type",
	"Related Series",
	"Associated Names",
	"Genre",
	"Author(s)",
	"Artist(s)",
	"Year"
];




var databaseIndexURL = "http://www.mangaupdates.com/series.html?perpage=100&page=";
var seriesURL = "http://www.mangaupdates.com/series.html?id=";
var pageCount =1;
var totalPages=-1;
var requestStack = [];
var seriesArrays = {};


var SERIESPAGEREQUEST=1;
var LISTPAGEREQUEST = 2;




function addToTable(window){
		var serieslinks = window.$(".series_rows_table .col1 a");
		serieslinks.each(function(index, element){
			var link = window.$(element).attr("href");
			var id = link.match(/\?id=\d+/g);
			if(id){
					id=id[0].substr(4);
				seriesArrays[id] = {
					name:window.$(element).text(),
					_id:id
				};
				requestStack[requestStack.length] = {
					type:SERIESPAGEREQUEST,
					url:seriesURL+id,
					sID:id
				};
				console.log(Object.keys(seriesArrays).length,":",window.$(element).text(),":",id);
			}
		});
}

function enumerateDatabasePages(page,window){
		if(totalPages==-1){
			totalPages = parseInt(window.$("a:contains('Last')").attr("href").match(/\?page=\d+/g)[0].substr(6));
		}
        addToTable(window);
		if(totalPages!=-1 && page<totalPages){
			requestStack[requestStack.length]={
				type:LISTPAGEREQUEST,
				url:databaseIndexURL+(page+1),
				page: page+1
			};
		}
}

function parseSeriesPage(id, window){
	var series = seriesArrays[id];
	series["title"]= window.$("span.releasestitle").text();
	window.$("div.sMember").children(".sCat").each(function(index, element){
		var attr = window.$(element).text();
		if(acceptedFields.indexOf(attr)!=-1){
			var content = window.$(element).next().text();
			series[attr]=content;
			console.log("Data Found:",attr, content);
		}
	});
	db.test.save(series, function(err,docs){
		if(err)
			console.log("MONGODB ERROR:",err);
	});
}


function handleRequest(ind){
	var request = requestStack[ind];
	console.log(ind, request.url);
	jsdom.env(
	  request.url,
	  ["http://code.jquery.com/jquery.js"],
	  function (errors, window) {
			if(!errors){
				if(request.type == LISTPAGEREQUEST)
					enumerateDatabasePages(request.page, window);
				else if(request.type == SERIESPAGEREQUEST){
					parseSeriesPage(request.sID,window);
				}
				
				requestStack.splice(ind,1);
			}else
				console.log("ERRORS",errors);
			setTimeout(
				defaultRequestHandler,
				5000);
	  }
	);
}
function handleRandomRequest(){
	//test to enumerate baka updates site.
	if(requestStack.length!=0){
		var ind = Math.floor(Math.random()*requestStack.length);
		handleRequest(ind);
	}else
		console.log("done with requests!");
}


requestStack[requestStack.length]={
	type:LISTPAGEREQUEST,
	url:databaseIndexURL+1,
	page: 1
};

var defaultRequestHandler = handleRandomRequest;
defaultRequestHandler();
