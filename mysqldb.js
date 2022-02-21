var mysql = require('mysql2');
var config = require('./config.json');
var util = require('./util.js');
var log4js = require("log4js");
var logger = log4js.getLogger();

// const mySqlDB = mysql.createConnection({
//   // host     : '159.223.62.35',
//   host: config.mysqlHot,
//   user: config.mysqlUser,
//   password: config.mysqlPass,
//   database: config.mysqlDb
// });

const mySqlDB = mysql.createPool({
  host: config.mysqlHot,
  user: config.mysqlUser,
  password: config.mysqlPass,
  database: config.mysqlDb,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// mySqlDB.connect(function (err) {
//   if (err) {
//     console.error('error connecting: ' + err.stack);
//     return;
//   }

//   logger.info('mysqldb connected as id ' + mySqlDB.threadId);
// });

mySqlDB.test = function (cb) {
  mySqlDB.query('SELECT * From users Limit 1', function (error, results, fields) {
    console.log('The solution is: ', results[0]);
    cb(results[0]);
  });
}

mySqlDB.addMailBox = function (title, content, sender, receiver, rewards, isRead, isReceive, cb) {
  var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
  logger.info("mysqldb addMailBox createTime:" + createTime);
  var sql = 'INSERT INTO `aga`.`mail_box`(`title`,`content`,`sender`,`receiver`,`rewards`,`is_read`,`is_receive`,`create_time`,`update_time`)' +
    'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
  mySqlDB.execute(sql, [title, content, sender, receiver, rewards, isRead, isReceive, createTime, createTime], function (err, result, fields) {
    logger.error("mysqldb addMailBox err:" + err);
    if(err == null) cb(200);
    else cb(600);
  });
}

// mySqlDB.addMailBox = function (title, content, sender, receiver, rewards, isRead, isReceive) {
//   var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
//   logger.info("mysqldb addMailBox createTime:" + createTime);
//   var sql = 'INSERT INTO `aga`.`mail_box`(`title`,`content`,`sender`,`receiver`,`rewards`,`is_read`,`is_receive`,`create_time`,`update_time`)' +
//     'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
//   mySqlDB.execute(sql, [title, content, sender, receiver, rewards, isRead, isReceive, createTime, createTime], function (err, result, fields) {
//     logger.error("mysqldb addMailBox err:" + err);
//   });
// }

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

mySqlDB.addUserCard = function (userId, charId, levelFusion, inTeam, cb) {
  var sql = `INSERT INTO user_card (user_id, char_id, level_fusion, in_team)` +
    ` VALUES (${userId},${charId},${levelFusion},${inTeam})`;
  logger.info("mysqldb addUserCard sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    // var json = JSON.stringify(result);
    logger.error("mysqldb addUserCard err:" + err + " id:" + result.insertId);
    if (err == null) cb(result.insertId);
    else cb(0);
  });
}

mySqlDB.removeUserCard = function (userId, cardId, cb) {
  var sql = `DELETE FROM user_card Where id=${cardId} And user_id=${userId}`;
  logger.info("mysqldb removeUserCard sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    // var json = JSON.stringify(result);
    logger.error("mysqldb removeUserCard err:" + err + " id:" + JSON.stringify(result));
    if (err == null) cb(200);
    else cb(601);
  });
}

mySqlDB.insertOrUpdateUserMission = function (userId, missionType, amount, cb) {
  var sql = `Select count(*) count From mission where mission_type=${missionType} And active = 1`;
  logger.info("mysqldb insertOrUpdateUserMission sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    // var json = JSON.stringify(result);
    var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
    logger.error("mysqldb insertOrUpdateUserMission err 1:" + err + " result 1:" + JSON.stringify(result));
    if (result.length > 0 && result[0].count > 0) {
      sql = `INSERT INTO user_mission (mission_id, user_id, count, received, pushed, create_time)
      select id, ${userId}, ${amount}, 0, 0, '${createTime}' from mission where mission_type = ${missionType}
      ON DUPLICATE KEY UPDATE count = count + ${amount}`;
      logger.info("mysqldb insertOrUpdateUserMission sql 2:" + sql);
      mySqlDB.execute(sql, function (err, result, fields) {
        // var json = JSON.stringify(result);
        logger.error("mysqldb insertOrUpdateUserMission err 2:" + err + " result 2:" + JSON.stringify(result));
        if (err == null) cb(200);
        else cb(101);
      });
    }
  });
}

mySqlDB.addJackpotHis = function (userId, diamond, season, cb) {
  var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
  var sql = `INSERT INTO jackpot_his(user_id,diamond,season,create_time)
            VALUES(${userId},${diamond},'${season}','${createTime}');`;
  logger.info("mysqldb addJackpotHis sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    // var json = JSON.stringify(result);
    logger.error("mysqldb addJackpotHis err 2:" + err + " result 2:" + JSON.stringify(result));
    if (err == null) cb(200);
    else cb(101);
  });
}

mySqlDB.updateUserRankingEndSeason = function (userId, rankingType, rank, season) {
  var currentTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
  var sql = `Update ranking rk set update_time='${currentTime}', ranking_type=${rankingType}, rk.rank=${rank}
                                Where user_id=${userId} and season='${season}';`;
  logger.info("mysqldb updateUserRankingEndSeason sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    // var json = JSON.stringify(result);
    logger.error("mysqldb updateUserRankingEndSeason err 2:" + err + " result 2:" + JSON.stringify(result));
  });
}

module.exports = mySqlDB;

