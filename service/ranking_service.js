const myRedis = require('../myredis.js')
const mySqlDB = require('../mysqldb.js')
const cron = require('node-cron');
const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const rankBoardConfig = require('../config/rankboard_config.js');
const Ranking = require('../entities/ranking.js')
const RankBoard = require('../entities/rankboard.js')
const verifyTokenBlockchain = require('../middlewares/verifyToken.js');

const rankingService = express.Router();
const RANKING_SEASON = "ranking-season";

rankingService.task = null;

rankingService.get('/season/get', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = myRedis.rankingTimeConfig;
    res.send(dataRes);
});

rankingService.post('/season/set', async (req, res) => {
    console.log(req.body);
    var startTime = req.body.startTime;
    var endTime = req.body.endTime;
    var st = new Date(startTime);
    var et = new Date(endTime);
    if (st < et && new Date() < et) {
        if (myRedis.rankingTimeConfig.startTime != startTime || myRedis.rankingTimeConfig.endTime != endTime) {
            myRedis.rankingTimeConfig.startTime = startTime;
            myRedis.rankingTimeConfig.endTime = endTime;
            await myRedis.setRankingTimeConfig();
            await rankingService.startNewSeason();
            res.send({ "code": 200 });
            return;
        }
        res.send({ "code": 100 });
        return;
    }
    res.send({ "code": 101 });
    return;
});

rankingService.get('/rankboard/get', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = rankboard_config;
    res.send(dataRes);
});

rankingService.post('/rankboard/set', async (req, res) => {
    var json = req.body;
    rankBoardConfig.proDiamond = json.proDiamond;
    rankBoardConfig.casualDiamond = json.casualDiamond;
    rankBoardConfig.pro = json.pro;
    rankBoardConfig.casual = json.casual;
    await myRedis.setBoardConfig();
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = rankboard_config;
    res.send(dataRes);
});

rankingService.get('/user/:username', verifyTokenBlockchain, async (req, res) => {
    var dataRes = {}
    var RankingBoard = "ranking-board";
    var userId = await myRedis.hGet("uname_to_uid", req.params.username);
    if (userId == null) {
        dataRes.code = 101;
        res.send(dataRes);
        return;
    }
    var rankingReward = "ranking-reward:" + req.params.username;
    var data = await myRedis.hGet(RankingBoard, userId);
    var reward = await myRedis.get(rankingReward);
    if (data == null) {
        var ranking = new Ranking(req.params.username, req.params.username, "", 0, 0, 0, RankBoard.RankingType.None);
        dataRes.code = 200;
        dataRes.data = ranking;
        dataRes.reward = (reward == null ? 0 : reward);
        res.send(dataRes);
    }
    else {
        dataRes.code = 200;
        dataRes.data = JSON.parse(data);
        dataRes.reward = (reward == null ? 0 : reward);
        res.send(dataRes);
    }
});

rankingService.get('/user/:username/claimed', verifyTokenBlockchain, async (req, res) => {
    var dataRes = {}
    var rankingReward = "ranking-reward:" + req.params.username;
    var reward = await myRedis.del(rankingReward);
    dataRes.code = 200;
    dataRes.msg = reward;
    res.send(dataRes);
});

rankingService.get('/rankboard/:isPro', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = req.params.isPro == 1 ? rankboard_config.pro : rankboard_config.casual;
    res.send(dataRes);
});

rankingService.get('/:isPro', async (req, res) => {
    var dataRes = {}
    var isPro = req.params.isPro == 1;
    var amount = 4000;
    if (!isPro) amount = 500;
    var topRankings = await myRedis.boards(isPro, 100);
    dataRes.code = 200;
    dataRes.data = topRankings;
    res.send(dataRes);
});

rankingService.init = function () {
    var endTime = new Date(myRedis.rankingTimeConfig.endTime);
    var curDate = new Date();
    logger.info("ranking init end time:" + endTime + " curDate:" + curDate);
    if (endTime > curDate) {
        logger.info("ranking init " + endTime.getDate() + " " + (curDate.getMonth() + 1));
        var job = `${endTime.getSeconds()} ${endTime.getMinutes()} ${endTime.getHours()} ${endTime.getDate()} ${endTime.getMonth() + 1} *`;
        logger.info("ranking init schedule:" + job);
        rankingService.task = cron.schedule(job, async () => {
            await rankingService.rewards(true);
            await rankingService.rewards(false);
            await myRedis.rankingEndSeason();
            rankingService.task.stop();
            rankingService.task = null;
        });
    }
}

rankingService.startNewSeason = async function () {
    var endTime = new Date(myRedis.rankingTimeConfig.endTime);
    var curDate = new Date();
    if (endTime > curDate) {
        if (rankingService.task != null) {
            rankingService.task.stop();
            rankingService.task = null;
        }
        await myRedis.rankingStartNewSeason();
        rankingService.init();
    }
}

rankingService.rewards = async function (isPro) {
    logger.info("pro:" + isPro);
    var amount = 4000;
    if (!isPro) amount = 500;
    var topRankings = await myRedis.boards(isPro, amount);
    if (topRankings.length <= 0) return;

    var rankBoardCf = rankBoardConfig.pro;
    var rankBoardDiamond = rankBoardConfig.proDiamond;
    if (!isPro) {
        rankBoardCf = rankBoardConfig.casual;
        rankBoardDiamond = rankBoardConfig.casualDiamond;
    }
    logger.info('ranking rewards topRankings:' + topRankings);
    logger.info('ranking rewards rankBoardDiamond:' + rankBoardDiamond);
    logger.info('ranking rewards rankBoardCf:' + rankBoardCf);
    var dt = {};
    for (var topRanking of topRankings) {
        if (dt.hasOwnProperty(topRanking.RankingType)) {
            dt[topRanking.RankingType].push(topRanking);
        }
        else {
            dt[topRanking.RankingType] = [topRanking];
        }
    }
    logger.info('ranking rewards dt:' + JSON.stringify(dt));
    var season = await myRedis.get(RANKING_SEASON);
    Object.keys(dt).forEach(async function (key) {
        logger.info('ranking rewards key:' + key);
        for (var board of rankBoardCf) {
            // logger.info("ranking reward board:" + JSON.stringify(board));
            if (board.RankingType == key) {
                logger.info('ranking rewards board.rankingType:' + board.RankingType);
                var rankingUsers = dt[key];
                var diamond = Math.floor(rankBoardDiamond * board.PerDiamond / 100 / rankingUsers.length);
                var rewards = `1-0-${diamond}`;
                for (var rankingUser of rankingUsers) {
                    var rankingReward = "ranking-reward:" + rankingUser["Username"];
                    await myRedis.incrBy(rankingReward, diamond);
                    mySqlDB.updateUserRankingEndSeason(rankingUser["UserId"], board.RankingType, rankingUser["Rank"], season);
                }
                // rankingUsers.forEach(element => {
                // mySqlDB.addMailBox("Ranking reward", `You received reward from ranking with rank ${element["Rank"]}`, -1, element["UserId"], rewards, 0, 0,function(code){

                // });
                //     var rankingReward = "ranking-reward:" + element["Username"];
                //     await myRedis.incrBy(rankingReward, diamond);
                //     mySqlDB.updateUserRankingEndSeason(element["UserId"], board.RankingType, element["Rank"], season);
                // });
                break;
            }
        }
    });
}

module.exports = rankingService;