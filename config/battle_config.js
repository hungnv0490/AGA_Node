const myRedis = require('../myredis')
var PackCard = require('../entities/pack_card.js');
var Pack = require('../entities/pack.js')
var log4js = require("log4js");
var logger = log4js.getLogger();
var mysqlDb = require('../mysqldb.js');
var util = require('../util.js');

// const BATTLE_PACK_CONFIG = "battle-pack-config";
const BattleRewardPackIds = "battle-reward-packids";

battleConfig = {}
battleConfig.packs =
    [
        new Pack([PackCard.Default()], 1),
        new Pack([PackCard.Default()], 1),
        new Pack([PackCard.Default()], 1),
        new Pack([PackCard.Default()], 1),
    ];

battleConfig.init = async function () {
    var sql = `Select * from pack where name = 'BattleReward' AND create_time in (SELECT max(create_time) FROM aga.pack where name = 'BattleReward');;`
    logger.info("battle_config init sql:" + sql);
    mysqlDb.execute(sql, async function (err, results, fields) {
        if (results != null && results.length > 0) {
            var ids = "";
            var i = 0;
            logger.info("battle_config init results:" + JSON.stringify(results));
            packTime = results[0].create_time;
            for (var result of results) {
                if (i < results.length - 1)
                    ids += result.id + "|";
                else ids += result.id;
                i++;
            }
            await myRedis.set(BattleRewardPackIds, ids);
        }
        else {
            var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
            var values = "";
            var i = 0;
            for (var pack of battleConfig.packs) {

                if (i < battleConfig.packs.length - 1)
                    values += `('BattleReward','Battle reward','${pack.Format()}','','${createTime}'),`;
                else values += `('BattleReward','Battle reward','${pack.Format()}','','${createTime}')`;
                i++;
            }
            var sql = `Insert into pack(name,pack.describe,pack_cards,url,create_time)
                        Values ${values};`;
            logger.info("battle_config init sql 1:" + sql);
            mysqlDb.execute(sql, async function (err, results, fields) {
                logger.info("battle_config init results 1:" + JSON.stringify(results));
                var sql = `Select * from pack where name = 'BattleReward' AND create_time in (SELECT max(create_time) FROM aga.pack where name = 'BattleReward');;`
                logger.info("battle_config init sql 2:" + sql);
                mysqlDb.execute(sql, async function (err, results, fields) {
                    if (results != null && results.length > 0) {
                        var ids = "";
                        var i = 0;
                        logger.info("battle_config init results 2:" + JSON.stringify(results));
                        for (var result of results) {
                            if (i < results.length - 1)
                                ids += result.id + "|";
                            else ids += result.id;
                            i++;
                        }
                        await myRedis.set(BattleRewardPackIds, ids);
                    }
                });
            });
        }
    });
}

battleConfig.toJson = function () {
    return battleConfig;
}

battleConfig.setConfig = async function () {
    var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
    var i = 0;
    var values = "";
    for (var pack of battleConfig.packs) {
        if (i < battleConfig.packs.length - 1)
            values += `('BattleReward','Battle','${pack.Format()}','','${createTime}'),`;
        else values += `('BattleReward','Battle','${pack.Format()}','','${createTime}')`;
        i++;
    }
    var sql = `Insert into pack(name,pack.describe,pack_cards,url,create_time)
                Values ${values};`;
    logger.info("battle_config setConfig sql 1:" + sql);
    mysqlDb.execute(sql, async function (err, results, fields) {
        logger.info("battle_config setConfig results 1:" + JSON.stringify(results));
        var sql = `Select * From pack where name='BattleReward' And create_time='${createTime}';`
        logger.info("battle_config isetConfigit sql 2:" + sql);
        mysqlDb.execute(sql, async function (err, results, fields) {
            if (results != null && results.length > 0) {
                var ids = "";
                var i = 0;
                logger.info("battle_config setConfig results 2:" + JSON.stringify(results));
                for (var result of results) {
                    if (i < results.length - 1)
                        ids += result.id + "|";
                    else ids += result.id;
                    i++;
                }
                await myRedis.set(BattleRewardPackIds, ids);
                // var sql = `Delete From pack Where id in (${oldIds.replaceAll('|',',')});`
                // logger.info("battle_config setConfig sql 3:" + sql);
                // mysqlDb.execute(sql, function(err, results, fields){
                // });
            }
        });
    });
}
module.exports = battleConfig;