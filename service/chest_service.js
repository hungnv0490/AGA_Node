const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const chestService = express.Router();
const chestConfig = require('../config/chest_config.js');
var PackCard = require('../entities/pack_card.js');
var Pack2 = require('../entities/pack2.js');
const verifyToken = require('../middlewares/verifyToken.js');
const mySqlDb = require('../mysqldb.js');

chestService.get('/get', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = chestConfig.toApiRes();
    res.send(dataRes);
});

chestService.post('/set', async (req, res, next) => {
    try {
        logger.info(req.body);
        var json = req.body;
        chestConfig.DailyLoginMaxChestPoint = json.DailyLoginMaxChestPoint;
        chestConfig.DailyMissionMaxChestPoint = json.DailyMissionMaxChestPoint;
        chestConfig.AchievementMaxChestPoint = json.AchievementMaxChestPoint;
        chestConfig.chests = json.chests;
        // for(var chest of json.chests){
        //     var packCardObs = [];
        //     for(var packCard of chest.packCards){
        //         var packCardOb = new PackCard(packCard.Common, packCard.UnCommon, packCard.Rare, packCard.Epic, packCard.Legend);
        //         packCardObs.push(packCardOb);
        //     }
        //     chestObs.push(new Chest(packCardObs));
        // }
        await chestConfig.setConfig();
        // var getOb = chestConfig.getOb(chestObs);
        var dataRes = {}
        dataRes.code = 200;
        dataRes.data = chestConfig.toApiRes();
        res.send(dataRes);
        // res.send(chestConfig.toJson(chestObs));
    } catch (error) {
        next(error);
    }
});

chestService.get('/user/:username', async (req, res, next) => {
    try {
        var dataRes = {};
        var packs = [];
        var username = mySqlDb.escape(req.params.username);
        var sql = `SELECT up.*, p.pack_cards FROM aga.user_pack up
    left join pack p
    on up.pack_id = p.id
    where up.user_id = (select user_id from users where username = ${username});`;
        mySqlDb.query(sql, function (err, result, fields) {
            if (result != null && result.length > 0) {
                for (var rs of result) {
                    var packCards = []
                    var packCardStr_arr = rs.pack_cards.split('|');
                    for (var packCardStr of packCardStr_arr) {
                        var cards = packCardStr.split('-');
                        packCards.push(new PackCard(parseFloat(cards[0]), parseFloat(cards[1]), parseFloat(cards[2]), parseFloat(cards[3]), parseFloat(cards[4])));
                    }
                    var pack = new Pack2(packCards, rs.amount, rs.pack_id);
                    packs.push(pack);
                }
            }
            dataRes.packs = packs;
            dataRes.code = 200;
            res.send(dataRes);
        });
    } catch (error) {
        next(error);
    }
});

chestService.post('/user/claim', verifyToken, async (req, res, next) => {
    try {
        var dataRes = {};
        var username = mySqlDb.escape(req.body.username);
        var packIds = mySqlDb.escape(req.body.packIds);
        packIds = packIds.replaceAll("'", "");
        var sql = `Delete FROM aga.user_pack up  
    where up.user_id = (select user_id from users where username = ${username}) And pack_id in (${packIds});`;
        mySqlDb.query(sql, function (err, result, fields) {
            if (err) {
                logger.error(err);
                dataRes.code = 101;
                dataRes.msg = err.message;
            }
            else {
                dataRes.code = 200;
            }
            res.send(dataRes);
        });
    } catch (error) {
        next(error);
    }
});

module.exports = chestService;