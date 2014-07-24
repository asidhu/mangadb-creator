var SERIESARRAY = "./seriesArray.json";
var fs = require("fs");
var seriesArray = JSON.parse(fs.readFileSync(SERIESARRAY));
for(var i=0;i<seriesArray.length;i++){
	if(seriesArray[i].alternatetitles){
		
		for(var j=0;j<seriesArray[i].alternatetitles.length;j++){
			var title=seriesArray[i].alternatetitles[j];
			title = title.split("\r\n");
			if(title.length>1){
				seriesArray[i].alternatetitles.splice(j,1);
				seriesArray[i].alternatetitles = seriesArray[i].alternatetitles.concat(title);
			}
		}
		
		seriesArray[i].name = seriesArray[i].name.trim().replace(/[\r\n]/gm,"");
		for(var j=0;j<seriesArray[i].alternatetitles.length;j++){
			seriesArray[i].alternatetitles[j] = seriesArray[i].alternatetitles[j].trim();
		}
		seriesArray[i].alternatetitles = seriesArray[i].alternatetitles.filter(function(ele,idx,arr){
			var count1 = ele.match(/\?/g) || [];
			var count2 = ele.match(/\w/g) || [];
			return count1.length<count2.length;
		});
	}
}
fs.writeFile("./seriesArray.json", JSON.stringify(seriesArray));