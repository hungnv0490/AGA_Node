var mysql      = require('mysql2');
var config = require('./config.json');
var util = require('./util.js');

var connection = mysql.createConnection({
  // host     : '159.223.62.35',
  host:config.mysqlHot,
  user     : config.mysqlUser,
  password : config.mysqlPass,
  database : config.mysqlDb
});
var log4js = require("log4js");
var logger = log4js.getLogger();

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  logger.info('mysqldb connected as id ' + connection.threadId);
});

const mySqlDB = {}
mySqlDB.test = function(){
  connection.query('SELECT * From users Limit 1', function (error, results, fields) {
    console.log('The solution is: ', results[0]);
  });
}

mySqlDB.addMailBox = function(title, content, sender, receiver, rewards, isRead, isReceive)
{
  var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
  logger.info("mysqldb addMailBox createTime:" + createTime);
  var sql = 'INSERT INTO `aga`.`mail_box`(`title`,`content`,`sender`,`receiver`,`rewards`,`is_read`,`is_receive`,`create_time`,`update_time`)'+
            'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
  connection.execute(sql, [title, content, sender, receiver, rewards, isRead, isReceive, createTime, createTime], function(err, result, fields){
    logger.error("mysqldb addMailBox err:" + err);
  });  
}
module.exports = mySqlDB;

