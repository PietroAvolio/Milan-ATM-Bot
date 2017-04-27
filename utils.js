module.exports = {
    makeLog: function(msg, prefix){
        var d = new Date().toString().split(' ');

        console.log("[" + d[2] + " " + d[1] + " " + d[4] + "][" + prefix + "] " + msg );
    },

    getTelegramUpdateSender: function(obj) {
        try {
            if (obj.message !== undefined) {
                return obj.message.from.id;

            } else if (obj.callback_query !== undefined) {
                return obj.callback_query.from.id;

            }
        } catch (err) {
            console.log("Unable to retrieve telegram update sender " + err);
        }
    },

    parseTelegramCallbackQuery: function(callbackQueryData){
        var s = callbackQueryData.split(" ");
        var command = s[0];
        var param = "";

        var i;
        for(i = 1; i < s.length; i++){
            param = param.concat(s[i]);

            if(i !== s.length-1){
                param = param.concat(" ");
            }
        }

        return { "command": command, "param": param };
    },

    buildStopOverwievMessage: function(stopdata, detailed){
        var str = "";
        switch(stopdata.Category.CategoryId){
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

        str = str.concat("<b>" + stopdata.Description + "</b>" + " (Code: " + stopdata.CustomerCode + ")\n\n");

        for(var i = 0; i < stopdata.Lines.length; i++){
            var l = stopdata.Lines[i].Line;
            var lf = this.getLineFrequencyFromTimetable(stopdata.Lines[i].rTimetable);

            if(stopdata.Lines[i].WaitMessage !== undefined && stopdata.Lines[i].WaitMessage !== null){
                str = str.concat("[" + stopdata.Lines[i].WaitMessage + "] ");

            }else if(detailed && lf !== undefined){
                str = str.concat("[T.B.C]");

            }else if(detailed){
                str = str.concat("[N.D.]");

            }

            str = str.concat(l.LineCode + ": " + l.LineDescription + " ");

            if(lf !== undefined && lf.current.length > 0){
                str = str.concat( "\n<i>(" + lf.current + ")</i>\n");
            }

            str = str.concat("\n");
        }

        return str;
    },

    getLineFrequencyFromTimetable: function(timetable){
        var retObj = {};

        if(timetable === undefined || timetable === null){
            return undefined;
        }else{
            var n = new Date();
            var t;

            if(this.isHoliday(n) || n.getDay() === 0){
                //Sunday or holiday
                t = timetable.TimeSchedules[2];
            }else if(n.getDay() === 6){
                //Saturday
                t = timetable.TimeSchedules[1];
            }else{
                //Weekday
                t = timetable.TimeSchedules[0];
            }
        }

        var h = n.getHours()-3;
        h = h < 0 ? h + 24 : h; //Strange people work in the ATM IT division :S

        retObj.current = (t.Schedule[h].NightDetail.trim() + " " + t.Schedule[h].ScheduleDetail.trim()).trim().replace('Ogni', 'Every');

        var nh = h+1;
        if(nh === 21) {
            //We need to switch the the day after
            n = n.setDate(n.getDate() + 1);
            if (this.isHoliday(n) || n.getDay() === 0) {
                //Sunday or holiday
                t = timetable.TimeSchedules[2];
            } else if (n.getDay() === 6) {
                //Saturday
                t = timetable.TimeSchedules[1];
            } else {
                //Weekday
                t = timetable.TimeSchedules[0];
            }

            nh = 0;
        }

        retObj.next = (t.Schedule[nh].NightDetail.trim() + " " + t.Schedule[nh].ScheduleDetail.trim()).trim().replace('Ogni', 'Every');


        return retObj;
    },

    isHoliday: function(date){
        //TODO
        return false;
    },

    timeSince: function(date){
        var seconds = Math.floor((new Date() - date) / 1000);

        var interval = Math.floor(seconds / 31536000);

        if (interval > 1) {
            return interval + " years";
        }
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) {
            return interval + " months";
        }
        interval = Math.floor(seconds / 86400);
        if (interval > 1) {
            return interval + " days";
        }
        interval = Math.floor(seconds / 3600);
        if (interval > 1) {
            return interval + " hours";
        }
        interval = Math.floor(seconds / 60);
        if (interval > 1) {
            return interval + " minutes";
        }

        return Math.floor(seconds) + " seconds";
    }
};