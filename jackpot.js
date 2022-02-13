const myRedis = require('./myredis.js')
const mySqlDB = require('./mysqldb.js')
const cron = require('node-cron');
const express = require('express');
const { route } = require('express/lib/application');
const jackpot = express.Router();
var log4js = require("log4js");
var logger = log4js.getLogger();

// const jacpot = {}
jackpot.task = null;

jackpot.get('/get', async (req, res) => {
    res.send(myRedis.jackpotConfig);
});

jackpot.post('/set', async (req, res) => {
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
            await jackpot.startNewSeason();
            res.send(JSON.stringify({ "code": 200 }));
            return;
        }
        res.send(JSON.stringify({ "code": 100 }));
        return;
    }
    res.send(JSON.stringify({ "code": 101 }));
    return;
});


jackpot.init = function () {
    var endTime = new Date(myRedis.jackpotConfig.endTime);
    var curDate = new Date();
    logger.info("jackpot init end time:" + endTime + " curDate:" + curDate);
    if (endTime > curDate) {
        logger.info(endTime.getDate() + " " + (curDate.getMonth() + 1));
        var job = `${endTime.getSeconds()} ${endTime.getMinutes()} ${endTime.getHours()} ${endTime.getDate()} ${endTime.getMonth() + 1} *`;
        logger.info("jackpot schedule:" + job);
        jackpot.task = cron.schedule(job, async () => {
            await jackpot.rewards();
        });
    }
}

jackpot.startNewSeason = async function () {
    var endTime = new Date(myRedis.jackpotConfig.endTime);
    var curDate = new Date();
    if (endTime > curDate) {
        if (jackpot.task != null) {
            jackpot.task.stop();
            jackpot.task = null;
        }
        await myRedis.startNewSeason();
        jackpot.init();
    }
}

jackpot.rewards = async function () {
    var userTickets = await myRedis.getJackpotUserTickets();

    logger.info("jackpot rewards:" + userTickets);
    if (userTickets.length > 0) {
        var diamond = myRedis.jackpotConfig.diamond / userTickets.length;
        var rewards = `1-0-${diamond}`;
        userTickets.forEach(element => {
            mySqlDB.addMailBox("Jackpot reward", `You received reward from jackpot with ticket ${element["ticket"]}`, -1, element["userId"], rewards, 0, 0);
        });
        jackpot.task.stop();
        jackpot.task = null;
    }
    else {
        jackpot.task.stop();
        jackpot.task = null;
    }
    await myRedis.endSeason(myRedis.jackpotConfig.diamond);
}

module.exports = jackpot;