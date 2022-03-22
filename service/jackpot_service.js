const myRedis = require('../myredis.js')
const mySqlDb = require('../mysqldb.js')
const cron = require('node-cron');
const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const verifyTokenBlockchain = require('../middlewares/verifyToken.js');

const jackpotService = express.Router();
// const jacpot = {}
jackpotService.task = null;
const JACKPOT_SEASON = "jackpot-season";
const JACKPOT_REWARD = "jackpot-reward:";
const UNAME_TO_UID = "uname_to_uid";
const JACKPOT_PREV_TICKET = "jackpot-prev-ticket";

jackpotService.get('/season/info', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.endTimeSec = Math.round((new Date(myRedis.jackpotConfig.endTime) - new Date()) / 1000);
    if(dataRes.endTimeSec < 0) dataRes.endTimeSec = 0;
    res.send(dataRes);
});

jackpotService.get('/get', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = myRedis.jackpotConfig;
    res.send(dataRes);
});

jackpotService.post('/set', async (req, res, next) => {
    console.log(req.body);
    try {
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
            res.send({ "code": 100 });
            return;
        }
        res.send({ "code": 101 });
    } catch (error) {
        next(error);
    }
});

jackpotService.get('/ticket/user/:username', async (req, res, next) => {
    try {
        var dataRes = {}
        dataRes.tickets = [];
        var username = mySqlDb.escape(req.params.username);
        var usernameStr = username.replaceAll("'", "");
        var season = await myRedis.get(JACKPOT_SEASON);
        var userId = await myRedis.hGet(UNAME_TO_UID, usernameStr);
        var jackpotReward = JACKPOT_REWARD + userId;
        var reward = await myRedis.get(jackpotReward);
        dataRes.reward = (reward == null ? 0 : reward);
        var sql = `SELECT * FROM aga.user_ticket
        where user_id = (select user_id from users where username = '${usernameStr}') And season = '${season}';`;
        logger.info("jackpot_service ticket user sql:" + sql);
        mySqlDb.query(sql, function (err, result, fields) {
            if (err == null) {
                dataRes.code = 200;
                if (result != null && result.length > 0) {
                    for (var rs of result) {
                        dataRes.tickets.push(rs.ticket);
                    }
                }
                res.send(dataRes);
                logger.info("jackpot_service ticket user:" + JSON.stringify(dataRes));
            }
            else {
                dataRes.code = 600;
                res.send(dataRes);
                logger.info("jackpot_service ticket user:" + JSON.stringify(dataRes));
            }
        });
    } catch (error) {
        next(error);
    }
});

jackpotService.get('/user/:username/claimed', verifyTokenBlockchain, async (req, res, next) => {
    try {
        var dataRes = {}
        var username = mySqlDb.escape(req.params.username);
        var usernameStr = username.replaceAll("'", "");
        var userId = await myRedis.hGet(UNAME_TO_UID, usernameStr);
        if (!userId) {
            dataRes.code = 201;
            dataRes.reward = 0;
            res.send(dataRes);
            logger.info("jackpot_service user " + username + " claim:" + JSON.stringify(dataRes));
            return;
        }
        var jackpotReward = JACKPOT_REWARD + userId;
        var reward = await myRedis.get(jackpotReward);
        mySqlDb.claimRequestHis(req.params.username, reward, 4);
        await myRedis.del(jackpotReward);
        dataRes.code = 200;
        dataRes.reward = reward;
        res.send(dataRes);
    } catch (error) {
        next(error);
    }
});

jackpotService.get('/season', async (req, res, next) => {
    try {
        var dataRes = {}
        // logger.info("end time:" + myRedis.jackpotConfig.endTime);
        var endTime = new Date(myRedis.jackpotConfig.endTime);
        const diffTime = Math.floor(endTime.getTime() - new Date().getTime());
        if (diffTime <= 0) {
            var ticket = await myRedis.get(JACKPOT_PREV_TICKET);
            dataRes.timeAppear = 0;
            dataRes.ticket = ticket == null ? "" : ticket;
        }
        else {
            dataRes.timeAppear = Math.round(diffTime / 1000);
            dataRes.ticket = "";
        }
        res.send(dataRes);
    } catch (error) {
        next(error);
    }
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
        for (var userTicket of userTickets) {
            var jackpotReward = JACKPOT_REWARD + userTicket["userId"];
            await myRedis.incrBy(jackpotReward, diamond);
            mySqlDb.addJackpotHis(userTicket["userId"], diamond, season, function (a) {

            });
        }
        // userTickets.forEach(element => {
        // mySqlDB.addMailBox("Jackpot reward", `You received reward from jackpot with ticket ${element["ticket"]}`, -1, element["userId"], rewards, 0, 0,function(code){

        // });
        //     mySqlDb.addJackpotHis(element["userId"], diamond, season, function (a) {

        //     });
        // });
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
