const childProcess = require("child_process");
const utils = require("./utils.js");
const serviceStatus = require("./service-status");
const telegramSender = require("./telegram-sender");
const atmRetriever = require("./atm-retriever");
const database = require("./database.js");

const logPrefix = "MAIN";
const botVersion = "2.0";

var chatPendingCommands = [];
var chatPendingParams = [];

init();

function init(){
	console.log(" ______  ______             ______        ___                                                ____            __      ");
    console.log("/\\  _  \\/\\__  _\\/'\\_/`\\    /\\__  _\\      /\\_ \\                                              /\\  _`\\         /\\ \\__   ");
    console.log("\\ \\ \\L\\ \\/_/\\ \\/\\      \\  \\/_/\\ \\/    __\\//\\ \\      __     __   _ __    __      ___ ___    \\ \\ \\L\\ \\    ___\\ \\ ,_\\  ");
    console.log(" \\ \\  __ \\ \\ \\ \\ \\ \\__\\ \\     \\ \\ \\  /'__`\\\\ \\ \\   /'__`\\ /'_ `\\/\\`'__\\/'__`\\  /' __` __`\\   \\ \\  _ <'  / __`\\ \\ \\/  ");
    console.log("  \\ \\ \\/\\ \\ \\ \\ \\ \\ \\_/\\ \\     \\ \\ \\/\\  __/ \\_\\ \\_/\\  __//\\ \\L\\ \\ \\ \\//\\ \\L\\.\\_/\\ \\/\\ \\/\\ \\   \\ \\ \\L\\ \\/\\ \\L\\ \\ \\ \\_ ");
    console.log("   \\ \\_\\ \\_\\ \\ \\_\\ \\_\\\\ \\_\\     \\ \\_\\ \\____\\/\\____\\ \\____\\ \\____ \\ \\_\\\\ \\__/.\\_\\ \\_\\ \\_\\ \\_\\   \\ \\____/\\ \\____/\\ \\__\\");
    console.log("    \\/_/\\/_/  \\/_/\\/_/ \\/_/      \\/_/\\/____/\\/____/\\/____/\\/___L\\ \\/_/ \\/__/\\/_/\\/_/\\/_/\\/_/    \\/___/  \\/___/  \\/__/");
	console.log("                                                            /\\____/                                                  ");
	console.log("                                                            \\_/__/                                                   ");
	console.log("");
	console.log("Version " + botVersion);
	console.log("");
    console.log("");

    utils.makeLog("Starting Twitter fetcher...", logPrefix);
    this._twitterFetcher = childProcess.fork('twitter-fetcher.js');
    this._twitterFetcher.send("start");

    this._twitterFetcher.on('message', function(data){
        onNewServiceUpdate(data);
    }.bind(this))

	utils.makeLog("Starting Telegram retriever...", logPrefix);
    this._telegramRetriever = childProcess.fork('telegram-retriever.js');
    this._telegramRetriever.send("start");

    this._telegramRetriever.on('message', function(data){
        onTelegramUpdate(data);
    }.bind(this))

    utils.makeLog("Initializing database connection...", logPrefix);
    database.init();
}

function onNewServiceUpdate(data){
	serviceStatus.pushInfo(data, function(pushed){

        if(pushed && data.issueNotification){
            database.getSubscribedUsers(data.line, function(rows){
                for(var i = 0; i < rows.length; i++){
                    var chat_id = rows[i].chat_id;

                    var m = "I have an update for <b>line " + data.line + "</b> 👇\n\n";
                    m = m.concat(data.message + "\n<i>(" + utils.timeSince(new Date(data.date)) + " ago via " + data.source + "</i>)");
                    telegramSender.message(m, chat_id);
                }
            });
        }
    });
}

function onTelegramUpdate(data){
    if( data.message !== undefined ){
        handleTelegramText(data);
    }else if( data.callback_query !== undefined ){
        handleTelegramCallbackQuery(data);
    }else{
        utils.makeLog("Unhandled Telegram update", logPrefix);
        console.log(data);
    }
}

function handleTelegramText(data){
    var sender = utils.getTelegramUpdateSender(data);
    var text = data.message.text;

    utils.makeLog(sender + " " + text, logPrefix);

    if( text.charAt(0) === '/' ){
        handleCommand( text.substring(1), sender );
    }else{
        if(chatPendingCommands[sender] !== undefined){
            handleCommand(chatPendingCommands[sender], sender, text);
            chatPendingCommands[sender] = undefined;
        }
    }

}

function handleTelegramCallbackQuery(data){
    var sender = utils.getTelegramUpdateSender(data);
    chatPendingCommands[sender] = undefined;
    utils.makeLog(sender + " " + data.callback_query.data, logPrefix);

    telegramSender.answerInlineQuery(data.callback_query);

    var p = utils.parseTelegramCallbackQuery(data.callback_query.data);
    handleCommand(p.command, sender, p.param);
}

function handleCommand(command, sender, param){
    switch(command){
        case "stopinfo":
            var m = "Type the address or the code of the stop, or just pick one of your ❤ saved stops below";
            var bs;

            database.getSavedStops(sender, function(rows){
                if(rows.length > 0){
                    bs = [];

                    for(var i = 0; i < rows.length; i++){
                        bs.push( [{ 'text': rows[i].show_as, 'callback_data': "_viewStop " + rows[i].stop_code }] );
                    }
                }

                chatPendingCommands[sender] = "_searchStops";
                telegramSender.message(m, sender, bs);
            });
            break;

        case "_searchStops":
            atmRetriever.getStopsByNameOrCustomerCode(param, function(stops){
                if(stops === undefined){
                    telegramSender.message("I can't find any stop 😔", sender);
                    chatPendingCommands[sender] = "_searchStop";

                }else if(stops.length === 1){
                    //I found one stop only
                    handleViewStopCommand(stops[0].Code, sender);
                }else{
                    //I found multiple stops
                    for(var i = 0; i < stops.length; i++){
                        if(stops[i].Lines.length === 0){
                            continue;
                        }

                         telegramSender.message( utils.buildStopOverwievMessage(stops[i], false), sender, [[{'text': encodeURIComponent('Select this stop ☝'), 'callback_data': '_viewStop ' + stops[i].Code}]]);
                    }
                }
            });
            break;

        case "_viewStop":
            handleViewStopCommand(param, sender);
            break;

        case "_saveStop1":
            var s = param.split(" ");
            var n = "";

            for(var i = 1; i < s.length; i++){
                n = n.concat(s[i]);

                if(i !== s.length-1){
                    n = n.concat(" ");
                }
            }

            var ib = [[{ 'text': 'No', 'callback_data': '_saveStop2 ' + s[0] + " " + n},
                {'text': 'Yes', 'callback_data': '_saveStop2 ' + s[0]}]];
            telegramSender.message("Do you want to choose a custom name for the stop? Otherwise it will be saved as <i>" + n + "</i>", sender, ib);
            break;

        case "_saveStop2":
            var s = param.split(" ");
            var n = "";

            for(var i = 1; i < s.length; i++){
                n = n.concat(s[i]);

                if(i !== s.length-1){
                    n = n.concat(" ");
                }
            }

            if(n.length > 0){
                //Selected NO
                database.saveStop(sender, s[0], n);
                telegramSender.message("Stop saved 😜", sender);
            }else{
                //Selected YES
                telegramSender.message("Type the name for the stop", sender);
                chatPendingCommands[sender] = "_saveStop3";
                chatPendingParams[sender] = s[0];
            }
            break;

        case "_saveStop3":
            var stopCode = chatPendingParams[sender];
            chatPendingParams[sender] = undefined;

            if(param.length > 0){
                database.saveStop(sender, stopCode, param);
                telegramSender.message("Stop saved as <i>" + param + "</i> 😜", sender);
            }

            break;

        case "status":
            database.getTopSearchedLines(sender, 4, function(rows){
               var ib;

               if(rows.length > 0){
                   ib = [[]];

                   for(var i = 0; i < rows.length; i++){
                       ib[0].push( {'text': rows[i].line, 'callback_data': '_status ' + rows[i].line} );
                   }
               }

               telegramSender.message("For which line do you wish to check the status? 🤔", sender, ib);
               chatPendingCommands[sender] = "_status";
            });
            break;

        case "_status":
            database.pushUserSearch(sender, param);

            serviceStatus.getInfo(param, function(data){
               if(data === undefined){
                   telegramSender.message("Everything should be ok on line " + param + " 😊", sender);
               }else{
                    data = data.info;

                    if(data.twitter !== undefined){
                        //We have a tweet!
                        telegramSender.message(data.twitter.message + "\n<i>(" + utils.timeSince(new Date(data.twitter.date)) + " ago via twitter</i>)", sender);
                    }
               }
            });
            break;

        case "unsavestop":
            database.getSavedStops(sender, function(rows){
                if(rows.length > 0){
                    var ib = [];

                    for(var i = 0; i < rows.length; i++){
                        ib.push([{ 'text': rows[i].show_as, 'callback_data': '_unsavestop ' + rows[i].id }]);
                    }

                    telegramSender.message("Pick the stop to unsave", sender, ib);

                }else{
                    telegramSender.message("You didn't save any stop yet 🙄", sender);
                }
            });
            break;

        case "_unsavestop":
            database.unsaveStop(sender, param);
            telegramSender.message("Stop unsaved 😜", sender);
            break;

        case "enablenotifications":
            database.getTopSearchedLines(sender, 4, function(rows){
                var ib;

                if(rows.length > 0){
                    ib = [[]];

                    for(var i = 0; i < rows.length; i++){
                        ib[0].push( {'text': rows[i].line, 'callback_data': '_status ' + rows[i].line} );
                    }
                }

                telegramSender.message("For which line do you wish to enable the notifications? 🤔", sender, ib);
                chatPendingCommands[sender] = "_enablenotifications";
            });
            break;

        case "_enablenotifications":
            database.pushNotificationPreference(sender, param);
            telegramSender.message("Notifications enableb for line " + param + ". I will text you if something happens! 😉", sender);
            break;

        case "disablenotifications":
            database.getNotificationPreferences(sender, function(rows){
                if(rows.length > 0){
                    var ib = [];

                    for(var i = 0; i < rows.length; i++){
                        ib.push([{'text': rows[i].line, 'callback_data': '_disablenotifications ' + rows[i].line}]);
                    }

                    telegramSender.message("Select the line for which you don't want notifications anymore", sender, ib);
                }else{
                    telegramSender.message("You didn't enable notifications on any line yet 😌", sender);
                }
            });

            break;

        case "_disablenotifications":
            database.removeNotificationPreference(sender, param);
            telegramSender.message("You will not receive notifications for line " + param + " anymore 😇", sender);
            break;

        default:
            utils.makeLog("Unhandled command " + command, logPrefix);
            break;
    }
}

function handleViewStopCommand(stopCode, sender){
    atmRetriever.getStopDetails(stopCode, function(data){

        database.hasUserSavedStop(sender, stopCode, function(isSaved){
            var ib;

            if(!isSaved){
                ib = [[{'text': encodeURIComponent("Save this stop ❤"), 'callback_data': '_saveStop1 ' + stopCode + " " + data.Description}]];
            }

            telegramSender.message( utils.buildStopOverwievMessage(data, true), sender, ib);
        });
    });
}
