var mysql = require('mysql2');
var config = require('./config.json');
var util = require('./util.js');
var log4js = require("log4js");
var logger = log4js.getLogger();

const mySqlDB = mysql.createConnection({
  // host     : '159.223.62.35',
  host: config.mysqlHot,
  user: config.mysqlUser,
  password: config.mysqlPass,
  database: config.mysqlDb
});


mySqlDB.connect(function (err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  logger.info('mysqldb connected as id ' + mySqlDB.threadId);
});

mySqlDB.test = function () {
  mySqlDB.query('SELECT * From users Limit 1', function (error, results, fields) {
    console.log('The solution is: ', results[0]);
  });
}

mySqlDB.addMailBox = function (title, content, sender, receiver, rewards, isRead, isReceive) {
  var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
  logger.info("mysqldb addMailBox createTime:" + createTime);
  var sql = 'INSERT INTO `aga`.`mail_box`(`title`,`content`,`sender`,`receiver`,`rewards`,`is_read`,`is_receive`,`create_time`,`update_time`)' +
    'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
  mySqlDB.execute(sql, [title, content, sender, receiver, rewards, isRead, isReceive, createTime, createTime], function (err, result, fields) {
    logger.error("mysqldb addMailBox err:" + err);
  });
}

mySqlDB.addMailBox = function (title, content, sender, receiver, rewards, isRead, isReceive) {
  var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
  logger.info("mysqldb addMailBox createTime:" + createTime);
  var sql = 'INSERT INTO `aga`.`mail_box`(`title`,`content`,`sender`,`receiver`,`rewards`,`is_read`,`is_receive`,`create_time`,`update_time`)' +
    'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
  mySqlDB.execute(sql, [title, content, sender, receiver, rewards, isRead, isReceive, createTime, createTime], function (err, result, fields) {
    logger.error("mysqldb addMailBox err:" + err);
  });
}

mySqlDB.getMission = function (cate, missionType, cb) {
  var missions = []
  // var sql = "";
  if (cate != 0) {
    if (missionType != 0)
      sql = `Select * from mission where mission_cate=${cate} And mission_type=${missionType};`;
    else
      sql = `Select * from mission where mission_cate=${cate};`;
  }
  else sql = "Select * from mission where active=1;";
  logger.info("sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    logger.error("mysqldb getMission err:" + err);
    // logger.info("mysqldb getMission:" + JSON.stringify(result));
    if (result) {
      for (var res of result) {
        // logger.info("mysqld getMission mission:" + res);
        missions.push(res);
      }
      cb(missions);
    }
    else cb(missions);
  });
}

mySqlDB.addMission = function (name, des, char_id, char_level, mission_type, mission_cate, count_unlock, rewards, active, cb) {
  var sql = 'INSERT INTO `aga`.`mission`(`name`,`des`,`char_id`,`char_level`,`mission_type`,`mission_cate`,`count_unlock`,`rewards`,`active`)' +
    'VALUES(?,?,?,?,?,?,?,?,?);';
  mySqlDB.execute(sql, [name, des, char_id, char_level, mission_type, mission_cate, count_unlock, rewards, active], function (err, result, fields) {
    logger.error("mysqldb addMission err:" + err);
    if (err == null) cb(200);
    else cb(601);
  });
}

mySqlDB.updateMission = function (id, name, des, char_id, char_level, mission_type, mission_cate, count_unlock, rewards, active, cb) {
  var sql = `Update mission set name='${name}',des='${des}',char_id=${char_id},char_level=${char_level},mission_type=${mission_type},mission_cate=${mission_cate},count_unlock=${count_unlock},rewards='${rewards}' ` +
    `,active=${active} Where id=${id};`;
  logger.info("mysqldb updateMission sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    logger.error("mysqldb updateMission err:" + err);
    if (err == null) cb(200);
    else cb(601);
  });
}

module.exports = mySqlDB;

