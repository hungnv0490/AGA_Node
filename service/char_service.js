const express = require('express');
var log4js = require("log4js");
const myredis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const newChars = require('../config/new_chars.json')
const charService = express.Router();

charService.get("/get", async (req, res) => {
    var data = await myredis.get("char-config");
    var dataRes = {}
    dataRes.code = 200;
    // if (data) {
    //     var json = JSON.parse(data);
    //     var keys = Object.keys(json);
    //     var newJson = {};
    //     for (var i = 0; i < keys.length; i++) {
    //         var chara = json[keys[i]];
    //         var arr = [];
    //         for (var j = 0; j < chara.length; j++) {
    //             var ch = chara[j];
    //             if (j == 0) {
    //                 ch.RoleName = ch.Role;
    //                 ch.RarityName = ch.Rarity;
    //                 arr.push(ch);
    //             }
    //             else arr.push(ch);
    //         }
    //         newJson[keys[i]] = arr;
    //     }
    //     logger.info(newJson);
    // }
    dataRes.data = data != null ? JSON.parse(data) : null;
    res.send(dataRes);
});

charService.post("/set", async (req, res) => {
    // logger.info(req.body);
    var data = await myredis.set("char-config", JSON.stringify(req.body));
    var CharConfigNewData = "char-config-newdata";
    await myredis.publish(CharConfigNewData);
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = req.body;
    res.send(dataRes);
});
// private static string ServerConfigKey = "char-fusion-fee-config";

charService.get("/fusion-fee/get", async (req, res) => {
    var data = await myredis.get("char-fusion-fee-config");
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = data != null ? JSON.parse(data) : null;
    res.send(dataRes);
});

charService.post("/fusion-fee/set", async (req, res) => {
    // logger.info(req.body);
    var data = await myredis.set("char-fusion-fee-config", JSON.stringify(req.body));
    var CharConfigNewData = "char-fusion-fee-newdata";
    await myredis.publish(CharConfigNewData);
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = req.body;
    res.send(dataRes);
});



module.exports = charService;