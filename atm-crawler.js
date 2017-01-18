const request = require('request');
const logPrefix = "[ATM-CRW] ";

module.exports = {
	searchStop: function(key, callback){
		searchLine(key, callback);
	},
	
	stopIdFromStopCode: function(key, callback){
		getStopId(key, callback);
	},
	
	stopInfo: function(id, callback){
		getStopInfo(id, callback);
	}
};

function searchLine(key, callback){
	request.post({
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		url:     'http://giromilano.atm.it/proxy.ashx',
		body:    "url=tpPortal/tpl/stops/search/" + key
	}, function(error, response, body){
		if(!error && response.statusCode == 200){
			if(callback !== undefined){
				callback(JSON.parse(body));
			}
			
		}else{
			console.log(logPrefix +  "Error while contacting ATM APIs.\n" + error + "\nResponse: " + response + "\nBody: " +  body);
		}
	});
}

function getStopId(key, callback){
	searchLine(key, function(res){
		if(res.length == 1){
			callback(res[0].Code);
		}else{
			callback[undefined];
		}
	});
}

function getStopInfo(id, callback){
	request.post({
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		url:     'http://giromilano.atm.it/proxy.ashx',
		body:    "url=tpPortal/geodata/pois/" + id + "?lang=it"
	}, function(error, response, body){
		if(!error && response.statusCode == 200){
			if(callback !== undefined){
				callback(JSON.parse(body));
			}
			
		}else{
			console.log(logPrefix +  "Error while contacting ATM APIs.\n" + error + "\nResponse: " + response + "\nBody: " +  body);
		}
	});
}