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
chestConfig.chests = [
    new Chest([PackCard.Default()]),
    new Chest([PackCard.Default()]),
    new Chest([PackCard.Default()]),
    new Chest([PackCard.Default()]),
];
const CHEST_CONFIG_NEW_DATA = "chest-config-new-data";

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
            logger.info("chest_config init results:" + JSON.stringify(results));
            chestConfig.chests = []
            for (var result of results) {
                if (i < results.length - 1)
                    ids += result.id + "|";
                else ids += result.id;
                i++;
                var packCardStrs = result.pack_cards.split('|');
                var packCards = []
                for (var packCardStr of packCardStrs) {
                    var cards = packCardStr.split('-');
                    packCards.push(new PackCard(parseFloat(cards[0]), parseFloat(cards[1]), parseFloat(cards[2]), parseFloat(cards[3]), parseFloat(cards[4])));
                }
                chestConfig.chests.push(new Chest(packCards));
            }
            chestConfig.packIds = ids;
            await myRedis.set(CHEST_CONFIG, chestConfig.toRedis());
            await myRedis.publish(CHEST_CONFIG_NEW_DATA);
            CHEST_CONFIG_NEW_DATA
        }
        else {
            var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
            var values = "";
            var i = 0;
            for (var pack of chestConfig.chests) {

                if (i < chestConfig.chests.length - 1)
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
                        await myRedis.set(CHEST_CONFIG, chestConfig.toRedis());
                        await myRedis.publish(CHEST_CONFIG_NEW_DATA);
                    }
                });
            });
        }
    });
}

chestConfig.toRedis = function () {
    var cf = {};
    cf.DailyLoginMaxChestPoint = chestConfig.DailyLoginMaxChestPoint
    cf.DailyMissionMaxChestPoint = chestConfig.DailyMissionMaxChestPoint;
    cf.AchievementMaxChestPoint = chestConfig.AchievementMaxChestPoint;
    cf.packIds = chestConfig.packIds;
    return JSON.stringify(cf);
}

chestConfig.toApiRes = function () {
    var cf = {};
    cf.DailyLoginMaxChestPoint = chestConfig.DailyLoginMaxChestPoint
    cf.DailyMissionMaxChestPoint = chestConfig.DailyMissionMaxChestPoint;
    cf.AchievementMaxChestPoint = chestConfig.AchievementMaxChestPoint;
    cf.chests = chestConfig.chests;
    return cf;
}

chestConfig.setConfig = async function () {
    var oldChestConfigStr = await myRedis.get(CHEST_CONFIG);
    var oldChestConfig = JSON.parse(oldChestConfigStr);
    var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
    var i = 0;
    var values = "";
    for (var pack of chestConfig.chests) {
        logger.info(pack);
        var packCards = []
        for (var packCard of pack.packCards) {
            packCards.push(new PackCard(packCard.Common, packCard.UnCommon, packCard.Rare, packCard.Epic, packCard.Legend));
        }
        var chest = new Chest(packCards);
        if (i < chestConfig.chests.length - 1)
            values += `('ChestReward','Chest reward','${chest.Format()}','','${createTime}'),`;
        else values += `('ChestReward','Chest reward','${chest.Format()}','','${createTime}')`;
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
                await myRedis.set(CHEST_CONFIG, chestConfig.toRedis());
                await myRedis.publish(CHEST_CONFIG_NEW_DATA);
                var sql = `Delete From pack Where id in (${oldChestConfig.packIds.replaceAll('|', ',')});`
                logger.info("chest_config setConfig sql 3:" + sql);
                mysqlDb.execute(sql, function (err, results, fields) {
                });
            }
        });
    });
}
module.exports = chestConfig;