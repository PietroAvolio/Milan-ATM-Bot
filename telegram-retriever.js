const request = require('request');
const config = require('./config/config.js');
const utils = require("./utils");

const logPrefix = "TGR-RTR";
const mainIntervalDuration = 2000;

var mainInterval;
var lastUpdateId = 0;
var timedOutError = false;

process.on('message',function(msg){
	
	this.start = function(){
        utils.makeLog("Starting...", logPrefix);
		mainInterval = setInterval(function() { retrieveUpdates(); }, mainIntervalDuration);
	}
	
	this.stop = function(){
		utils.makeLog("Stopping...");
		clearInterval(mainInterval, logPrefix);
	}
	
	this._init = function(){
		utils.makeLog("_init", logPrefix);
		
		switch(msg){
			case 'start':
				this.start();
				break;
				
			case 'stop':
				this.stop();
				break;
		}
		
	}.bind(this)()
});

function retrieveUpdates(){
	request('https://api.telegram.org/bot' + config.telegramToken + '/getUpdates?offset=' + (lastUpdateId+1), { 'timeout': (mainIntervalDuration - (mainIntervalDuration/5)) }, function (error, response, body) {
    
	if (!error && response.statusCode === 200) {
	    timedOutError = false;

		var updates = JSON.parse(body);
		for(var i = 0; i < updates.result.length; i++){
			var elm = updates.result[i];
			
			if(elm.update_id > lastUpdateId){
				lastUpdateId = elm.update_id;
			}
			
			try{
				process.send(elm);
			}catch(err){
                utils.makeLog("Disconnecting the process..." + err, logPrefix);
				process.disconnect();
			}
		}
		
    }else{
	    if(!timedOutError) {
            timedOutError = true;
            utils.makeLog("Unable to retrieve telegram updates.\n" + error + "\nResponse: " + response + "\nBody: " + body, logPrefix);
        }
	}
});
}
