const express = require('express');
var log4js = require("log4js");
const myredis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const newChars = require('../config/new_chars.json')
const rewardService = express.Router();
const battleConfig = require('../config/battle_config.js');
var PackCard = require('../entities/pack_card.js');
var Pack = require('../entities/pack.js')

rewardService.get("/reward/get", async (req, res)=>{
    var data = await myredis.get("reward-endgame-config");
    var dataRes = {}
    dataRes.code = 200;
    res.send(dataRes);
});

rewardService.post("/reward/set", async (req, res)=>{
    var data = req.body;
    // logger.info(req.body);
    var data = await myredis.set("reward-endgame-config", JSON.stringify(req.body));
    var RewardEndGameLoadNewData = "reward-endgame-newdata";
    await myredis.publish(RewardEndGameLoadNewData);
    var dataRes = {}
    dataRes.code = 200;
    res.send(dataRes);
});

rewardService.get("/pack/get", async (req, res)=>{
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = battleConfig;
    res.send(dataRes);
});

rewardService.post("/pack/set", async (req, res)=>{
    var data = req.body;
    var packObs = [];
    for(var pack of data.packs){
        var packCardObs = [];
        for(var packCard of pack.packCards){
            var packCardOb = new PackCard(packCard.Common, packCard.UnCommon, packCard.Rare, packCard.Epic, packCard.Legend);
            packCardObs.push(packCardOb);
        }
        packObs.push(new Pack(packCardObs, 1));
    }
    battleConfig.packs = packObs;
    await battleConfig.setConfig();
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = battleConfig;
    res.send(dataRes);
});

rewardService.init = function(){

}

module.exports = rewardService;