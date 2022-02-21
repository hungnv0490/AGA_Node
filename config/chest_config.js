var Chest = require('../entities/chest.js');
const myRedis = require('../myredis')
var PackCard = require('../entities/pack_card.js');
var log4js = require("log4js");
var logger = log4js.getLogger();
const mysqlDb = require('../mysqldb.js');

const CHEST_CONFIG = "chest-config";
// const CHEST_CONFIG_NEW_DATA = "chest-config-new-data";

chestConfig = {}
chestConfig.DailyLoginMaxChestPoint = 10;
chestConfig.DailyMissionMaxChestPoint = 10;
chestConfig.AchievementMaxChestPoint = 10;
chestConfig.packIds = "";
const chestDefault = [
    new Chest([PackCard.Default()]),
    new Chest([PackCard.Default()]),
    new Chest([PackCard.Default()]),
    new Chest([PackCard.Default()]),
];

chestConfig.init = async function () {
    var fromRedis = await myRedis.get(CHEST_CONFIG);
    if (fromRedis != null) {
        var json = JSON.parse(fromRedis);
        chestConfig.DailyLoginMaxChestPoint = json.DailyLoginMaxChestPoint;
        chestConfig.DailyMissionMaxChestPoint = json.DailyMissionMaxChestPoint;
        chestConfig.AchievementMaxChestPoint = json.AchievementMaxChestPoint;
        chestConfig.packIds = json.packIds;
    }

    var sql = `Select * From pack where name='ChestReward';`
    logger.info("chest_config init sql:" + sql);
    mysqlDb.execute(sql, async function (err, results, fields) {
        if (results != null && results.length > 0) {
            var ids = "";
            var i = 0;
            logger.info("chest_config init results:" + results);
            for (var result of results) {
                if (i < results.length - 1)
                    ids += result.id + "|";
                else ids += result.id;
                i++;
            }
            chestConfig.packIds = ids;
            await myRedis.set(CHEST_CONFIG, JSON.stringify(chestConfig));
        }
        else {
            var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
            var values = "";
            var i = 0;
            for (var pack of chestDefault) {

                if (i < chestDefault.length - 1)
                    values += `('ChestReward','Chest reward','${pack.Format()}','','${createTime}'),`;
                else values += `('ChestReward','Chest reward','${pack.Format()}','','${createTime}')`;
                i++;
            }
            var sql = `Insert into pack(name,pack.describe,pack_cards,url,create_time)
                        Values ${values};`;
            logger.info("chest_config init sql 1:" + sql);
            mysqlDb.execute(sql, async function (err, results, fields) {
                logger.info("chest_config init results 1:" + JSON.stringify(results));
                var sql = `Select * From pack where name='ChestReward';`
                logger.info("chest_config init sql 2:" + sql);
                mysqlDb.execute(sql, async function (err, results, fields) {
                    if (results != null && results.length > 0) {
                        var ids = "";
                        var i = 0;
                        logger.info("chest_config init results 2:" + JSON.stringify(results));
                        for (var result of results) {
                            if (i < results.length - 1)
                                ids += result.id + "|";
                            else ids += result.id;
                            i++;
                        }
                        chestConfig.packIds = ids;
                        await myRedis.set(CHEST_CONFIG, JSON.stringify(chestConfig));
                    }
                });
            });
        }
    });
}

chestConfig.toJson = function (chests) {
    if (chests == null) chests = chestDefault;
    var cf = {};
    cf.DailyLoginMaxChestPoint = chestConfig.DailyLoginMaxChestPoint
    cf.DailyMissionMaxChestPoint = chestConfig.DailyMissionMaxChestPoint;
    cf.AchievementMaxChestPoint = chestConfig.AchievementMaxChestPoint;
    cf.chests = chests;
    return JSON.stringify(cf);
}

chestConfig.getOb = function (chests) {
    if (chests == null) chests = chestDefault;
    var cf = {};
    cf.DailyLoginMaxChestPoint = chestConfig.DailyLoginMaxChestPoint
    cf.DailyMissionMaxChestPoint = chestConfig.DailyMissionMaxChestPoint;
    cf.AchievementMaxChestPoint = chestConfig.AchievementMaxChestPoint;
    cf.chests = chests;
    return cf;
}

chestConfig.setConfig = async function (chests) {
    var oldChestConfigStr = await myRedis.get(CHEST_CONFIG);
    var oldChestConfig = JSON.parse(oldChestConfigStr);
    var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
    var i = 0;
    var values = "";
    for (var pack of chests) {
        if (i < chests.length - 1)
            values += `('ChestReward','Chest reward','${pack.Format()}','','${createTime}'),`;
        else values += `('ChestReward','Chest reward','${pack.Format()}','','${createTime}')`;
        i++;
    }
    var sql = `Insert into pack(name,pack.describe,pack_cards,url,create_time)
                Values ${values};`;
    logger.info("chest_config setConfig sql 1:" + sql);
    mysqlDb.execute(sql, async function (err, results, fields) {
        logger.info("battle_config setConfig results 1:" + JSON.stringify(results));
        var sql = `Select * From pack where name='ChestReward' And create_time='${createTime}';`
        logger.info("chest_config setConfig sql 2:" + sql);
        mysqlDb.execute(sql, async function (err, results, fields) {
            if (results != null && results.length > 0) {
                var ids = "";
                var i = 0;
                logger.info("chest_config setConfig results 2:" + JSON.stringify(results));
                for (var result of results) {
                    if (i < results.length - 1)
                        ids += result.id + "|";
                    else ids += result.id;
                    i++;
                }
                chestConfig.packIds = ids;
                await myRedis.set(CHEST_CONFIG, JSON.stringify(chestConfig));
                var sql = `Delete From pack Where id in (${oldChestConfig.packIds.replaceAll('|', ',')});`
                logger.info("chest_config setConfig sql 3:" + sql);
                mysqlDb.execute(sql, function (err, results, fields) {
                });
            }
        });
    });
}
module.exports = chestConfig;