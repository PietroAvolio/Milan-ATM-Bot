# Milan-ATM-Bot
NodeJS implementation of a Telegram Bot providing services for the ATM transportation company in Milan (Italy).
Currently running on http://www.tg.me/@MilanAtmBot

## How it works
It merges information provided by [@ATMTravelAlerts](https://twitter.com/ATMTravelAlerts) and available on the [ATM website](http://www.atm.it) in one telegram chat.

It can send notifications based on user's preferences.

## Requirements
### npm modules

```
npm install mysql
```
```
npm install timers
```
```
npm install request
```
### Telegram token
You need to generate a telegram bot token an insert it into the /config/config.js file.

### Twitter App-Only Bearer Token
You need to generate an Application-only bearer token for Twitter APIs and insert it into the /config/config.js file.

### MySQL Database
You need to link a mysql database into the /config/config.js file. 
See dump.sql for the database schema.

## License
This project is distributed under the terms of the MIT License. See file "LICENSE" for further reference.
