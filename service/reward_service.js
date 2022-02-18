const express = require('express');
var log4js = require("log4js");
const myredis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const newChars = require('../config/new_chars.json')
const rewardService = express.Router();

rewardService.get("/get", async (req, res)=>{
    var data = await myredis.get("reward-endgame-config");
    res.send(data);
});

rewardService.post("/set", async (req, res)=>{
    var data = req.body;
    // logger.info(req.body);
    var data = await myredis.set("reward-endgame-config", JSON.stringify(req.body));
    res.send(data);
});


module.exports = rewardService;