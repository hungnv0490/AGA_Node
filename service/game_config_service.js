const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const gameConfigService = express.Router();
const myRedis = require('../myredis.js');

gameConfigService.get('/get', async (req, res) => {
    var data = await myRedis.get("server-game-config");
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data =  data != null ? JSON.parse(data) : null;
    res.send(dataRes);
});

gameConfigService.post('/set', async (req, res) => {
    logger.log(req.body);
    var data = await myRedis.set("server-game-config", JSON.stringify(req.body));
    var CharConfigNewData = "server-game-config-newdata";
    await myRedis.publish(CharConfigNewData);
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = req.body;
    res.send(dataRes);
});

module.exports = gameConfigService;