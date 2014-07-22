

module.exports={
requestAPI:requestAPI,
linearBatchRequestAPI:linearBatchRequestAPI
};

var request = require("request");
var cheerio = require("cheerio");
function requestAPI(url, success, failure){
	request(url, function(error,response,html){
		if(!error && response.statusCode == 200){
			var $ = cheerio.load(html);
			success($);
		}
		else{
			if(error){
				if(failure)failure(error);
			}
			else if(failure)
				failure({msg:"HTTP Request failed...",http:response});
		}
	
	});
}


function linearBatchRequestAPI(objectset,callback,options){
	var idx=0;
	var num=objectset.length;
	var numTries=0;
	var error=[];
	error[num]=undefined;
	var numError=0;
	if(!options) options = {};
	if(!options.timeout)options.timeout=1000;
	if(!options.tries)options.tries=10;
	var handler = function(){
		if(idx>=	num){
			if(options.onFinished){
				if(numError>0)
					options.onFinished(error);
				else
					options.onFinished(undefined);
			}
			return;
		}
		requestAPI(objectset[idx].url, function($,req){
			callback(idx,objectset[idx],$);
			idx++;
			numTries=0;
			if(options.timeout>0)
				setTimeout(handler,options.timeout);
			else
				setTimeout(handler,0);
			
		},
		function(error, url){
			numTries++;
			if(numTries<options.tries){
				if(options.timeout>0)
					setTimeout(handler,options.timeout);
				else
					setTimeout(handler,0);
			}else{
				numTries=0;
				idx++;
				error[idx]= {msg:"failed after many tries...",object:objectset[idx],error:error};
				numError++;
				setTimeout(handler,0);
			}
		});
	};
	setTimeout(handler,0);
}
