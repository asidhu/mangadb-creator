var imghash = require("./build/Release/imghash");
var fs = require("fs");
var series1 = "downloaded/Kuroko No Basket/";
var series2 = "downloaded/Baby Steps/";
var log_file = "test-imghash2.log";

process.stdout.write("Enumerating test set1... \033[0G");
var imgs1 = getimgs(series1);
process.stdout.write("Enumerating test set2... \033[0G");
var imgs2 = getimgs(series2);
var numTests=imgs1.length*imgs2.length;
var numTestsCorrect=0;
var numTestsRun =0;
var sensitivity=.1;
var spinning_cursor=["|", "/", "-","\\"];
var cursor_iter=0;
for(var i=0;i<imgs1.length;i++){

	for(var j=0;j<imgs2.length;j++){
		numTestsRun++;
		//all should be false no similarity
		var hash = imghash.imghash(imgs1[i]);//imghash.imgdist(imgs1[i],imgs2[j]);
		console.log(hash);
		hash = imghash.imghash(imgs2[i]);
		console.log(hash);
		if(hash>sensitivity){
			numTestsCorrect++;
			//fs.appendFileSync(log_file,"Passed test:"+imgs1[i]+","+imgs2[j]+",dissimilar,"+hash+"\n");
		}
		else
			fs.appendFileSync(log_file,"Failed test:"+imgs1[i]+","+imgs2[j]+",similar,"+hash+"\n");
		update();
		break;
	}
	break;
}
function update(){
	var freq = 10;
	cursor_iter++;
	if(cursor_iter%freq==0)
		process.stdout.write(spinning_cursor[Math.floor(cursor_iter/freq)%spinning_cursor.length]+"\tTests Passed:("+(numTestsCorrect/numTestsRun*100).toFixed(2)+")"+numTestsCorrect+"/"+numTests+"\033[0G");
}


function getimgs(series){
	var img_list=[];
	var providers = fs.readdirSync(series);
	for(var i=0;i<1;i++){
		var provider = providers[i];
		var chapters = fs.readdirSync(series+"/"+provider);
		for(var j=0;j<chapters.length;j++){
			var chapter =  chapters[j];
			var imgs = fs.readdirSync(series+"/"+provider+"/"+chapter);
			for(var k =0;k<imgs.length;k++){
				img_list.push(series+"/"+provider+"/"+chapter+"/"+imgs[k]);
			}
		}
	}
	return img_list;
}