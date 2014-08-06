//database interaction

var databaseURI = "mongodb://127.0.0.1:27017/test";
var mongojs = require('mongojs');
var async = require('async');
var db = mongojs(databaseURI,["master","providers","series","chapters","images"]);
var providerAPI = require("./providers.js");
var mkdirp = require("mkdirp");
var fs = require("fs");
var request = require("request");
var imghash = require("./build/Release/imghash");
var status_stack={};
function reserve_status_stack(prov){
	var stack = status_stack[prov.name] || [];
	for(var i=0;i<stack.length;i++){
		if(stack[i]==undefined){
			stack[i]="";
			status_stack[prov.name]=stack;
			return i;
		}
	}
	stack[stack.length]="";
	status_stack[prov.name]=stack;
	return stack.length;
}
function clear_status_stack(prov,stackpos){
	status_stack[prov.name][stackpos]=undefined;
}
function update_status_stack(prov,stackpos,str){
	status_stack[prov.name][stackpos]=str;
}
function print_status_stack(){
	var len =0;
	for(var key in status_stack){
		process.stdout.write(key+"\033[J\n");
		len++;
		var stack = status_stack[key];
		for(var i=0;i<stack.length;i++){
			if(stack[i]){
				process.stdout.write("\t"+stack[i]+"\033[J\n");
				len++;
			}
		}
	}
	process.stdout.write("\033["+len+"A");
}

function updateProvider(provider, finalCB){
	//get db record of provider and compare series list.
	
	//TODO: prune series that aren't part of db.
	provider.grabAll().retry(5).on("done", function(series){
		db.providers.find({ _id : provider.name},function(err,docs){
			if(err) {
				console.log(err);
				return;
			}
			var db_prov;
			
			if(!docs || docs.length ==0){
				//create new provider
				db_prov = {
					_id: provider.name,
					series:[]
				};
				
				db.providers.save(db_prov);
			}else{
				db_prov=docs[0];
			}
			/*
				now lets create/update all the series in provider
			*/
			var progress=0;
			var stackPos = reserve_status_stack(provider);
			var updateStack = function(){
				update_status_stack(provider,stackPos,"Series:"+progress+"/"+series.length+" ");
				print_status_stack();
			};
			series = series.filter(function(ele){return ele.name=="Fairy Tail";});
			//series=series.slice(0,5);
			async.each(series,function(data,callback){
				updateSeries(data, provider, db_prov,function(err){callback(err);progress++; updateStack(); });
			}, function(err){
				if(err)
					console.log(err);
				db.providers.save(db_prov);
				finalCB();
			});
		});
	});
}
function cleanArray(arr){
  for( var key in arr){
	if(arr[key]==undefined)
		delete arr[key];
  }
  return arr;
}

function updateSeries(series, prov, db_prov, cb){
	//lets add a series if it doesnt exist. 
	//TODO: prune chapters that are part of db but not longer exist.
	prov.grabSeriesDetails(series).retry(5).on("error",function(err){console.log(series,err);cb();}).on("data",function(data){
		db.series.find({ provider : prov.name, name : series.name},function(err,docs){
			if(err) {
				console.log(err);
				cb(err);
				return;
			}
			var db_series;
			var newEntry=false;
			var insert_new_chapters = function(){
				
			}
			
			if(!docs || docs.length ==0){
				//create new provider
				db_series = {
					provider:prov.name,
					name:series.name,
					url: series.url,
					author:series.author,
					artist:series.artist,
					releaseyear: series.releaseyear,
					genre:series.genre,
					imgs:series.imgs,
					status: series.status,
					desc: series.description,
					alternatetitles : series.alternatetitles,
					chapters:[]
				};
				newEntry=true;
				db.series.save(db_series,function(err,res){
					if(err){console.log(err); cb(err);return;}
					if(newEntry){
						db_prov.series.push(db_series._id);
						db.providers.update({_id:prov.name},{$push:{series:db_series._id}});
					}
					cb();
				});
			}else{
				db_series=docs[0];
				db_series.url = series.url;
				db_series.author = series.author;
				db_series.artist = series.artist;
				db_series.releaseyear = series.releaseyear;
				db_series.genre = series.genre;
				db_series.imgs = series.imgs;
				db_series.status = series.status;
				db_series.desc = series.description;
				db_series.alternatetitles = series.alternatetitles;
				db.providers.update({_id:db_series._id},{$set:{
					alternatetitles : series.alternatetitles,
					url: series.url,
					author:series.author,
					artist:series.artist,
					releaseyear: series.releaseyear,
					genre:series.genre,
					imgs:series.imgs,
					status: series.status,
					desc: series.description
				}},
				function(err){
					if(err){console.log(err); cb(err);return;}
					insertChapter(series.chapters[0],prov,db_series, function(){});
					cb();
				});
			}
			
		});
	});
}
function pad(s,i){
	i=i-s.length;
	while(i-->0)
		s="0"+s;
	return s;
}
//chapters arent updated? maybe change this? idk. lol :D 
function insertChapter(chapter, prov, db_series,cb){
	prov.grabChapterPages(chapter).retry(5).on("error",function(err){console.log(chapter,err);cb();}).on("data",function(chapter){
		var numDownloaded=0;
		var stackPos = reserve_status_stack(prov);
		var updateStack = function(){
			update_status_stack(prov,stackPos,"ImgsFound:"+numDownloaded+"/"+chapter.pages.length);
			print_status_stack();
		}
		prov.extractImage(chapter).retry(5).on("error",function(err){console.log(chapter,err);cb();}).on("data",function(){if(numDownloaded<chapter.pages.length){numDownloaded++;updateStack();}}).on("done",function(imgs){
			for(var i=0;i<imgs.length;i++)
				imgs[i] = {
					idx:i,img:imgs[i]
				};
			numDownloaded=0;
			var files = [];
			var updateStack = function(){
				update_status_stack(prov,stackPos,"ImgsDL:"+numDownloaded+"/"+imgs.length);
				print_status_stack();
			};
			updateStack();
			async.eachSeries(imgs, function(in_img, myCB){
				var name = temp_image_folder+"/"+prov.name+db_series.name+pad(""+in_img.idx,3)+".jpg";
				files.push(name);
				prov.downloadImage(in_img.img,name).retry(5).on("done",function(){numDownloaded++;updateStack();myCB();}).on("error",myCB);
				
			}, function(err){
				if(err)
				{
					console.log(err);
					cb();
					return;
				}
				//TODO: handle undefineds in hashs. Means img was not found.
				var hashs=imghash.imghash(files);
				//clean up imgs. dont need them anymore.
				async.map(files,fs.unlink);
				var img_objs = hashs.map(function(value, idx){
					if(!value)
						return {img:imgs[idx]};
					return {
						img:imgs[idx],
						hash:value,
						hist0:value.major_hash[0],
						hist1:value.major_hash[1],
						hist2:value.major_hash[2],
					};
				});
				test_chapter(img_objs,chapter,function(matches){
					//TODO: add matched info to aggregate info in series if applicable.
					var db_chapter = {
						name: chapter.name,
						series_id: db_series._id,
						imgs:[]
					};
					db.chapters.save(db_chapter,function(err, doc){
						if(err){console.log(err);cb();return;}
						db.series.update({_id:db_series._id},{$push:{chapters:db_chapter._id}});
						img_objs=img_objs.map(function(ele){ele.chapter_id = db_chapter._id;});
						db.images.insert(img_objs,function(err,docs){
							if(err)console.log(err);
							if(docs){
								var ids = docs.map(function(){return docs._id;});
								db.chapters.update({_id:db_chapter._id}, {$push:{imgs:ids}},
								function(err,docs)
								{
									if(err)console.log(err);
									cb();
								});
							}else{
								//maybe remove chapter?
								cb();
							}
							
						});
					});
				});
			});
		})
	});
}
function binaryIndexOf(arr,searchElement, cb) {
	'use strict';
	var minIndex = 0;
	var maxIndex = arr.length - 1;
	var currentIndex;
	var currentElement;
	while (minIndex <= maxIndex) {
		currentIndex = (minIndex + maxIndex) / 2 | 0;
		currentElement = arr[currentIndex].chapter_id;
		if (currentElement < searchElement) {
			minIndex = currentIndex + 1;
		}
		else if (currentElement > searchElement) {
			maxIndex = currentIndex - 1;
		}
		else {
			cb(currentElement);
			return 0;
		}
	}
	return minIndex;
}


var general_hash_sensitivity=.2;
function test_chapter(imgobjs, chapter, master_cb){
	var chapter_matches=[];
	async.each(imgobjs,function(img,cb){
		if(!img.hash){cb(); return;}
		db.images.find({hist0:{$gt:img.hist0-general_hash_sensitivity/2, $lt:img.hist0+general_hash_sensitivity/2},
						hist1:{$gt:img.hist1-general_hash_sensitivity/2, $lt:img.hist1+general_hash_sensitivity/2},
						hist2:{$gt:img.hist2-general_hash_sensitivity/2, $lt:img.hist2+general_hash_sensitivity/2}},
						function(err,docs){
							if(err){console.log(err);cb();}
							else if(!docs || docs.length<=0){
								cb();
							}
							else{
								var hashs = docs.map(function(ele){return ele.hash;});
								var matches = imghash.hashdist(img.hash, hashs).reduce(function(ret, val, idx){
									if(val>.4){
										ret.push(docs[idx]);
									}
								},[]);
								matches.forEach(function(val){
									var res = binaryIndexOf(chapter_matches,val.chapter_id,function(ch){
										ch.matched++;
									});
									if(res){
										chapter_matches.splice(res,0,{id:val.chapter_id,matched:1});
										console.log(chapter_matches);
									}
								});
							}
						});
	}, function(err){
		master_cb(null,chapter_matches);
	});
}


var temp_image_folder = "temp-images";
mkdirp.sync(temp_image_folder);
async.each(providerAPI.providers,updateProvider, function(err){
	db.close();
})
