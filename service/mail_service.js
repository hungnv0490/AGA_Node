const express = require('express');
var log4js = require("log4js");
const myRedis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const mailService = express.Router();

mailService.post('/add', async (req, res) => {
    var json = req.body;
    logger.info(JSON.stringify(json));
    mySqlDb.addMailBox(json.title, json.content, -1, json.userId, json.rewards, json.isRead, json.isReceived, function (code) {
        var dataRes = {}
        dataRes.code = code;
        res.send(dataRes);
    });
});

module.exports = mailService;