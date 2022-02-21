const myRedis = require('../myredis.js')
const mySqlDB = require('../mysqldb.js')
const cron = require('node-cron');
const express = require('express');
const jackpotService = express.Router();
var log4js = require("log4js");
var logger = log4js.getLogger();

// const jacpot = {}
jackpotService.task = null;

jackpotService.get('/get', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = myRedis.jackpotConfig;
    res.send(dataRes);
});

jackpotService.post('/set', async (req, res) => {
    console.log(req.body);
    var diamond = req.body.diamond;
    var startTime = req.body.startTime;
    var endTime = req.body.endTime;
    var st = new Date(startTime);
    var et = new Date(endTime);
    if (st < et && new Date() < et) {
        if (myRedis.jackpotConfig.startTime != startTime || myRedis.jackpotConfig.endTime != endTime) {
            myRedis.jackpotConfig.diamond = diamond;
            myRedis.jackpotConfig.startTime = startTime;
            myRedis.jackpotConfig.endTime = endTime;
            await myRedis.setJackpotConfig();
            await jackpotService.startNewSeason();
            res.send({ "code": 200 });
            return;
        }
        res.send({"code": 100 });
        return;
    }
    res.send({ "code": 101 });
    return;
});


jackpotService.init = function () {
    var endTime = new Date(myRedis.jackpotConfig.endTime);
    var curDate = new Date();
    logger.info("jackpot init end time:" + endTime + " curDate:" + curDate);
    if (endTime > curDate) {
        logger.info(endTime.getDate() + " " + (curDate.getMonth() + 1));
        var job = `${endTime.getSeconds()} ${endTime.getMinutes()} ${endTime.getHours()} ${endTime.getDate()} ${endTime.getMonth() + 1} *`;
        logger.info("jackpot schedule:" + job);
        jackpotService.task = cron.schedule(job, async () => {
            await jackpotService.rewards();
        });
    }
}

jackpotService.startNewSeason = async function () {
    var endTime = new Date(myRedis.jackpotConfig.endTime);
    var curDate = new Date();
    if (endTime > curDate) {
        if (jackpotService.task != null) {
            jackpotService.task.stop();
            jackpotService.task = null;
        }
        await myRedis.jackpotStartNewSeason();
        jackpotService.init();
    }
}

jackpotService.rewards = async function () {
    const JACKPOT_SEASON = "jackpot-season";
    var userTickets = await myRedis.getJackpotUserTickets();
    var season = await myRedis.get(JACKPOT_SEASON);
    logger.info("jackpot rewards:" + userTickets);
    if (userTickets.length > 0) {
        var diamond = Math.floor(myRedis.jackpotConfig.diamond / userTickets.length);
        var rewards = `1-0-${diamond}`;
        userTickets.forEach(element => {
            mySqlDB.addMailBox("Jackpot reward", `You received reward from jackpot with ticket ${element["ticket"]}`, -1, element["userId"], rewards, 0, 0);
            mySqlDB.addJackpotHis(element["userId"], diamond, season, function(a){

            });
        });
        jackpotService.task.stop();
        jackpotService.task = null;
    }
    else {
        jackpotService.task.stop();
        jackpotService.task = null;
    }
    await myRedis.jackpotEndSeason(myRedis.jackpotConfig.diamond);
}

module.exports = jackpotService;
