const logPrefix = "[ATM-STS] ";
var linesStatus = [];

module.exports = {
	getInfo: function(line){
		line = line.toUpperCase();
		
		if( linesStatus[line] !== undefined ){
			return upperCaseFirst(linesStatus[line].status) + "\n(Last update " + formatDate(linesStatus[line].date) + ")";
		}else{
			return "I have no information about line " + line + ". Everything should be ok!";
		}
	},
	
	pushLineInfo: function(line, status, date){	
		if(line == "" || line == undefined)
			return;
	
		line = line.toUpperCase();
		
		if( (linesStatus[line] === undefined) || (linesStatus[line] !== undefined && date.getTime() > linesStatus[line].date.getTime()) ){
			console.log(logPrefix + "Pushing " + status + " for line #" + line);
			linesStatus[line] = {"date": date, "status": status};
		}
	}
};

function formatDate(date){
	return date.toString().replace(/([a-zA-Z]{3}) ([a-zA-Z]{3}) (\d*) (\d*) (\d*:\d*:\d*) (.)*/, "$1 $2 $3, $5");
}

function upperCaseFirst(string){
	return string.charAt(0).toUpperCase() + string.slice(1);
}