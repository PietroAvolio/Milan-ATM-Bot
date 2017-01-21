const _cfg_telegramToken = '';
const _cfg_twitterToken = '';

const _cfg_mysql = {
	host     : 'localhost',
	user     : 'root',
	password : 'ptr',
	database : 'atmbot'
};

module.exports = {
	telegramToken: _cfg_telegramToken,
	
	twitterToken: _cfg_twitterToken,
	
	mysqlHost: _cfg_mysql.host,
	
	mysqlUser: _cfg_mysql.user,
	
	mysqlPassword: _cfg_mysql.password,
	
	mysqlDatabase: _cfg_mysql.database
}