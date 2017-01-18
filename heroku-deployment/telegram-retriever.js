const timers = require('timers');
const request = require('request');
const config = require('./config/config.js');

const logPrefix = "[TG-RTR] ";
const telegramToken = config.telegramToken;

const mainIntervalDuration = 2000;
var mainInterval;
var lastUpdateId = 0;

process.on('message',function(msg){
	
	this.start = function(){
		console.log(logPrefix + "start");
		mainInterval = timers.setInterval(function() { retrieveUpdates(); }, mainIntervalDuration);
	}
	
	this.stop = function(){
		console.log(logPrefix + "stop");
		clearInterval(mainInterval);
	}
	
	this._init = function(){
		console.log(logPrefix +  "_init");
		
		switch(msg){
			case 'start':
				this.start();
				break;
				
			case 'stop':
				this.stop();
				break;
				
			default:
				console.log(logPrefix + "unhandled " + msg);
				break;
		}
		
	}.bind(this)()
});

function retrieveUpdates(){
	request('https://api.telegram.org/bot' + telegramToken + '/getUpdates?offset=' + (lastUpdateId+1), { 'timeout': (mainIntervalDuration - (mainIntervalDuration/5)) }, function (error, response, body) {
    
	if (!error && response.statusCode == 200) {
		var updates = JSON.parse(body);
		for(var i = 0; i < updates.result.length; i++){
			var elm = updates.result[i];
			
			if(elm.update_id > lastUpdateId){
				lastUpdateId = elm.update_id;
			}
			
			try{
				process.send(elm);
			}catch(err){
				process.disconnect();
			}
		}
		
    }else{
		console.log(logPrefix +  "Error while retrieving messages.\n" + error + "\nResponse: " + response + "\nBody: " +  body);
	}
});
}
