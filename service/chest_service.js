const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const chestService = express.Router();
const chestConfig = require('../config/chest_config.js');
var PackCard = require('../entities/pack_card.js');
var Pack2 = require('../entities/pack2.js');
const verifyToken = require('../middlewares/verifyToken.js');
const mySqlDb = require('../mysqldb.js');
const myRedis = require('../myredis.js');
var Chest = require('../entities/chest.js');

// chestService.get('/get', async (req, res) => {
//     var dataRes = {}
//     dataRes.code = 200;
//     dataRes.data = chestConfig.toApiRes();
//     res.send(dataRes);
// });

// chestService.post('/set', async (req, res, next) => {
//     try {
//         logger.info(req.body);
//         var json = req.body;
//         chestConfig.DailyLoginMaxChestPoint = json.DailyLoginMaxChestPoint;
//         chestConfig.DailyMissionMaxChestPoint = json.DailyMissionMaxChestPoint;
//         chestConfig.AchievementMaxChestPoint = json.AchievementMaxChestPoint;
//         chestConfig.chests = []
//         chestConfig.dailyLoginPacks = []

//         for(var chest of json.chests){
//             var packCardObs = [];
//             for(var packCard of chest.packCards){
//                 var packCardOb = new PackCard(packCard.Common, packCard.UnCommon, packCard.Rare, packCard.Epic, packCard.Legend);
//                 packCardObs.push(packCardOb);
//             }
//             chestConfig.chests.push(new Chest(packCardObs));
//         }
//         for(var chest of json.dailyLoginPacks){
//             var packCardObs = [];
//             for(var packCard of chest.packCards){
//                 var packCardOb = new PackCard(packCard.Common, packCard.UnCommon, packCard.Rare, packCard.Epic, packCard.Legend);
//                 packCardObs.push(packCardOb);
//             }
//             chestConfig.dailyLoginPacks.push(new Chest(packCardObs));
//         }

//         await chestConfig.setConfig();
//         var dataRes = {}
//         dataRes.code = 200;
//         dataRes.data = chestConfig.toApiRes();
//         res.send(dataRes);
//         // res.send(chestConfig.toJson(chestObs));
//     } catch (error) {
//         next(error);
//     }
// });

// chestService.get('/user/:username', async (req, res, next) => {
//     try {
//         var dataRes = {};
//         var packs = [];
//         var username = mySqlDb.escape(req.params.username);
//         var sql = `SELECT up.*, p.pack_cards FROM aga.user_pack up
//     left join pack p
//     on up.pack_id = p.id
//     where up.user_id = (select user_id from users where username = ${username});`;
//         mySqlDb.query(sql, function (err, result, fields) {
//             if (result != null && result.length > 0) {
//                 for (var rs of result) {
//                     var packCards = []
//                     var packCardStr_arr = rs.pack_cards.split('|');
//                     for (var packCardStr of packCardStr_arr) {
//                         var cards = packCardStr.split('-');
//                         packCards.push(new PackCard(parseFloat(cards[0]), parseFloat(cards[1]), parseFloat(cards[2]), parseFloat(cards[3]), parseFloat(cards[4])));
//                     }
//                     var pack = new Pack2(packCards, rs.amount, rs.pack_id);
//                     packs.push(pack);
//                 }
//             }
//             dataRes.packs = packs;
//             dataRes.code = 200;
//             res.send(dataRes);
//         });
//     } catch (error) {
//         next(error);
//     }
// });

chestService.get('/user/:username', async (req, res, next) => {
    try {
        var dataRes = {};
        var packs = [];
        var username = mySqlDb.escape(req.params.username);
        var sql = `SELECT amount from user_pack
                where user_id = (select user_id from users where username = ${username});`;
        mySqlDb.query(sql, function (err, result, fields) {
            logger.info(result);
            var amount = 0;
            if (result && result.length > 0) {
                amount = result[0].amount;
            }
            dataRes.amount = amount;
            dataRes.code = 200;
            res.send(dataRes);
        });
    } catch (error) {
        next(error);
    }
});

// chestService.post('/user/claim', verifyToken, async (req, res, next) => {
//     try {
//         var dataRes = {};
//         var username = mySqlDb.escape(req.body.username);
//         var usernameStr = username.replaceAll("'", "");
//         // var pack = mySqlDb.escape(req.body.pack);
//         // pack = pack.replaceAll("'", "");
//         // var fm = res
//         var packId = req.body.packId;
//         var amount = req.body.amount;
//         const UNAME_TO_UID = "uname_to_uid";
//         var uid = await myRedis.hGet(UNAME_TO_UID, usernameStr);
//         if (!uid) {
//             dataRes.code = 201;
//             dataRes.msg = "user not exist in game";
//             res.send(dataRes);
//             return;
//         }
//         var key = `username-pack-claim-lock:${usernameStr}`;
//         var value = await myRedis.get(key);
//         if (value != null && value == "true") {
//             dataRes.code = 202;
//             dataRes.msg = "please try again";
//             res.send(dataRes);
//             return;
//         }
//         await myRedis.set(key, true);
//         await myRedis.expire(key, 1);

//         var sql = `Select count(*) as x From aga.user_pack
//                     where user_id = ${uid} And pack_id = ${packId};`;
//         mySqlDb.query(sql, async function (err, result, fields) {
//             if (err) {
//                 logger.error(err);
//                 dataRes.code = 203;
//                 dataRes.msg = err.message;
//                 res.send(dataRes);
//                 await myRedis.set(key, false);
//             }
//             else {
//                 var max = result[0].x;
//                 if (amount > max) {
//                     dataRes.code = 204;
//                     dataRes.msg = "too max amount, max is:" + max;
//                     res.send(dataRes);
//                     await myRedis.set(key, false);
//                 }
//                 else {
//                     sql = `Update aga.user_pack up set amount=amount-${amount}  
//                             where up.user_id = ${uid} And pack_id = ${packId} And amount >= ${amount};`;
//                     mySqlDb.query(sql, async function (err, result, fields) {
//                         if (err) {
//                             logger.error(err);
//                             dataRes.code = 101;
//                             dataRes.msg = err.message;
//                         }
//                         else {
//                             dataRes.code = 200;
//                         }
//                         res.send(dataRes);
//                         await myRedis.set(key, false);
//                     });
//                 }
//             }
//         });

//     } catch (error) {
//         next(error);
//     }
// });

chestService.post('/user/claim', verifyToken, async (req, res, next) => {
    try {
        var dataRes = {};
        var username = mySqlDb.escape(req.body.username);
        var usernameStr = username.replaceAll("'", "");
        // var packId = req.body.packId;
        var amount = req.body.amount;
        if(isNaN(amount) || amount <= 0){
            dataRes.code = 205;
            dataRes.msg = "amount error";
            res.send(dataRes);
            return;
        }
        const UNAME_TO_UID = "uname_to_uid";
        var uid = await myRedis.hGet(UNAME_TO_UID, usernameStr);
        if (!uid) {
            dataRes.code = 201;
            dataRes.msg = "user not exist in game";
            res.send(dataRes);
            return;
        }
        var key = `username-pack-claim-lock:${usernameStr}`;
        var value = await myRedis.get(key);
        if (value != null && value == "true") {
            dataRes.code = 202;
            dataRes.msg = "please try again";
            res.send(dataRes);
            return;
        }
        await myRedis.set(key, true);
        await myRedis.expire(key, 1);

        var sql = `Select amount as x From aga.user_pack where user_id = ${uid};`;
        mySqlDb.query(sql, async function (err, result, fields) {
            if (err) {
                logger.error(err);
                dataRes.code = 203;
                dataRes.msg = err.message;
                res.send(dataRes);
                await myRedis.set(key, false);
            }
            else {
                var max = result[0].x;
                if (amount > max) {
                    dataRes.code = 204;
                    dataRes.msg = "too max amount, max is:" + max;
                    res.send(dataRes);
                    await myRedis.set(key, false);
                }
                else {
                    sql = `Update aga.user_pack up set amount=amount-${amount}  
                            where up.user_id = ${uid} And amount >= ${amount};`;
                    mySqlDb.query(sql, async function (err, result, fields) {
                        if (err) {
                            logger.error(err);
                            dataRes.code = 101;
                            dataRes.msg = err.message;
                        }
                        else {
                            dataRes.code = 200;
                            dataRes.amount_leave = max - amount;
                        }
                        res.send(dataRes);
                        await myRedis.set(key, false);
                    });
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

chestService.post('/add-pack-user', verifyToken, async (req, res, next) => {
    try {
        logger.info(req.body);
        var username = mySqlDb.escape(req.body.username);
        var usernameStr = username.replaceAll("'", "");
        const UNAME_TO_UID = "uname_to_uid";
        var uid = await myRedis.hGet(UNAME_TO_UID, usernameStr);
        if (!uid) {
            dataRes.code = 201;
            dataRes.msg = "user not exist in game";
            res.send(dataRes);
            return;
        }

        var dateTimeStr = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
        var sql = `INSERT INTO user_pack
        (user_id,
        pack_id,
        amount,create_time,is_new)
        VALUES (${uid}, ${1}, ${req.body.amount},'${dateTimeStr}',1)
        ON DUPLICATE KEY UPDATE amount=amount+${req.body.amount},is_new=1;`;
        mySqlDb.execute(sql, (err, result, fields)=>{
            var dataRes = {}
            dataRes.code = 200;
            res.send(dataRes);
        });       
        // res.send(chestConfig.toJson(chestObs));
    } catch (error) {
        next(error);
    }
});

module.exports = chestService;