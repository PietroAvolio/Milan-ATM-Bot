const timers = require('timers');
const request = require('request');
const config = require('./config/config.js');

const logPrefix = "[TW-RTR] ";
const bearerToken = config.twitterToken;

const mainIntervalDuration = 120000;
var mainInterval;
var lastTweetId = 0;

process.on('message',function(msg){
	this.start = function(){
		console.log(logPrefix + "start");
		fetchTweets(function(){
			mainInterval = timers.setInterval(function() { fetchTweets(); }, mainIntervalDuration);
		});
	}
	
	this.stop = function(){
		console.log(logPrefix + "stop");
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

function fetchTweets(callback){
	request({
		url: 'https://api.twitter.com/1.1/statuses/user_timeline.json?count=500&screen_name=ATMTravelAlerts&exclude_replies=true&include_rts=false&trim_user=true&since_id=' + (lastTweetId+1),
		headers: { 'Authorization': "Bearer " + bearerToken }
	}, function(error, response, body){
		if(!error && response.statusCode == 200){
			var tweets = JSON.parse(body);
			
			for(var i = 0; i < tweets.length; i++){
				var t = tweets[i];
				
				if(t.id > lastTweetId){
					lastTweetId = t.id;
				}
				
				parseTweet(t);
			}
				
		}else{
			console.log(logPrefix +  "Error while retrieving messages.\n" + error + "\nResponse: " + response + "\nBody: " +  body);
		}
		
		if(callback != undefined){
			callback();
		}
	});
}

function parseTweet(tweet){
	var cleanText = tweet.text.replace(/ #\w+,|#\w+,| #\w+|#\w+|: |/g, "").replace(/&gt;/g, "direction").trim();
	
	for(var i = 0; i < tweet.entities.hashtags.length; i++){
		var hashtag = tweet.entities.hashtags[i];
		
		if(hashtag.text.startsWith("tram") || hashtag.text.startsWith("bus") || /N\d+|M\d/.test(hashtag)){
			var line = hashtag.text.replace(/(bus|tram)/, "");
			process.send({"line": line, "text": cleanText, "date": tweet.created_at});
		}
	}
}