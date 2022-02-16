const express = require('express');
var log4js = require("log4js");
const myredis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const newChars = require('../config/new_chars.json')
const cardService = express.Router();
const Mission = require('../entities/mission.js');

cardService.characters = [];

cardService.post('/add', async (req, res) => {
    logger.log(req.body);
    var json = req.body;
    mySqlDb.addUserCard(json.userId, json.charId, json.level, 0, async function (cardId) {
        if (cardId != 0) {
            await myredis.addNewCard(json.userId, json.charId, json.level, cardId);
            for (var char of cardService.characters) {
                if (char.Id == json.charId) {
                    
                    mySqlDb.insertOrUpdateUserMission(json.userId, Mission.missionType.CollectAmountCard, 1, async function () {
                        await myredis.updateMission(json.userId, Mission.missionType.CollectAmountCard, 1);
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
                    mySqlDb.insertOrUpdateUserMission(json.userId, missionType, 1, async function () {
                        await myredis.updateMission(json.userId, missionType, 1);
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
                    mySqlDb.insertOrUpdateUserMission(json.userId, missionType2, 1, async function () {
                        await myredis.updateMission(json.userId, missionType2, 1);
                    });
                }
            }
        }
        var response = {};
        response.code = 200;
        response.cardId = cardId;
        res.send(JSON.stringify(response));
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