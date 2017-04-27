const request = require('request');
const utils = require('./utils.js');
const serviceStatus = require('./service-status');
const logPrefix = "ATM-RTR";

module.exports = {
    getStopsByNameOrCustomerCode: function(key, callback){
        getStopsByNameOrCustomerCode(key, callback);
    },

    getStopDetails: function(stopCode, callback){
        getStopDetails(stopCode, callback);
    },

    getTimetable: function(link, callback){
        getTimetable(link, callback);
    }
};

function getStopsByNameOrCustomerCode(key, callback){
    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url:     'http://giromilano.atm.it/proxy.ashx',
        body:    "url=tpPortal/tpl/stops/search/" + key
    }, function(error, response, body){
        if(!error && response.statusCode === 200){
            callback(JSON.parse(body));
        }else{
            callback(undefined);
        }
    });
}

function getStopDetails(stopCode, callback){
    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url:     'http://giromilano.atm.it/proxy.ashx',
        body:    "url=tpPortal/geodata/pois/" + stopCode + "?lang=en"
    }, function(error, response, body){
        if(!error && response.statusCode === 200){
            var jb = JSON.parse(body);

            var nlines = jb.Lines.length;
            var w = nlines;

            for(var i = 0; i < nlines; i++){
                var l = jb.Lines[i];

                //getTimetable(l.JourneyPatternId, l.Links[0], function(t){
                getTimetable(l, function(){
                    w--;

                    if(w === 0){
                        callback(jb);
                    }
                });
            }

        }else{
            callback(undefined);
        }
    });
}

function getTimetable(line, callback){
    var journeyPatternId = line.JourneyPatternId;
    var link = line.Links[0];

    if(journeyPatternId === undefined || (link === undefined || link.Rel !== "timetable")){
        callback(undefined);

    }else{
        var savedTimetable = serviceStatus.getLineTimetable(journeyPatternId);
        if(savedTimetable !== undefined){
            callback(savedTimetable);
        }else{
            request.post({
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                url:     'http://giromilano.atm.it/proxy.ashx',
                body:    "url=tpPortal/" + link.Href + "?lang=en"
            }, function(error, response, body){
                if(!error && response.statusCode === 200){
                    var jb = JSON.parse(body);
                    serviceStatus.pushLineTimetable(journeyPatternId, jb);
                    line.rTimetable = jb;
                    callback();
                }else{
                    callback(undefined);
                }
            });
        }
    }
}