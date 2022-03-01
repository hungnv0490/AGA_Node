const express = require('express');
var log4js = require("log4js");
const myredis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const newChars = require('../config/new_chars.json')
const cardService = express.Router();
const Mission = require('../entities/mission.js');
const verifyTokenBlockchain = require('../middlewares/verifyToken.js');

const UNAME_TO_UID = "uname_to_uid";

cardService.characters = [];

cardService.post('/add', verifyTokenBlockchain, async (req, res) => {
    logger.info(JSON.stringify(req.body));
    var response = {};
    var json = req.body;
    var userId = await myredis.hGet(UNAME_TO_UID, json.username);
    if (!userId) {
        response.code = 101;
        response.cardId = 0;
        res.send(response);
        return;
    }
    var lifeTime = 1000;
    var charConfig = await myredis.get("char-config");
    var obj = JSON.parse(charConfig);
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var charId = charConfig[keys[i]];
      if(charId == json.charId){
        lifeTime = 1000;
      }
    }
    mySqlDb.addUserCard(userId, json.cardId, json.charId, json.level, lifeTime, 0, async function (cardId) {
        if (cardId != 0) {
            await myredis.addNewCard(userId, json.charId, json.level, cardId);
            for (var char of cardService.characters) {
                if (char.Id == json.charId) {
                    
                    mySqlDb.insertOrUpdateUserMission(userId, Mission.missionType.CollectAmountCard, 1, async function () {
                        await myredis.updateMission(userId, Mission.missionType.CollectAmountCard, 1);
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
                    else if (rarity == "Ledendary") {
                        missionType = Mission.missionType.CollectCardLegendary;
                    }
                    mySqlDb.insertOrUpdateUserMission(userId, missionType, 1, async function () {
                        await myredis.updateMission(userId, missionType, 1);
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
                    mySqlDb.insertOrUpdateUserMission(userId, missionType2, 1, async function () {
                        await myredis.updateMission(userId, missionType2, 1);
                    });
                }
            }
        }
        response.code = 200;
        response.cardId = cardId;
        res.send(response);
    });
});

cardService.post('/remove', verifyTokenBlockchain, async (req, res) => {
    logger.info(req.body);
    var response = {};
    var json = req.body;
    var userId = await myredis.hGet(UNAME_TO_UID, json.username);
    if (!userId) {
        response.code = 101;
        response.cardId = 0;
        res.send(response);
        return;
    }
    mySqlDb.removeUserCard(userId, json.cardId, async function (code) {
        if (code == 200) {
            await myredis.removeCard(userId, json.cardId);           
        }
        response.code = code;
        response.cardId = json.cardId;
        res.send(response);
    });
});

cardService.init = function () {
    Object.keys(newChars).forEach(function (a) {
        var char = newChars[a][0];
        // logger.info("wtf:"  + char);
        cardService.characters.push({ Id: char.Id, Rarity: char.Rarity, Role: char.Role });
    });
    // for(var char of cardService.characters){
    //     logger.info(JSON.stringify(char));
    // }
}


module.exports = cardService;