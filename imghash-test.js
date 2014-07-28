var imghash = require("./build/Release/imghash");
var fs = require("fs");
var series_dir = "downloaded/Kuroko No Basket/";
var log_file = "test-imghash.log";
var providers = fs.readdirSync(series_dir);
var chapters = [];
for(var i=0;i<providers.length;i++){
	var provider = providers[i];
	chapters.push(fs.readdirSync(series_dir+provider).sort());
}

var numTests=0;
var numTestsCorrect=0;
var sensitivity=.1;
for(var i=0;i<chapters[0].length;i++){
	var provider = providers[0];
	//for each chapter test some stuff.
	var imgs = fs.readdirSync(series_dir+provider+"/"+chapters[0][i]);
	numTests+=imgs.length*(imgs.length-1); //test every image against every other image in the chapter.
	numTests+=(imgs.length)*providers.length;	//test every image against every other image in the other providers.
	for(var j=0;j<imgs.length;j++){
		for(var k=0;k<imgs.length;k++){
			if(j!=k){
				var filea=series_dir+provider+"/"+chapters[0][i]+"/"+imgs[j];
				var fileb=series_dir+provider+"/"+chapters[0][i]+"/"+imgs[k];
				var hash = imghash.imgdist(filea,fileb);
				update();
				if(hash>sensitivity)
					numTestsCorrect++;
				else
					fs.appendFileSync(log_file,"Failed test:"+filea+","+fileb+",dissimilar,"+hash+"\n");
			}
		}
	}
	for(var j=0;j<imgs.length;j++){
		for(var k=1;k<providers.length;k++){
			
				var filea=series_dir+providers[0]+"/"+chapters[0][i]+"/"+imgs[j];
				var fileb=series_dir+providers[k]+"/"+chapters[k][i]+"/"+imgs[j];
				var hash = imghash.imgdist(filea,fileb);
				update();
				if(!hash)continue;
				if(hash<sensitivity)
					numTestsCorrect++;
				else
					fs.appendFileSync(log_file,"Failed test:"+filea+","+fileb+",similar,"+hash+"\n");
			
		}
	}
}
function update(){
	process.stdout.write("Progress: Tests Passed:"+numTestsCorrect+"/"+numTests+"\033[0G");
}
