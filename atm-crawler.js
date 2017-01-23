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
		if(res !== undefined && res.length == 1 && callback !== undefined){
			callback(res[0].Code);
		}else if(callback !== undefined){
			callback(undefined);
		}
	});
}

function getStopInfo(id, callback){
	request.post({
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		url:     'http://giromilano.atm.it/proxy.ashx',
		body:    "url=tpPortal/geodata/pois/" + id + "?lang=en"
	}, function(error, response, body){
		if(!error && response.statusCode == 200){
			if(callback !== undefined){
				
				var jsonBody = JSON.parse(body);
				
				for(var i = 0; i < jsonBody.Lines.length; i++){
					var l = jsonBody.Lines[i];
					
					/*if(l.WaitMessage === null){
						getLineTimetable(jsonBody.CustomerCode, l.Line.LineId, l.Direction, function(timetable){
							l.WaitMessage = parseTimetable(timetable);
							callback(jsonBody);
						});
					}else{
						callback(jsonBody);
					}*/ //TODO FIX THIS TO WORK WITH CALLBACKS!!
					
					callback(jsonBody);
				}
			}
		}else{
			console.log(logPrefix +  "Error while contacting ATM APIs.\n" + error + "\nResponse: " + response + "\nBody: " +  body);
			
			if(callback !== undefined){
				callback(undefined);
			}
		}
	});
}

function parseStopInfo(stopInfo, callback){
	//THIS IS AN AMAZING WORKAROUND!
	var pendingCallbacks = 0;
	for(var i = 0; i < jsonBody.Lines.length; i++){
		var l = stopInfo.Lines[i];
		
		if(l.WaitMessage === null){
			pendingCallbacks++;
			getLineTimetable(jsonBody.CustomerCode, l.Line.LineId, l.Direction, function(timetable){
				l.WaitMessage = parseTimetable(timetable);
				
				pendingCallbacks--;
				if(pendingCallbacks == 0){
					callback(jsonBody);
				}
			});
		}
	}
	
	if(pendingCallbacks == 0){
		callback(stopInfo);
	}
}

function getLineTimetable(stopid, line, linedirection, callback){
	request.post({
		headers: {'content-type' : 'application/x-www-form-urlencoded;charset=UTF-8'},
		url:     'http://giromilano.atm.it/proxy.ashx',
		body:    "url=tpPortal/tpl/stops/" + stopid + "/timetable/line/" + line + "/dir/" + linedirection
	}, function(error, response, body){
		if(!error && response.statusCode == 200){
			if(callback !== undefined){
				callback(JSON.parse(body));
			}
		}else{
			console.log(logPrefix +  "Error while contacting ATM APIs in getLineTimetable.\n" + error + "\nResponse: " + response + "\nBody: " +  body);
		}
	});
}

function parseTimetable(timetable){
	var currDate = new Date();
	var currDay = currDate.getDay();
	var tt;
	
	var tt_s;
	var tt_s_next;
	
	if(currDay > 0 && currDay < 6){
		//Lun-Ven
		tt = timetable.TimeSchedules[0];
	}else if(currDay == 6){
		//Sabato
		tt = timetable.TimeSchedules[1];
	}else{
		//Domenica + Festivi?!?
		tt = timetable.TimeSchedules[2];
	}
	
	for(var i = 0; i < tt.Schedule.length; i++){
		if(tt.Schedule[i].Hour == currDate.getHours()){
			tt_s = tt.Schedule[i];
			
			if(i != 23){
				tt_s_next = tt.Schedule[i+1];
			}else{
				tt_s_next = tt.Schedule[0];
			}
		}
	}
	
	return getWaitingTimeFromSchedule(tt_s, tt_s_next);
}

function getWaitingTimeFromSchedule(schedule, nextSchedule){
	var currMin = new Date().getMinutes();
	var stopsAt = [];
	var waitingMinutes;
	
	schedule.ScheduleDetail.replace("*", '');
	if( schedule.ScheduleDetail.startsWith("Ogni") ){
		var interval = parseInt(scedule.ScheduleDetail.replace(/Ogni (\d+)'/, "$1")); 
		
		for(var i = 1; i <= 15; i++){
			var s = interval*i;
			
			if(s <= 60){
				stopsAt.push(s);
			}else{
				break;
			}
		}
	}else{
		stopsAt = schedule.ScheduleDetail.split(" ");
	}
	
	for(var i = 0; i < stopsAt.length; i++){
		if( currMin < parseInt(stopsAt[i]) ){
			waitingMinutes = parseInt(stopsAt[i]) - currMin;
		}
	}
	
	if(waitingMinutes !== undefined){
		return waitingMinutes + " min";
	}else if(waitingMinutes === undefined && nextSchedule !== undefined){
		return getWaitingTimeFromSchedule(nextSchedule, undefined);
	}else{
		return 'no-serv.';
	}
}