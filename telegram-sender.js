const request = require('request');
const config = require('./config/config.js');
const utils = require("./utils.js");

const logPrefix = "TGR-SND";

module.exports = {
    //TODO HANDLE NOT MORE VALID CHAT ID

    message: function(text, chatId, inlineKeyboardButtons){
        var requestUrl = 'https://api.telegram.org/bot' + config.telegramToken + '/sendMessage?chat_id=' + chatId + '&disable_web_page_preview=true&parse_mode=HTML&text=' + encodeURIComponent(text);

		if(inlineKeyboardButtons !== undefined){
            var ikb = {"inline_keyboard": inlineKeyboardButtons};
            requestUrl = requestUrl.concat('&reply_markup=' + JSON.stringify(ikb));
        }

        request(requestUrl, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                //console.log(body);
            }else{
                utils.makeLog("Error while sending message response.\n" + error + "\nResponse: " + response + "\nBody: " +  body, logPrefix);
            }
        });
    },

    answerInlineQuery: function(callbackQueryObject){
        request('https://api.telegram.org/bot' + config.telegramToken + '/answerCallbackQuery?callback_query_id=' + callbackQueryObject.id);
    }
};

