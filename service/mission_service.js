const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const missionService = express.Router();

missionService.get('/cate/:cateId/type/:missionType', async (req, res) => {
    logger.info("mission_service req:"+JSON.stringify(req.params));
    mySqlDb.getMission(req.params.cateId, req.params.missionType, function (ms) {
        res.send(JSON.stringify(ms));
    });
});

missionService.post('/update', async (req, res) => {
    logger.log(req.body);
    var json = req.body;
    mySqlDb.updateMission(json.id,json.name, json.des, json.char_id, json.char_level, json.mission_type, json.mission_cate, json.count_unlock, json.rewards,
        json.active, function(err){
        res.sendStatus(err);
    })
});

missionService.post('/add', async (req, res) => {
    // logger.log(req.body);
    var json = req.body;
    mySqlDb.addMission(json.name, json.des, json.char_id, json.char_level, json.mission_type, json.mission_cate, json.count_unlock, json.rewards,
        json.active, function(err){
        res.sendStatus(err);
    })
});

module.exports = missionService;