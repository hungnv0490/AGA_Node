const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const chestService = express.Router();
const chestConfig = require('../config/chest_config.js');

chestService.get('/get', async (req, res) => {
    res.send(chestConfig.toJson());
});

chestService.post('/set', async (req, res) => {
    logger.log(req.body);
    var json = req.body;
    chestConfig.DailyLoginMaxChestPoint = json.DailyLoginMaxChestPoint;
    chestConfig.DailyMissionMaxChestPoint = json.DailyMissionMaxChestPoint;
    chestConfig.AchievementMaxChestPoint = json.AchievementMaxChestPoint;
    chestConfig.chests = json.chests;
    await chestConfig.setConfig();
    res.send(chestConfig.toJson());
});

module.exports = chestService;