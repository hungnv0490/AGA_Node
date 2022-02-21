const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const chestService = express.Router();
const chestConfig = require('../config/chest_config.js');
const Chest = require("../entities/chest.js")
var PackCard = require('../entities/pack_card.js');

chestService.get('/get', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = chestConfig.toApiRes();
    res.send(dataRes);
});

chestService.post('/set', async (req, res) => {
    logger.log(req.body);
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
});

module.exports = chestService;