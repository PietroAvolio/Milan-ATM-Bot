const mysql = require('mysql');
const logPrefix = "[MYSQL] ";
const config = require('./config/config.js');

var connection = mysql.createConnection({
  host     : config.mysqlHost,
  user     : config.mysqlUser,
  password : config.mysqlPassword,
  database : config.mysqlDatabase
});
 
connection.connect(function(err) {
  if (err) {
	throw err;
  }
 
  console.log(logPrefix + 'Connected as id ' + connection.threadId);
});
 
module.exports = {
	doQuery: function(query, callback){
		//console.log("Performing query" + query);
		
		connection.query(query, function(error, results, fields){
			if(error){
				console.log("Error performing query " + query + "; " + error);
			}
			
			if(callback !== undefined){
				callback(error, results, fields);
			}
		});
	}
};