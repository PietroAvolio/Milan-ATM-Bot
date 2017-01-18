const _cfg_telegramToken = '304767666:AAGP_OTHPxFod34bjK79NRilp_wDSjPITRw';
const _cfg_twitterToken = 'AAAAAAAAAAAAAAAAAAAAAJf%2BygAAAAAAfFJd1AgjiwydGbCYHGxDQlSZDzU%3Dq77qpsqwd2UsD0BO2uYKQnk2ScJrzIjoGWWiTeoHPMsVVEYbDr';
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