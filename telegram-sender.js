const request = require('request');
const config = require('./config/config.js');

const logPrefix = "[TG-SNDR] ";
const telegramToken = config.telegramToken;

module.exports = {
	//TODO HANDLE NOT MORE VALID CHAT ID
	
	plainTextResponse: function(text, chatId, inlineKeyboardButtons){ //[[{'text': 'A', 'callback_data': '12'}]]
		var requestUrl = 'https://api.telegram.org/bot' + telegramToken + '/sendMessage?chat_id=' + chatId + '&text=' + encodeURIComponent(text);
		
		if(inlineKeyboardButtons !== undefined){
			var ikb = {"inline_keyboard": inlineKeyboardButtons};
			requestUrl = requestUrl.concat('&reply_markup=' + JSON.stringify(ikb));
		}
	
		request(requestUrl, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				//console.log(body);
			}else{
				console.log(logPrefix +  "Error while sending message response.\n" + error + "\nResponse: " + response + "\nBody: " +  body);
			}
		});
	},	
	
	answerInlineQuery: function(callbackQueryObject){
		request('https://api.telegram.org/bot' + telegramToken + '/answerCallbackQuery?callback_query_id=' + callbackQueryObject.id);
	}
};

