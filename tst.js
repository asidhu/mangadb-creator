var providers = require("./providers.js").providers;


providers[0].grabAll().on("data",function(data){providers[0].grabSeriesDetails(data).on("data",console.log);});