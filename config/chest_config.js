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
chestConfig.PackIds = "";
chestConfig.DailyLoginPackIds = "";
chestConfig.chests = [
    new Chest([PackCard.Default()]),
    new Chest([PackCard.Default()]),
    new Chest([PackCard.Default()]),
    new Chest([PackCard.Default()]),
];
chestConfig.dailyLoginPacks = [
    new Chest([PackCard.Default()])
];

const CHEST_CONFIG_NEW_DATA = "chest-config-new-data";

chestConfig.init = async function () {
    var fromRedis = await myRedis.get(CHEST_CONFIG);
    if (fromRedis != null) {
        var json = JSON.parse(fromRedis);
        chestConfig.DailyLoginMaxChestPoint = json.DailyLoginMaxChestPoint;
        chestConfig.DailyMissionMaxChestPoint = json.DailyMissionMaxChestPoint;
        chestConfig.AchievementMaxChestPoint = json.AchievementMaxChestPoint;
        chestConfig.PackIds = json.PackIds;
    }

    var sql = `Select * from pack where (name = 'ChestReward' OR name='DailyLoginReward') AND create_time in (SELECT max(create_time) FROM aga.pack where name = 'ChestReward');;`
    logger.info("chest_config init sql:" + sql);
    mysqlDb.execute(sql, async function (err, results, fields) {
        if (results != null && results.length > 0) {
            var ids = "";
            var dailyLoginPackIds = "";
            logger.info("chest_config init results:" + JSON.stringify(results));
            chestConfig.chests = [];
            chestConfig.dailyLoginPacks = []
            for (var result of results) {
                var packCardStrs = result.pack_cards.split('|');
                var packCards = []
                for (var packCardStr of packCardStrs) {
                    var cards = packCardStr.split('-');
                    packCards.push(new PackCard(parseFloat(cards[0]), parseFloat(cards[1]), parseFloat(cards[2]), parseFloat(cards[3]), parseFloat(cards[4])));
                }
                if (result.name == 'ChestReward') {
                    ids += result.id + "|";
                    chestConfig.chests.push(new Chest(packCards));
                }
                else {
                    dailyLoginPackIds += result.id + "|";
                    chestConfig.dailyLoginPacks.push(new Chest(packCards));
                }
            }
            chestConfig.PackIds = ids.slice(0, -1);
            chestConfig.DailyLoginPackIds = dailyLoginPackIds.slice(0, -1);
            await myRedis.set(CHEST_CONFIG, chestConfig.toRedis());
            await myRedis.publish(CHEST_CONFIG_NEW_DATA);
        }
        else {
            var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
            var values = "";
            for (var pack of chestConfig.chests) {
                values += `('ChestReward','Mission','${pack.Format()}','','${createTime}'),`;
            }
            var i = 0;
            for (var pack of chestConfig.dailyLoginPacks) {
                if (i < chestConfig.dailyLoginPacks.length - 1)
                    values += `('DailyLoginReward','Login','${pack.Format()}','','${createTime}'),`;
                else values += `('DailyLoginReward','Login','${pack.Format()}','','${createTime}')`;
                i++;
            }

            var sql = `Insert into pack(name,pack.describe,pack_cards,url,create_time)
                        Values ${values};`;
            logger.info("chest_config init sql 1:" + sql);
            mysqlDb.execute(sql, async function (err, results, fields) {
                logger.info("chest_config init results 1:" + JSON.stringify(results));
                var sql = `Select * From pack where (name='ChestReward' OR name='DailyLoginReward') And create_time='${createTime}';`
                logger.info("chest_config init sql 2:" + sql);
                mysqlDb.execute(sql, async function (err, results, fields) {
                    if (results != null && results.length > 0) {
                        var ids = "";
                        var dailyLoginPackIds = "";
                        logger.info("chest_config init results 2:" + JSON.stringify(results));
                        for (var result of results) {
                            if (result.name == 'ChestReward') {
                                ids += result.id + "|";
                            }
                            else {
                                dailyLoginPackIds += result.id + "|";
                            }
                        }
                        chestConfig.PackIds = ids.slice(0, -1);
                        chestConfig.DailyLoginPackIds = dailyLoginPackIds.slice(0, -1);
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
    cf.PackIds = chestConfig.PackIds;
    cf.DailyLoginPackIds = chestConfig.DailyLoginPackIds;
    return JSON.stringify(cf);
}

chestConfig.toApiRes = function () {
    var cf = {};
    cf.DailyLoginMaxChestPoint = chestConfig.DailyLoginMaxChestPoint
    cf.DailyMissionMaxChestPoint = chestConfig.DailyMissionMaxChestPoint;
    cf.AchievementMaxChestPoint = chestConfig.AchievementMaxChestPoint;
    cf.chests = chestConfig.chests;
    cf.dailyLoginPacks = chestConfig.dailyLoginPacks;
    return cf;
}

chestConfig.setConfig = async function () {
    // var oldChestConfigStr = await myRedis.get(CHEST_CONFIG);
    // var oldChestConfig = JSON.parse(oldChestConfigStr);
    var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
    var values = "";
    for (var pack of chestConfig.chests) {
        values += `('ChestReward','Mission','${pack.Format()}','','${createTime}'),`;
    }
    var i = 0;
    for (var pack of chestConfig.dailyLoginPacks) {
        if (i < chestConfig.dailyLoginPacks.length - 1)
            values += `('DailyLoginReward','Login','${pack.Format()}','','${createTime}'),`;
        else values += `('DailyLoginReward','Login','${pack.Format()}','','${createTime}')`;
        i++;
    }

    var sql = `Insert into pack(name,pack.describe,pack_cards,url,create_time)
                Values ${values};`;
    logger.info("chest_config init sql 1:" + sql);
    mysqlDb.execute(sql, async function (err, results, fields) {
        logger.info("chest_config init results 1:" + JSON.stringify(results));
        var sql = `Select * From pack where (name='ChestReward' OR name='DailyLoginReward') And create_time='${createTime}';`
        logger.info("chest_config init sql 2:" + sql);
        mysqlDb.execute(sql, async function (err, results, fields) {
            if (results != null && results.length > 0) {
                var ids = "";
                var dailyLoginPackIds = "";
                logger.info("chest_config init results 2:" + JSON.stringify(results));
                for (var result of results) {
                    if (result.name == 'ChestReward') {
                        ids += result.id + "|";
                    }
                    else {
                        dailyLoginPackIds += result.id + "|";
                    }
                }
                chestConfig.PackIds = ids.slice(0, -1);
                chestConfig.DailyLoginPackIds = dailyLoginPackIds.slice(0, -1);
                await myRedis.set(CHEST_CONFIG, chestConfig.toRedis());
                await myRedis.publish(CHEST_CONFIG_NEW_DATA);
            }
        });
    });
}
module.exports = chestConfig;