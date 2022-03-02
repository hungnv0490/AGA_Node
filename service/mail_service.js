const express = require('express');
var log4js = require("log4js");
const myRedis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const mailService = express.Router();
const verifyTokenBlockchain = require('../middlewares/verifyToken.js');

const UNAME_TO_UID = "uname_to_uid";

mailService.post('/add',verifyTokenBlockchain, async (req, res) => {
    var json = req.body;
    logger.info(JSON.stringify(json));
    var receiverId = await myRedis.hGet(UNAME_TO_UID, json.Receiver);
    var sender = -1;
    if(json.Sender != "-1"){
        sender = await myRedis.hGet(UNAME_TO_UID, json.Sender);
    }
    if(!sender || !receiverId){
        var dataRes = {}
        dataRes.code = 101;
        res.send(dataRes);
        logger.info("mail_service sender:" + sender + " receiver:" + receiverId);
        return;
    }
    mySqlDb.addMailBox(json.title, json.content, sender, receiverId, json.rewards, 0, 1, function (code) {
        var dataRes = {}
        dataRes.code = code;
        res.send(dataRes);
    });
});

module.exports = mailService;