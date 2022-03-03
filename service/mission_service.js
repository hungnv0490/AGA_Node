const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const missionService = express.Router();

missionService.get('/cate/:cateId/type/:missionType', async (req, res, next) => {
    try {
        logger.info("mission_service req:" + JSON.stringify(req.params));
        mySqlDb.getMission(req.params.cateId, req.params.missionType, function (ms) {
            var dataRes = {}
            dataRes.code = 200;
            dataRes.data = ms;
            res.send(dataRes);
        });
    } catch (error) {
        next(error);
    }
});

missionService.post('/update', async (req, res, next) => {
    try {
        logger.info(req.body);
        var json = req.body;
        mySqlDb.updateMission(json.id, json.name, json.des, json.char_id, json.char_level, json.mission_type, json.mission_cate, json.count_unlock, json.rewards,
            json.active, function (err) {
                res.sendStatus(err);
            })
    } catch (error) {
        next(error);
    }
});

missionService.post('/add', async (req, res, next) => {
    // logger.info(req.body);
    try {
        var json = req.body;
        mySqlDb.addMission(json.name, json.des, json.char_id, json.char_level, json.mission_type, json.mission_cate, json.count_unlock, json.rewards,
            json.active, function (err) {
                res.sendStatus(err);
            })
    } catch (error) {
        next(error);
    }
});

module.exports = missionService;