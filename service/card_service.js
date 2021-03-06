const express = require('express');
var log4js = require("log4js");
const myredis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const newChars = require('../config/new_chars.json')
const cardService = express.Router();
const Mission = require('../entities/mission.js');
const verifyTokenBlockchain = require('../middlewares/verifyToken.js');
const util = require("../util.js");

const UNAME_TO_UID = "uname_to_uid";

cardService.characters = [];

cardService.post('/add', verifyTokenBlockchain, async (req, res, next) => {
    logger.info(JSON.stringify(req.body));
    try {
        var response = {};
        var json = req.body;
        var userId = 1;
        // var userId = await myredis.hGet(UNAME_TO_UID, json.username);
        // if (!userId) {
        //     response.code = 101;
        //     response.tokenId = json.tokenId;
        //     res.send(response);
        //     return;
        // }
        // var lifeTime = 1000;
        // var charConfig = await myredis.get("char-config");
        // var obj = JSON.parse(charConfig);
        // var keys = Object.keys(obj);
        // for (var i = 0; i < keys.length; i++) {
        //     var charId = charConfig[keys[i]];
        //     if (charId == json.charId) {
        //         lifeTime = 1000;
        //     }
        // }
        var nftId = json.cardId;        
        var charId = util.getCharIdFromNftId(nftId);
        var cardId = 100;
        // mySqlDb.addUserCard(userId, json.tokenId, json.charId, json.level, lifeTime, 0, async function (cardId) {
            if (cardId != 0) {
                await myredis.addNewCard(userId, charId, json.level, cardId);
                for (var char of cardService.characters) {
                    if (char.Id == charId) {
                        mySqlDb.insertOrUpdateUserMission(userId, Mission.missionType.CollectAmountCard, 1, 0, 0, async function () {
                            await myredis.updateMission(userId, Mission.missionType.CollectAmountCard, 1, 0, 0);
                        });

                        var rarity = char.Rarity;
                        var role = char.Role;
                        var missionType = Mission.missionType.None;
                        if (rarity == "Common") {
                            missionType = Mission.missionType.CollectCardCommon;
                        }
                        else if (rarity == "Uncommon") {
                            missionType = Mission.missionType.CollectCardUnCommon;
                        }
                        else if (rarity == "Rare") {
                            missionType = Mission.missionType.CollectCardRare;
                        }
                        else if (rarity == "Epic") {
                            missionType = Mission.missionType.CollectCardEpic;
                        }
                        else if (rarity == "Legendary") {
                            missionType = Mission.missionType.CollectCardLegendary;
                        }
                        mySqlDb.insertOrUpdateUserMission(userId, missionType, 1, 0, 0, async function () {
                            await myredis.updateMission(userId, missionType, 1, 0, 0);
                        });
                        var missionType2 = Mission.missionType.None;
                        if (role == "Caster") {
                            missionType2 = Mission.missionType.CollectCardCaster;
                        }
                        else if (role == "Fighter") {
                            missionType2 = Mission.missionType.CollectCardFighter;
                        }
                        else if (role == "Protecter") {
                            missionType2 = Mission.missionType.CollectCardProtector;
                        }
                        mySqlDb.insertOrUpdateUserMission(userId, missionType2, 1, 0, 0, async function () {
                            await myredis.updateMission(userId, missionType2, 1, 0, 0);
                        });
                    }
                }
            }
            response.code = 200;
            response.cardId = nftId;
            res.send(response);
        // });
    } catch (error) {
        next(error);
    }
});

cardService.post('/remove', verifyTokenBlockchain, async (req, res, next) => {
    logger.info(req.body);
    try {
        var response = {};
        var json = req.body;
        var userId = await myredis.hGet(UNAME_TO_UID, json.username);
        if (!userId) {
            response.code = 101;
            response.cardId = json.cardId;
            res.send(response);
            return;
        }
        // mySqlDb.removeUserCard(userId, json.cardId, async function (code) {
            // if (code == 200) {
                await myredis.removeCard(userId, json.cardId);
            // }
            response.code = code;
            response.cardId = json.cardId;
            res.send(response);
        // });
    } catch (error) {
        next(error);
    }
});

cardService.post('/fusion', verifyTokenBlockchain, async (req, res, next) => {
    logger.info(JSON.stringify(req.body));
    try {
        var response = {};
        var json = req.body;
        var userId = await myredis.hGet(UNAME_TO_UID, json.username);
        if (!userId) {
            response.code = 101;
            response.tokenId = json.tokenId;
            res.send(response);
            return;
        }
        var charId = util.getCharIdFromNftId(json.cardId);
        mySqlDb.insertOrUpdateUserMission(userId, Mission.missionType.FusionCardLevel, 1, charId, json.level, async function () {
            await myredis.updateMission(userId, Mission.missionType.FusionCardLevel, 1, charId, json.level);
            mySqlDb.insertOrUpdateUserMission(userId, Mission.missionType.FusionAmount, 1, 0, 0, async function () {
                await myredis.updateMission(userId, Mission.missionType.FusionAmount, 1, 0, 0);
                response.code = 200;
                response.tokenId = json.tokenId;
                res.send(response);
            });
        });
    } catch (error) {
        next(error);
    }
});

cardService.init = function () {
    Object.keys(newChars).forEach(function (a) {
        var char = newChars[a][0];
        // logger.info("wtf:"  + char);
        cardService.characters.push({ Id: char.Id, Rarity: char.Rarity, Role: char.Role });
    });
}


module.exports = cardService;