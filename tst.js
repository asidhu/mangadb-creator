var imghash = require("./build/Release/imghash");
var hash1 = imghash.imghash("a.png");
var hash2 = imghash.imghash("b.png");
var hash3 = imghash.imghash("c.png");


var x = ["",1.0,{X:"hi"}];
console.log(x);

//console.log(hash1);
//console.log(hash2);

console.log("dist",imghash.hashdist(hash1,hash2));
console.log("dist",imghash.hashdist(hash2,hash3));
console.log("dist",imghash.hashdist(hash1,hash3)); 