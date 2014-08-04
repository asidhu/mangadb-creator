var imghash = require("./build/Release/imghash");
var fs = require("fs");
var series1 = "downloaded/Kuroko No Basket/";
var series2 = "downloaded/Baby Steps/";
var log_file = "test-imghash.log";

var imgs1 = getimgs(series1);
var imgs2 = getimgs(series2);
var numTests=0;
var numTestsCorrect=0;
var numTestsRun =0;
var sensitivity=.1;
var spinning_cursor=["|", "/", "-","\\"];
var cursor_iter=0;
var test_name="";
var sumPass=0,numPass=0, minPass=1,maxPass=0;
var sumFail=0,numFail=0, minFail=1,maxFail=0;


test3();
//test1();
//test2();







function test1(){
	test_name = "Provider-Chapter Similarity Test";

	if(imgs1 && imgs1[0] && imgs1[1]){
		var provider1=imgs1[0];
		var provider2=imgs1[1];
		numTests=provider1.length*provider2.length;
		numTestsRun=0;
		numTestsCorrect=0;
		
		for(var i=0;i<provider1.length;i++){
			var chMatches=[];
			
			for(var j=0;j<provider2.length;j++){
				var matches = (testchapter(provider1[i],provider2[j]) / provider1[i].length);
				numTestsRun++;
				if(matches>1){
					log("Chapters are too similar... c:"+i+":"+j);
				}
				else if(matches >.5){
					chMatches.push(j);
					numTestsCorrect++;
				}
					//console.log("\n"+matches+"\n");
				update();
			}
			if(chMatches.length>1){
				log("Chapter has too many matches?!?!!? c:"+i+":"+JSON.stringify(chMatches));
			}
				
		}
		console.log(test_name+" PASS:"+(numTestsCorrect/imgs1[1].length*100).toFixed(2));
		console.log("Avgs: PASS:"+(sumPass/numPass).toFixed(4) +" FAIL:"+(sumFail/numFail).toFixed(4));
		console.log("PASS Max:"+(maxPass) +" Min:"+ minPass);
		console.log("FAIL Max:"+(maxFail) +" Min:"+ minFail);
	}
	else
		console.log(test_name+" cannot be run!");
}

function fast_hash(hash1,hash2){
	for(var i=0;i<hash1.major_hash.length;i++){
		var dx = Math.abs(hash1.major_hash[i] - hash2.major_hash[i]);
		if(dx>.15)
			return false;
	}
	return true;
}

function test3(){
	test_name = "FastHash VS AccuHash";

	if(imgs1 && imgs1[0] && imgs1[1]){
		var provider1=imgs1[0];
		var provider2=imgs1[1];
		numTests=0;
		numTestsRun=0;
		numTestsCorrect=0;
		
		for(var i=0;i<provider1.length;i++){
			for(var j=0;j<provider2.length;j++){
				numTests+= provider1[i].length*provider2[j].length;
				for(var k=0;k<provider1[i].length;k++){
					for(var l =0;l<provider2[j].length;l++){
						var match = imghash.hashdist(provider1[i][k],provider2[j][l]);
						var fast_match = fast_hash(provider1[i][k],provider2[j][l]);
						if((match>.4 && fast_match)){
							numTestsCorrect++;
						}
						if(match > .4)
							numTestsRun++;
					}
				}
				update();
			}
				
		}
		console.log(test_name+" PASS:"+(numTestsCorrect/numTestsRun*100).toFixed(2));
	}
	else
		console.log(test_name+" cannot be run!");
}
function test2(){
	test_name = "Series Imgs Similarity";
	numTestsCorrect=0;
	numTestsRun=0;
	if(imgs1 && imgs2){
		numTests = imgs1[0].length*imgs2[0].length;
		for(var i=0;i<imgs1[0].length;i++){
			for(var j=0;j<imgs2[0].length;j++){
				var matches = testchapter(imgs1[0][i],imgs2[0][j]);
				if(matches>0){
					log("should be no match... ch:"+i+":"+j);
				}
				else
					numTestsCorrect++;
				numTestsRun++;
				update();
			}
		}
		console.log(test_name+" PASS:"+(numTestsCorrect/numTestsRun*100).toFixed(2));
	}
	else
		console.log(test_name+" cannot be run!");
}



function update(){
	var freq = 1;
	cursor_iter++;
	if(cursor_iter%freq==0)
		process.stdout.write(spinning_cursor[Math.floor(cursor_iter/freq)%spinning_cursor.length]+test_name+":PASS("+(numTestsCorrect/numTestsRun*100).toFixed(2)+") RUN("+numTestsRun+"/"+numTests+")\033[0G");
}

function log(str){
	fs.appendFileSync(log_file,str+"\n");
}

function testchapter(chapter1,chapter2){
	var matches=0;
	for(var i=0;i<chapter1.length;i++){
		for(var j=0;j<chapter2.length;j++){
			var dist = imghash.hashdist(chapter1[i],chapter2[j]);
			//console.log(chapter1[i],chapter2[j]);
			//console.log(i,j,dist);
			if(dist>.4){
				matches++;
				sumPass+=dist;
				numPass++;
				if(minPass>dist)minPass=dist;
				if(maxPass<dist)maxPass=dist;
			}
			else{
				sumFail+=dist;
				numFail++;
				if(minFail>dist)minFail=dist;
				if(maxFail<dist)maxFail=dist;
			}
		}
	}
	return matches;
}


function getimgs(series){
	var img_list=[];
	var providers = fs.readdirSync(series);
	var tot=0,num=0;
	for(var i=0;i<providers.length;i++){
		var provider = providers[i];
		var chapters = fs.readdirSync(series+"/"+provider);
		var provider_imgs=[];
		for(var j=0;j<200;j++){
			var chapter =  chapters[j];
			var chapter_imgs=[];
			var imgs = fs.readdirSync(series+"/"+provider+"/"+chapter);
			for(var k =0;k<imgs.length;k++){
				chapter_imgs.push((series+"/"+provider+"/"+chapter+"/"+imgs[k]));
			}
			provider_imgs.push(imghash.imghash(chapter_imgs));
			
			process.stdout.write("Enumerating test set..."+j+"/"+chapters.length+" \033[0G");
		}
		img_list.push(provider_imgs);
	}
	return img_list;
}