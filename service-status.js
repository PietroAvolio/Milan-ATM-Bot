const utils = require("./utils");
const logPrefix = "SRV-STS";

var linesStatus = [];
var linesTimetables = [];

module.exports = {
    pushInfo: function(data, callback){
        if(data.line === undefined || data.message === undefined || data.source === undefined || data.date === undefined) {
            callback(false);
            return;
        }
        data.line = data.line.toUpperCase();
        var currentLineStatus = linesStatus[data.line];

        if(currentLineStatus === undefined){
            utils.makeLog("Inserting line information. " + JSON.stringify(data), logPrefix);

            linesStatus[data.line] = {info: []};
            linesStatus[data.line].info[data.source] = {message: data.message, date: data.date};
            callback(true);

        }else if(linesStatus[data.line].info[data.source] === undefined || linesStatus[data.line].info[data.source].date < data.date){
            utils.makeLog("Updating line information." + JSON.stringify(data), logPrefix);

            linesStatus[data.line].info[data.source] = {message: data.message, date: data.date};

            callback(true);
        }

        callback(false);
    },

    getInfo: function(line, callback){
        callback( linesStatus[line] );
    },

    getLineTimetable: function(journeyPatternId){
        if( linesTimetables[journeyPatternId] !== undefined && (linesTimetables[journeyPatternId].date - new Date() < 1000*60*60*24) ){
            return linesTimetables[journeyPatternId].content;
        }

        return undefined;
    },

    pushLineTimetable: function(journeyPatternId, content){
        utils.makeLog("Pushing timetable for jpid = " + journeyPatternId + " => " + content, logPrefix);
        linesTimetables[journeyPatternId] = {'content': content, 'date': new Date()};
    },

    printLinesStatus: function(){
        console.log(linesStatus);
    }
};