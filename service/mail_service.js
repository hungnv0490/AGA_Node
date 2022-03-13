const express = require('express');
var log4js = require("log4js");
const myRedis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const mailService = express.Router();
const verifyTokenBlockchain = require('../middlewares/verifyToken.js');
var charConfig = require('../config/new_chars.json');
var util = require('../util.js');

const UNAME_TO_UID = "uname_to_uid";

mailService.post('/add', verifyTokenBlockchain, async (req, res, next) => {
    try {
        var json = req.body;
        logger.info(JSON.stringify(json));
        // var receiverId = 1;
        var receiverId = await myRedis.hGet(UNAME_TO_UID, json.Receiver);
        var sender = -1;
        if (json.Sender != "-1") {
            sender = await myRedis.hGet(UNAME_TO_UID, json.Sender);
        }
        if (!sender || !receiverId) {
            var dataRes = {}
            dataRes.code = 101;
            res.send(dataRes);
            logger.info("mail_service sender:" + sender + " receiver:" + receiverId);
            return;
        }
       
        var rewards = '';
        if (json.Rewards) {
            var rws = json.Rewards.split('|');
            for (var i = 0; i < rws.length; i++) {
                var rw = rws[i];
                if(rw){
                    var arr = rw.split('-');
                    var n = rw;
                    if (arr[0] == 2) {
                        var m = util.getCharIdFromNftId(arr[1]);
                        if (m) {
                            n = `${arr[0]}-${m}-${arr[2]}`;
                        }
                    }
                    if (i < rws.length - 1) rewards += n + "|";
                    else rewards += n;
                }                
            }
        }

        mySqlDb.addMailBox(json.Title, json.Content, sender, receiverId, rewards, 0, 1, function (code) {
            var dataRes = {}
            dataRes.code = code;
            res.send(dataRes);
        });
    } catch (error) {
        next(error);
    }
});

module.exports = mailService;