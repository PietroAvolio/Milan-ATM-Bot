const request = require('request');
const utils = require('./utils.js');
const config = require('./config/config.js');

const logPrefix = "TW-FET";

const mainIntervalDuration = 120000;
var mainInterval;
var lastTweetId = 0;
var isStartup = true;

process.on('message',function(msg){
	this.start = function(){
		utils.makeLog("Starting...", logPrefix);

		fetchTweets(function(){
			mainInterval = setInterval(function() { fetchTweets(); }, mainIntervalDuration);
		});
	}
	
	this.stop = function(){
		utils.makeLog("Stopping...", logPrefix);
		clearInterval(mainInterval);
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
				
			default:

				break;
		}
		
	}.bind(this)()
});

function fetchTweets(callback){
	request({
		url: 'https://api.twitter.com/1.1/statuses/user_timeline.json?count=500&screen_name=ATMTravelAlerts&exclude_replies=true&include_rts=false&trim_user=true&since_id=' + (lastTweetId+1),
		headers: { 'Authorization': "Bearer " + config.twitterToken }
	}, function(error, response, body){
		if(!error && response.statusCode === 200){
			var tweets = JSON.parse(body);
			
			for(var i = 0; i < tweets.length; i++){
				var t = tweets[i];
				
				if(t.id > lastTweetId){
					lastTweetId = t.id;
				}
				
				parseTweet(t);
			}
				
		}else{
		    utils.makeLog("Unable to fetch tweets.\n" + error + "\nResponse: " + response + "\nBody: " +  body, logPrefix);
		}
		
		if(callback !== undefined){
			callback();
		}

		isStartup = false;
	});
}

function parseTweet(tweet){
	var cleanText = tweet.text.replace(/(#ATM|#Milan|#)/g, "").replace(/&gt;/g, "direction").trim();
    cleanText = cleanText.replace(/(bus|tram)(\d+)/g, "$1 $2");

    for(var i = 0; i < tweet.entities.hashtags.length; i++){
        var hashtag = tweet.entities.hashtags[i];

        if(hashtag.text.startsWith("tram") || hashtag.text.startsWith("bus") || /N\d+|M\d/.test(hashtag.text)){
            var line = hashtag.text.replace(/(bus|tram)/, "");

            if( isTweetValidForLine(hashtag.text, tweet.text) ) {
                try{
                    process.send({
                        "line": line,
                        "message": cleanText,
                        "date": new Date(tweet.created_at),
                        "source": "twitter",
						"issueNotification": !isStartup
                    });
                }catch(err){
                    utils.makeLog("Disconnecting the process..." + err, logPrefix);
                    process.disconnect();
                }
            }
        }
    }
}

function isTweetValidForLine(hashtag, tweet){
    //We should do some magic here to avoid that the tweet is associated with the alternatives.
    //TODO
    return true;
}