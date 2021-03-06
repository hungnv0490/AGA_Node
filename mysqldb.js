var mysql = require('mysql2');
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
  host: process.env.mysqlHot || process.env.mysqlHot_Product,
  user: process.env.mysqlUser || process.env.mysqlUser_Product,
  password: process.env.mysqlPass || process.env.mysqlPass_Product,
  database: process.env.mysqlDb || process.env.mysqlDb_Product,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements:true
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
  var sql = 'INSERT INTO `aga`.`mail_box`(`title`,`content`,`sender`,`receiver`,`rewards`,`is_read`,`is_receive`,is_new,`create_time`,`update_time`)' +
    'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  mySqlDB.execute(sql, [title, content, sender, receiver, rewards, isRead, isReceive,1, createTime, createTime], function (err, result, fields) {
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

mySqlDB.addUserCard = function (userId, cardId, charId, levelFusion, lifeTime, inTeam, cb) {
  var sql = `INSERT INTO user_card (user_id, id_blc, char_id, level_fusion, life_time, in_team, is_new)` +
    ` VALUES (${userId},${cardId},${charId},${levelFusion},${lifeTime},${inTeam},1)`;
  logger.info("mysqldb addUserCard sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    // var json = JSON.stringify(result);
    logger.error("mysqldb addUserCard err:" + err + " id:" + result.insertId);
    if (err == null) cb(result.insertId);
    else cb(0);
  });
}

mySqlDB.removeUserCard = function (userId, cardId, cb) {
  var sql = `DELETE FROM user_card Where user_id=${userId} AND card_id=${cardId}`;
  logger.info("mysqldb removeUserCard sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    // var json = JSON.stringify(result);
    logger.error("mysqldb removeUserCard err:" + err + " id:" + JSON.stringify(result));
    if (err == null) cb(200);
    else cb(601);
  });
}

mySqlDB.insertOrUpdateUserMission = function (userId, missionType, amount, charId, charLevel, cb) {
  var sql = `Select count(*) count From mission where mission_type=${missionType} And active = 1`;
  if(charId > 0 && charLevel > 0)
    sql = `Select count(*) count From mission where mission_type=${missionType} And char_id=${charId} And char_level=${charLevel} And active = 1`;
  else if(charId > 0)
    sql = `Select count(*) count From mission where mission_type=${missionType} And char_id=${charId} And active = 1`;
  else if(charLevel > 0)
    sql = `Select count(*) count From mission where mission_type=${missionType} And char_level=${charLevel} And active = 1`;
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

mySqlDB.updateUserRankingEndSeason = function (userId, rankingType, rank, season, isCasual, rankPoint, reward) {
  var currentTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
  var sql = `INSERT INTO ranking(user_id,season,is_casual,rank_point,reward,create_time,update_time) VALUES (${userId},
            '${season}',${isCasual},${rankPoint},${reward},'${currentTime}','${currentTime}')
            ON DUPLICATE KEY UPDATE rank_point = ${rankPoint}, reward = ${reward}, update_time='${currentTime}';`;
  logger.info("mysqldb updateUserRankingEndSeason sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    // var json = JSON.stringify(result);
    logger.error("mysqldb updateUserRankingEndSeason err 2:" + err + " result 2:" + JSON.stringify(result));
  });
}

mySqlDB.claimRequestHis = function (address, amount, type) {
  var currentTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
  var sql = `INSERT INTO claim_request_his(address, amount, type, date_time) Values ('${address}', ${amount}, ${type}, '${currentTime}')`;
  logger.info("mysqldb claimRequestHis sql:" + sql);
  mySqlDB.execute(sql, function (err, result, fields) {
    logger.error("mysqldb claimRequestHis err 2:" + err + " result 2:" + JSON.stringify(result));
  });
}


module.exports = mySqlDB;

