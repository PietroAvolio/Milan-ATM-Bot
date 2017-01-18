const request = require('request');
const logPrefix = "[ATM-CRW] ";

module.exports = {
	searchStop: function(key, callback){
		searchStop(key, callback);
	},
	
	stopIdFromStopCode: function(key, callback){
		getStopId(key, callback);
	},
	
	stopInfo: function(id, callback){
		getStopInfo(id, callback);
	}
};

function searchStop(key, callback){
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
			callback(undefined);
			console.log(logPrefix +  "Error while contacting ATM APIs.\n" + error + "\nResponse: " + response + "\nBody: " +  body);
		}
	});
}

function getStopId(key, callback){
	searchStop(key, function(res){
		if(res !== undefined && res.length == 1){
			callback(res[0].Code);
		}else{
			callback(undefined);
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