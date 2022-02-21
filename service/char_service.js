const express = require('express');
var log4js = require("log4js");
const myredis = require('../myredis.js');
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const newChars = require('../config/new_chars.json')
const charService = express.Router();

charService.get("/get", async (req, res)=>{
    var data = await myredis.get("char-config");
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = data;
    res.send(dataRes);
});

charService.post("/set", async (req, res)=>{
    var data = req.body;
    // logger.info(req.body);
    var data = await myredis.set("char-config", JSON.stringify(req.body));
    var CharConfigNewData = "char-config-newdata";
    await myredis.publish(CharConfigNewData);
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = data;
    res.send(dataRes);
});


module.exports = charService;