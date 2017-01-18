/** GLOBAL VARIABLES DECLARATIONS **/
const logPrefix = "[MAIN] ";
const botVersion = "1.0";

const childProcess = require("child_process");
const telegramSender = require("./telegram-sender.js");
const atmStatus = require("./atm-status.js");
const mysql = require("./mysql.js");
const atmCrawler = require("./atm-crawler.js");

var pendingForCommandParam = [];

/** FIRST INSTRUCTION: INIT! **/
init();

/** CORE FUNCTIONS **/
function init(){
	console.log("Welcome to ATM Telegram Bot v." + botVersion+ "\n\n");
	
	console.log(logPrefix + "Starting Twitter retriever...")
	this._twitterRetriever = childProcess.fork('twitter-retriever.js');
	this._twitterRetriever.send("start");
	
	this._twitterRetriever.on('message', function(data){
		onAtmTweet(data);
	}.bind(this))
	
	console.log(logPrefix + "Starting Telegram messages retriever...");
	this._telegramRetriever = childProcess.fork('telegram-retriever.js');
	this._telegramRetriever.send("start");
	
	this._telegramRetriever.on('message', function(data){
		onTelegramUpdate(data);
	}.bind(this))
}

function onAtmTweet(data){
	atmStatus.pushLineInfo(data.line, data.text, new Date(data.date));
	sendNotifications(data.line);
}

function onTelegramUpdate(data){
	var message = data.message;
	
	if(message !== undefined){ //It could be an update message that we ignore
		console.log(logPrefix + message.from.first_name + "[" + message.from.username + "|" + message.from.id + "|" + message.chat.id + "]-> "  + message.text);
		
		if(message.text !== "undefined"){
			handleMessage(message.text, data.message);
		}
	}else if(data.callback_query !== undefined){
		handleCallbackQuery(data.callback_query);
	}
}

function handleMessage(text, messageObject){
	var chat_id = messageObject.chat.id;
	
	if(text.charAt(0) === '/'){
		//Received new command
		switch(text){
			case "/notify":
				mysql.doQuery("INSERT INTO users_botready_notifications VALUES(" + messageObject.from.id + ")");
				telegramSender.plainTextResponse("Ok dude, we will notify you as soon as the BOT will be ready ðŸ˜Ž", chat_id);
				break;
				
			case "/status":
				mysql.doQuery("SELECT line_sought, count(*) as times FROM users_lines_searches WHERE user_id = " + messageObject.from.id + " GROUP BY line_sought ORDER BY times DESC LIMIT 4", function(error, results, fields){
					var inlineKeyboardKeys = [[]];
					var messageText;
					
					if(results.length > 0){
						messageText = "Type the number of the line you want to check or click one of the lines you search the most";
						for(var i = 0; i < results.length; i++){
							inlineKeyboardKeys[0].push( {"text": results[i].line_sought.toString(), "callback_data": results[i].line_sought.toString()} );
						}
					}else{
						messageText = "Type the number of the line you want to check";
						inlineKeyboardKeys = undefined;
					}
					
					telegramSender.plainTextResponse(messageText, chat_id, inlineKeyboardKeys);
					pendingForCommandParam[chat_id.toString()] = "/status";
				});
				break;
				
			case "/start":
			case "/help":
				telegramSender.plainTextResponse("/status - Information about a transportation line\n/enablenotifications - Enable notifications for a transporation line\n/stopinfo - Get lines and wait times for a stop\n/disablenotifications - Disable notifications for a transportation line\n/unsavestop - Remove a stop from your saved ones\n/help - Detailed description of the available commands\n/info - Information about this bot", chat_id);
				
				if(text == "/start"){
					mysql.doQuery("INSERT INTO users(userid) VALUES(" + messageObject.from.id + ")");
				}
				break;
				
			case "/enablenotifications":
				telegramSender.plainTextResponse("Type the number of the line you want to be notified for", chat_id);
				pendingForCommandParam[chat_id.toString()] = "/enablenotifications";
				break;
				
			case "/disablenotifications":
				mysql.doQuery("SELECT line FROM users_lines_notifications WHERE userid = " + messageObject.from.id + " ORDER BY line DESC", function(error, results, fields){
					var messageText;
					var inlineKeyboardKeys = [[]];
					
					if(results.length > 0){
						for(var i = 0; i < results.length; i++){
							inlineKeyboardKeys[0].push({ "text": results[i].line, "callback_data": results[i].line });
						}
						messageText = "Select the line for which you don't want to receive notifications anymore";
					}else{
						inlineKeyboardKeys = undefined;
						messageText = "You didn't enabled notifications for any line yet";
					}
					
					telegramSender.plainTextResponse(messageText, chat_id, inlineKeyboardKeys);
					pendingForCommandParam[chat_id.toString()] = "/disablenotifications";
				});
				break;
				
			case "/stopinfo":
				var messageText;
				var inlineKeyboardKeys;
				
				mysql.doQuery("SELECT stopNumber, stopDescription FROM users_saved_stops WHERE userid = " + messageObject.from.id, function(error, results, fields){
					if(results.length > 0){
						messageText = "Type the address or the code of a stop, or pick one of your ❤️️ saved stops";
						inlineKeyboardKeys = [];
						for(var i = 0; i < results.length; i++){
							inlineKeyboardKeys.push([{text: results[i].stopDescription, callback_data: results[i].stopNumber.toString()}]);
						}
					}else{
						messageText = "Type the address of the stop or its code";
					}
					
					telegramSender.plainTextResponse(messageText, chat_id, inlineKeyboardKeys);
					pendingForCommandParam[chat_id.toString()] = "/stopinfo";
				});
				break;
				
			case "/info":
				mysql.doQuery("SELECT count(*) AS count FROM users", function(error, results, fields){
					telegramSender.plainTextResponse("I'm glad you're here! 😍\n\nThis bot was developed by Pietro Avolio (http://fb.me/pietro.avolio) and served so far " + results[0].count + " users.\n\nIf you find it usefull, why don't you buy me a coffee? https://www.paypal.me/dreamerspillow \n\n⚠️️ Please notice that this bot is totally unofficial and it is not related to Azienda Trasporti Milanesi S.p.A in any way", chat_id);
				});
				break;
				
			case "/unsavestop":
				mysql.doQuery("SELECT * FROM users_saved_stops WHERE userid = " + messageObject.from.id + "", function(error, results, fields){
						if(results.length > 0){
							var inlineKeyboardKeys = [];
							for(var i = 0; i < results.length; i++){
								inlineKeyboardKeys.push( [{'text': results[i].stopDescription, 'callback_data': results[i].stopId.toString()}] );
							}
							
							telegramSender.plainTextResponse("Select the stop you want to remove from your saved stops", chat_id, inlineKeyboardKeys);
							pendingForCommandParam[chat_id.toString()] = "/unsavestop";
						}else{
							telegramSender.plainTextResponse("You didn't save any stop yet 🙄 Use /stopinfo to search and save a stop", chat_id);
						}
				});
				break;
				
			default:
				break;
		}
	}else{
		//Received plain text
		if(pendingForCommandParam[chat_id.toString()] !== undefined){
			messageToPendingCommand(text, pendingForCommandParam[chat_id.toString()], messageObject, false);
			pendingForCommandParam[chat_id.toString()] = undefined;
		}
	}
}

function handleCallbackQuery(callbackQueryObject){
	var chat_id = callbackQueryObject.message.chat.id;
	
	if(pendingForCommandParam[chat_id.toString()] !== undefined){
		messageToPendingCommand(callbackQueryObject.data, pendingForCommandParam[chat_id.toString()], callbackQueryObject.message, true);
		pendingForCommandParam[chat_id.toString()] = undefined;
	}
	
	telegramSender.answerInlineQuery(callbackQueryObject);
}

function messageToPendingCommand(text, command, messageObject, fromCallbackQuery){
	var chat_id = messageObject.chat.id;
	var sender_id = messageObject.from.id;
	if(fromCallbackQuery){
		sender_id = messageObject.chat.id;
	}
	
	switch(command){
		case "/status":
			telegramSender.plainTextResponse(atmStatus.getInfo(text), chat_id);
			mysql.doQuery("INSERT INTO users_lines_searches (user_id, line_sought) VALUES(" + sender_id + ", '" + text + "')");
			break;
		
		case "/enablenotifications":
			mysql.doQuery("INSERT INTO users_lines_notifications(userid, line) VALUES(" + sender_id + ", '" + text + "')", function(error, results, fields){
				if(!error){
					telegramSender.plainTextResponse("You will be notified if something happens on line " + text + " 😏\n\nPlease take into account that this service is based on ATM Travel Alerts on twitter and it will be available only Mon-Fri 7am-8pm 😬", chat_id);
				}
			});
			break;
		
		case "/disablenotifications":
			mysql.doQuery("DELETE FROM users_lines_notifications WHERE userid = " + sender_id + " AND line = '" + text + "'", function(error, results, fields){
				telegramSender.plainTextResponse("Ok, you will not receive notifications for line " + text + " anymore 👍", chat_id);
			});
			break;
		
		case "/stopinfo":
			atmCrawler.searchStop(text, function(response){
				
				if(response.length == 0){
					telegramSender.plainTextResponse("I can't find any stop for 🤔" + text + " ", chat_id);
					
				}else if(response.length == 1){
					atmCrawler.stopIdFromStopCode(text, function(stopId){
						atmCrawler.stopInfo(stopId, function(res){
							buildStopInlineKeyboardKeys(sender_id, stopId, function(inlineKeyboardKeys){
								telegramSender.plainTextResponse(buildStopInfoMessage(res), chat_id, inlineKeyboardKeys);
								pendingForCommandParam[chat_id.toString()] = "/savestop";
							});
						});
					});
				}else{
					for(var i = 0; i < response.length; i++){	
						telegramSender.plainTextResponse(buildStopInfoMessage(response[i]), chat_id);
					}
					
					telegramSender.plainTextResponse("👉 Type the code of one of the stops found 👈", chat_id);
					pendingForCommandParam[chat_id.toString()] = "/stopinfo_2";
				}
			});
			break;
		
		case "/stopinfo_2":
			atmCrawler.stopIdFromStopCode(text, function(stopId){
				if(stopId !== undefined){
					atmCrawler.stopInfo(stopId, function(res){			
						buildStopInlineKeyboardKeys(sender_id, stopId, function(inlineKeyboardKeys){
							telegramSender.plainTextResponse(buildStopInfoMessage(res), chat_id, inlineKeyboardKeys);
							pendingForCommandParam[chat_id.toString()] = "/savestop";
						});
					});
				}else{
					telegramSender.plainTextResponse("I can't find any stop with code " + text, chat_id);
				}
			});
			break;
			
		case "/savestop":
			atmCrawler.stopInfo(text, function(res){
				if(res !== undefined){
					var stopDescription = res.Description + ", lines ";
					for(var i = 0; i < res.Lines.length; i++){
						stopDescription = stopDescription.concat(res.Lines[i].Line.LineCode + " ");
					}
					
					mysql.doQuery("INSERT INTO users_saved_stops(userid, stopid, stopNumber, stopDescription) VALUES(" + sender_id + ", " + text + ", " + res.CustomerCode + ", '" + stopDescription + "')", function(error, results, fields){
						telegramSender.plainTextResponse("Stop saved 👍", chat_id);
					});
				}
			});
			break;
			
		case "/unsavestop":
			mysql.doQuery("DELETE FROM users_saved_stops WHERE userid = " + sender_id + " AND stopId = " + text + " LIMIT 1", function(error, results, fields){
				telegramSender.plainTextResponse("Stop unsaved 👍", chat_id);
			});
			break;
			
		default:
			console.log(logPrefix + "messageToPendingCommand switch to " + command + " not found");
			break;
	}
}

function sendNotifications(line){
	mysql.doQuery("SELECT userid FROM users_lines_notifications WHERE line = '" + line + "'", function(error, results, fields){
		for(var i = 0; i < results.length; i++){
			telegramSender.plainTextResponse(atmStatus.getInfo(line), results[i].userid);
		}
	});
}

function buildStopInfoMessage(stopInfo){
	var str = "";
	
	switch(stopInfo.Category.CategoryId){
		case '19': //Metro
			str = "🚇 ";
			break;
			
		case '20': //Superficie
			str = "🚍 ";
			break;
			
		case '27': //Passante
			str = "🚆  "
			break;
			
		default:
			str = "";
			break;
	}
	
	str = str.concat(stopInfo.Description + " (Code " + stopInfo.CustomerCode + ")\n\n");
	for(var i = 0; i < stopInfo.Lines.length; i++){
		var l = stopInfo.Lines[i].Line;
	
		var waitMessage;
		if(stopInfo.Lines[i].WaitMessage === null || stopInfo.Lines[i].WaitMessage === undefined){
			waitMessage = "";
		}else{
			waitMessage = "[" + stopInfo.Lines[i].WaitMessage + "] ";
		}
		
		str = str.concat( waitMessage + l.LineCode.toString().replace(/-(\d)/, "M$1") + ": " + l.LineDescription + "\n" );
	}
	
	return str;
}

function buildStopInlineKeyboardKeys(caller_id, stop_id, callback){
	mysql.doQuery("SELECT * FROM users_saved_stops WHERE userid = " + caller_id + " AND stopId = " + stop_id + " LIMIT 1", function(error, results, fields){
		if(results.length != 0){
			callback(undefined);
		}else{
			callback([[{'text': encodeURIComponent('❤️️ Save this stop'), callback_data: stop_id.toString()}]]);
		}
	});
}