const _cfg_telegramToken = '304767666:AAHv90ZZy5dncO9ZARRvGF8gl6RnpRtk8RE';
const _cfg_twitterToken = 'AAAAAAAAAAAAAAAAAAAAAJf%2BygAAAAAAEx7H%2FXyB88rFLUgonDj%2FlcnFAQo%3DwF3MNzra463dyqj51ILsnv22WymT8aLDUYT9EBQ9fAM36ysFrR';

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