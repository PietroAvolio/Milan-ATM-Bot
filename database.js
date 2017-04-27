const sqlite3 = require('sqlite3').verbose();
const utils = require("./utils");

const logPrefix = "DB";

var db;

module.exports = {
    init: function(){
        try{
            db = new sqlite3.Database('db.sqlite');
            utils.makeLog("Database initialized correctly", logPrefix);

            db.serialize(function() {
                db.all("SELECT name FROM sqlite_master WHERE type='table'", function (err, rows) {
                    utils.makeLog(rows, logPrefix);
                });
            });

        }catch(err){
            utils.makeLog("Unable to open a connection to db.sqlite", logPrefix);
        }
    },

    hasUserSavedStop: function(user, stopCode, callback){
        db.serialize(function(){
            db.all("SELECT * FROM saved_stops WHERE chat_id = " + user + " AND stop_code = " + stopCode, function(err, rows){
                if(rows.length > 0){
                    callback(true);
                }else{
                    callback(false);
                }
            });
        });
    },

    saveStop: function(user, stopCode, name){
        db.serialize(function(){
           db.run("INSERT INTO saved_stops(chat_id, stop_code, show_as) VALUES(?, ?, ?)",
                    [user, stopCode, name]);
        });
    },

    unsaveStop: function(user, id){
        db.serialize(function(){
           db.run("DELETE FROM saved_stops WHERE id = ? AND chat_id = ?", [id, user]);
        });
    },

    getSavedStops: function(user, callback){
        db.serialize(function(){
           db.all("SELECT * FROM saved_stops WHERE chat_id = ?", [user], function(err, rows){
               callback(rows);
            });
        });
    },

    getTopSearchedLines: function(user, limit, callback){
        db.serialize(function(){
           db.all("SELECT * FROM user_searches WHERE chat_id = ? GROUP BY line ORDER BY count(*) LIMIT ?",
                [user, limit], function(err, rows){
                callback(rows);
           });
        });
    },

    pushUserSearch: function(user, line){
        db.serialize(function(){
            db.run("INSERT INTO user_searches(chat_id, line) VALUES(?, ?)", [user, line]);
        });
    },

    pushNotificationPreference: function(user, line){
        db.serialize(function(){
           db.run("INSERT INTO user_notifications(chat_id,line) SELECT ?, ? WHERE NOT EXISTS(SELECT 1 FROM user_notifications WHERE chat_id = ? AND line = ?)",
                [user, line, user, line]);
        });
    },

    getNotificationPreferences: function(user, callback){
        db.serialize(function(){
           db.all("SELECT * FROM user_notifications WHERE chat_id = ?", [user], function(err, rows){
               callback(rows);
           });
        });
    },

    removeNotificationPreference: function(user, line){
        db.serialize(function(){
           db.run("DELETE FROM user_notifications WHERE chat_id = ? and line = ?", [user, line]);
        });
    },

    getSubscribedUsers: function(line, callback){
        db.serialize(function(){
           db.all("SELECT chat_id FROM user_notifications WHERE line = ? OR line = ?", [line, 'ALL'], function(err, rows){
                callback(rows);
           });
        });
    }
};

