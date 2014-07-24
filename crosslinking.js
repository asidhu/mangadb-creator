/*
	Do actual crosslinking of downloaded data from providers...
	
	Basic Algorithm:
	Goal:
	Link documents together if they are determined to be the same by similarity of name via Jaro Winkler Distance.
	Alg:
		Doc A and Doc B are of group size 1,
			Add Doc B to doc A's group and merge list of names for doc a and doc b
		Doc A and Doc B are different sizes, Doc A is larger,
			Add Doc B and associated names(in group) to Doc A's group
			
		Sort names in an array and loop through array, 
	
	
*/



var fs = require("fs");
var natural = require("natural"); //string similarity algorithms specifically Jaro-Winkler Distance
var providerAPI = require("./providers.js"); //? not sure if necessary yet
var SERIESARRAY = "./seriesArray.json";
var seriesArray = JSON.parse(fs.readFileSync(SERIESARRAY));

var name_array=[];
var groupArray = [];
var JWD_SENSITIVITY = .99;
var name_groups = [];
for(var i=0;i<seriesArray.length;i++){
	//assign all Series a unique document ID and group ID
	seriesArray[i].doc_id= i;
	seriesArray[i].group_id =i;
	name_array=(getNamesHelper(seriesArray[i]));
	for(var j=0;j<name_array.length;j++){
		var unscrambled = name_array[j];
		name_array[j] = name_array[j].toLowerCase().split('').sort().join('');
		name_groups.push({name:name_array[j],readable:unscrambled,gid:i, m:0,uid:i});
	}
	//create group for series
	var group ={g_id:i,names:getNamesHelper(seriesArray[i]), series:[seriesArray[i]]};
	for(var j=0;j<group.names.length;j++){
		group.names[j]=group.names[j].toLowerCase();
	}
	groupArray.push(group);
}


//Sort somehow by letter frequency in order to find names that are close


var sorted_names = name_groups.slice();
var sort =function(a,b){if(a.m>b.m)return -1;
		else if(a.b==b.m)return 0;
		else return 1;};
for(var i=0;i<sorted_names.length;i++){
	//generate count of words
	for(var j=0;j<name_groups.length;j++){
		name_groups[j].m = natural.JaroWinklerDistance(sorted_names[i].readable, name_groups[j].readable);
	}
	
	name_groups.sort(sort);
	//console.log(name_groups.slice(0,5));
	var best = [];
	for(var j=0;j<name_groups.length;j++){
		if(sorted_names[i].uid != name_groups[j].uid){
			//var jwd = natural.JaroWinklerDistance(sorted_names[i].readable, name_groups[j].readable);
			if(name_groups[j].m>JWD_SENSITIVITY){
				best.push({b:name_groups[j]});
			}else{
				break;
			}
		}
	}
	for(var j=0;j<best.length;j++){
		if(mergeGroups(sorted_names[i].gid,best[j].b.gid)){
			var oldGID = best[j].b.gid;
			for(var k=0;k<name_groups.length;k++){
				if(name_groups[k].gid == oldGID)
					name_groups[k].gid = sorted_names[i].gid;
			}
			console.log(best[j],sorted_names[i]);
			
			
			break;
		}
	}
	var matched = (seriesArray.length-groupArray.length);
		process.stdout.write("Progress: "+(i/sorted_names.length*100).toFixed(2)+
			"% Matched:("+matched+")"+(matched/seriesArray.length*providerAPI.providers.length*100).toFixed(2)+"%\033[0G");
}

//SORT BY NUMBER OF MATCHING CHARACTERS TO FIND BEST SCORE 
//console.log(name_array);





/*
//iterate over all groups and check for matching names
for(var i=0;i<groupArray.length;){
	var a = groupArray[i];
	for(var j=i+1;j<groupArray.length;j++){
		var b= groupArray[j]; 
		//O(n^2) D: so bad.					
		//loop through i's names and loop through j's names and check similarity
		testGroup(i,j);
	}
	if(i%2==0){
		var matched = (seriesArray.length-groupArray.length);
		process.stdout.write("Progress: "+(i/groupArray.length*100).toFixed(2)+
			"% Matched:("+matched+")"+(matched/seriesArray.length*providerAPI.providers.length*100).toFixed(2)+"%\033[0G");
	}
	i++;
}
process.stdout.write("Progress: "+(i/groupArray.length*100).toFixed(2)+
			"% Matched:"+((seriesArray.length-groupArray.length)/seriesArray.length*providerAPI.providers.length*100).toFixed(2)+"%\033[0G");
for(var i=0;i<groupArray.length;i++){
	console.log(groupArray[i].names +" "+ groupArray[i].series.length);
}
*/


fs.writeFile("./groupDB.json",JSON.stringify(groupArray));
function testGroup(i,j){
	for(var k=0;k<a.names.length;k++){
		for(var l=0;l<b.names.length;l++){
			var res = natural.JaroWinklerDistance(a.names[k],b.names[l]);
			if(res>JWD_SENSITIVITY){
				//console.log("Merging",a,"+",b);
				//found match! yay merge groups
				if(mergeGroups(i,j)){
					k = a.names.length;
					l = b.names.length;
					j--;
				}
			}
		}
	}
}




function mergeGroups(i,j){
	var A = groupArray[i], B = groupArray[j];
	for(var k =0; k<A.series.length;k++){
		for(var l =0;l<B.series.length;l++){
			
			if(A.series[k]._provider_id == B.series[l]._provider_id){
				return false;// cannot merge series from same provider!
			}
			var similarity =0;
				//check other attributes for sameness
			if(A.series[k].status && B.series[l].status){
				if( A.series[k].status!=B.series[l].status)
					similarity--;
				else similarity++;
				}
			if(A.series[k].numchapters && B.series[l].numchapters){
				if (Math.abs(A.series[k].numchapters-B.series[l].numchapters)>1)
					similarity--;
				else similarity++;
			}
			if(A.series[k].releaseyear && B.series[l].releaseyear){
				if( Math.abs(A.series[k].releaseyear-B.series[l].releaseyear)>1){
					similarity--;
				}else similarity++;
			}
			//if(similarity<0)
				//return false;
			
		}
	}
	
	
	
	
	
	//check for any repeating names.
	for(var k =0; k<A.names.length;k++){
		for(var l =0;l<B.names.length;){
			if(A.names[k] == B.names[l]){
				B.names.splice(l,1);
			}else
				l++;
		}
	}
	
	A.names=A.names.concat(B.names);
	A.series = A.series.concat(B.series);
	for(var k=0;k<B.series.length;k++){
		B.series[k].group_id = A.g_id;
	}
	groupArray.splice(j,1);
	return true;
}

function countMatching(strA,strB){
	var aptr=0, bptr=0;
	var m=0;
	while(aptr< strA.length && bptr < strB.length){
		if(aptr==bptr){
			m++;
			aptr++;
			bptr++;
		}else if(strA.charAt(aptr)<strB.charAt(bptr))
			aptr++;
		else
			bptr++;
	}
	return m;
}
function prune(strA,strB){
	var m = countMatching(strA,strB);
	var jwdfake = (m/strA.length + m/strB.length + 1)/3;
	return jwdfake <JWD_SENSITIVITY;
}



function getNamesHelper(series){
	var arr=[];
	if(series.name){
		arr.push(series.name);
	}
	if(series.alternatetitles){
		arr=arr.concat(series.alternatetitles);
	}
	return arr;
}