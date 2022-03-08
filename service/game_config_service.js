const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const gameConfigService = express.Router();
const myRedis = require('../myredis.js');
const mySqlDb = require('../mysqldb.js');

gameConfigService.get('/get', async (req, res) => {
    var data = await myRedis.get("server-game-config");
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = data != null ? JSON.parse(data) : null;
    res.send(dataRes);
});

gameConfigService.post('/set', async (req, res) => {
    logger.info(req.body);
    var dataRes = {}
    if (!req.body["FirstRankingPoint"] || !req.body["FirstEnergy"] || !req.body["MinuteToIncrEnergy"] || !req.body["EnergyPerBattle"]) {
        dataRes.code = 101;
        dataRes.data = req.body;
        res.send(dataRes);
        return;
    }
    var data = await myRedis.set("server-game-config", JSON.stringify(req.body));
    var CharConfigNewData = "server-game-config-newdata";
    await myRedis.publish(CharConfigNewData);
    dataRes.code = 200;
    dataRes.data = req.body;
    res.send(dataRes);
});

gameConfigService.post('/delete-data-redis', async (req, res) => {
    var dataRes = {}
    if (req.body.pass == process.env.tokenSecret) {
        var sql = `call aga.SP_Delete(1)`;
        mySqlDb.query(sql, async function (err, result, fields) {
            if (!err) {
                await myRedis.DEL("chestpoint-achievement");
                await myRedis.DEL("chestpoint-daily-login");
                await myRedis.DEL("chestpoint-daily-mission");
                await myRedis.DEL("daily_reward_push");
                await myRedis.DEL("initDB");
                await myRedis.DEL("jackpot-reward:*");
                var keys = await myRedis.KEYS("jackpot-reward:*");
                if(keys && keys.length > 0){
                    for (var k of keys) {
                        await myRedis.DEL(k);
                    }
                }
                await myRedis.DEL("nname_to_uid");
                await myRedis.DEL("rank_battle_continious");
                keys = await myRedis.KEYS("ranking-reward:*");
                if(keys && keys.length > 0){
                    for (var k of keys) {
                        await myRedis.DEL(k);
                    }
                }
                await myRedis.DEL("uid_to_uname");
                await myRedis.DEL("uname_to_uid");
                await myRedis.DEL("userid_to_nickname");
                await myRedis.DEL("reward-endgame-config");
                await myRedis.DEL("char-fusion-fee-config");
                dataRes.code = 200;
            }
            else dataRes.code = 600;
            res.send(dataRes);
        });
    }
    else {
        dataRes.code = 101;
        res.send(dataRes);
    }
});

module.exports = gameConfigService;