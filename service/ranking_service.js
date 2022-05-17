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
const botCasual = require('../config/bot_casual.json');
const botPro = require('../config/bot_pro.json');
const bot = require('../config/bot.json');
var util = require('../util.js');

const rankingService = express.Router();
const RANKING_SEASON = "ranking-season";
const UNAME_TO_UID = "uname_to_uid";
const RankingBoardDataCasual = "ranking-board-data-casual";//data
const RankingBoardDataPro = "ranking-board-data-pro";//data
const ClaimRankingRewardLock = "claim-ranking-reward-lock:";

rankingService.task = null;

rankingService.get('/season/info', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.endTimeSec = Math.round((new Date(myRedis.rankingTimeConfig.endTime) - new Date()) / 1000);
    if (dataRes.endTimeSec < 0) dataRes.endTimeSec = 0;
    res.send(dataRes);
});

rankingService.get('/season/get', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = myRedis.rankingTimeConfig;
    dataRes.season = await myRedis.GET("prev-ranking-season");
    dataRes.current = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
    res.send(dataRes);
});

rankingService.post('/season/set', async (req, res, next) => {
    try {
        console.log(req.body);
        var startTime = req.body.startTime;
        var endTime = req.body.endTime;
        var st = new Date(startTime);
        var et = new Date(endTime);
        var dataRes = {};
        dataRes.current = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
        if (st < et && new Date() < et) {
            if (myRedis.rankingTimeConfig.startTime != startTime || myRedis.rankingTimeConfig.endTime != endTime) {
                myRedis.rankingTimeConfig.startTime = startTime;
                myRedis.rankingTimeConfig.endTime = endTime;
                await myRedis.setRankingTimeConfig();
                await rankingService.startNewSeason(req.body.season, req.body.ignoreBot);
                if(req.body.ignoreBot == 1){
                    await rankingService.cleaRankingBot();
                }
                dataRes.code = 200;
                res.send(dataRes);
                return;
            }
            dataRes.code = 100;
            res.send(dataRes);
            return;
        }
        dataRes.code = 101;
        res.send(dataRes);
        return;
    } catch (error) {
        next(error);
    }
});

rankingService.post('/season/update', async (req, res, next) => {
    try {
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
                await rankingService.updateSeason();
                res.send({ "code": 200 });
                return;
            }
            res.send({ "code": 100 });
            return;
        }
        res.send({ "code": 101 });
        return;
    } catch (error) {
        next(error);
    }
});

rankingService.get('/rankboard/get', async (req, res) => {
    var dataRes = {}
    dataRes.code = 200;
    dataRes.data = rankboard_config;
    res.send(dataRes);
});

rankingService.post('/rankboard/set', async (req, res, next) => {
    try {
        var json = req.body;
        rankBoardConfig.proDiamond = json.proDiamond;
        rankBoardConfig.casualDiamond = json.casualDiamond;
        rankBoardConfig.ADRPro = json.ADRPro;
        rankBoardConfig.ADRCasual = json.ADRCasual;
        rankBoardConfig.pro = [];
        rankBoardConfig.casual = [];
        for (var item of json.pro) {
            var rankBoard = RankBoard.fromJson(item);
            rankBoardConfig.pro.push(rankBoard);
        }
        for (var item of json.casual) {
            var rankBoard = RankBoard.fromJson(item);
            rankBoardConfig.casual.push(rankBoard);
        }
        // rankBoardConfig.pro = json.pro;
        // rankBoardConfig.casual = json.casual;
        await myRedis.setBoardConfig();
        var dataRes = {}
        dataRes.code = 200;
        dataRes.data = rankboard_config;
        res.send(dataRes);
    } catch (error) {
        next(error);
    }
});

rankingService.get('/user/:username/:isPro', async (req, res, next) => {
    try {
        var dataRes = {}
        var userId = await myRedis.hGet(UNAME_TO_UID, req.params.username);
        if (userId == null) {
            dataRes.code = 101;
            res.send(dataRes);
            return;
        }

        var rankingReward = "";
        var adrRewardKey = "";
        var isPro = (req.params.isPro == 1);
        if (isPro) {
            rankingReward = "ranking-reward-pro:" + req.params.username;
            adrRewardKey = "ranking-reward-adr-pro:" + req.params.username;
        }
        else {
            rankingReward = "ranking-reward-casual:" + req.params.username;
            adrRewardKey = "ranking-reward-adr-casual:" + req.params.username;
        }

        var data = await myRedis.hGet(isPro ? RankingBoardDataPro : RankingBoardDataCasual, userId);
        var reward = await myRedis.get(rankingReward);
        var rewardAdr = await myRedis.get(adrRewardKey);
        if (data == null) {
            var ranking = new Ranking(req.params.username, req.params.username,1, "", 0, 0, 0, RankBoard.RankingType.None);
            dataRes.code = 200;
            dataRes.data = ranking;
            dataRes.reward = (reward == null ? 0 : reward);
            dataRes.rewardAdr = (rewardAdr == null ? 0 : rewardAdr);
            res.send(dataRes);
        }
        else {
            dataRes.code = 200;
            dataRes.data = JSON.parse(data);
            dataRes.reward = (reward == null ? 0 : reward);
            dataRes.rewardAdr = (rewardAdr == null ? 0 : rewardAdr);
            res.send(dataRes);
        }
    } catch (error) {
        next(error);
    }
});

rankingService.get('/:username', async (req, res, next) => {
    try {
        var dataRes = {}
        var userId = await myRedis.hGet(UNAME_TO_UID, req.params.username);
        // if (userId == null) {
        //     dataRes.code = 101;
        //     res.send(dataRes);
        //     return;
        // }

        // var isPro = (req.params.isPro == 1);
        // if (isPro) {
            // var rankingReward = "ranking-reward-pro:" + req.params.username;
            // dataRes.rewardPro = await myRedis.get(rankingReward);
        //     adrRewardKey = "ranking-reward-adr-pro:" + req.params.username;
        // }
        // else {
            // rankingReward = "ranking-reward-casual:" + req.params.username;
            // var rewardCasual = await myRedis.get(rankingReward);
        //     adrRewardKey = "ranking-reward-adr-casual:" + req.params.username;
        // }
        var dt = await myRedis.hGet(RankingBoardDataPro, userId);
        if(dt){
            var data = JSON.parse(dt);
            dataRes.pointPro = data.Point;
            dataRes.topPro = data.Rank; 
        }             
        else{
            dataRes.pointPro = 0;
            dataRes.topPro = 0;
        } 
        dt = await myRedis.hGet(RankingBoardDataCasual, userId);
        if(dt){
            var data = JSON.parse(dt);
            dataRes.pointCasual = data.Point;
            dataRes.topCasual = data.Rank;
        }
        else{
            dataRes.pointCasual = 0;
            dataRes.topCasual = 0;
        } 
        // var data = await myRedis.hGet(isPro ? RankingBoardDataPro : RankingBoardDataCasual, userId);
        // var reward = await myRedis.get(rankingReward);
        // var rewardAdr = await myRedis.get(adrRewardKey);
        // if (data == null) {
        //     var ranking = new Ranking(req.params.username, req.params.username,1, "", 0, 0, 0, RankBoard.RankingType.None);
        //     dataRes.code = 200;
        //     dataRes.data = ranking;
        //     dataRes.reward = (reward == null ? 0 : reward);
        //     dataRes.rewardAdr = (rewardAdr == null ? 0 : rewardAdr);
        //     res.send(dataRes);
        // }
        // else {
        //     dataRes.code = 200;
        //     dataRes.data = JSON.parse(data);
        //     dataRes.reward = (reward == null ? 0 : reward);
        //     dataRes.rewardAdr = (rewardAdr == null ? 0 : rewardAdr);
            res.send(dataRes);
        // }
    } catch (error) {
        next(error);
    }
});

rankingService.post('/user/claimed', verifyTokenBlockchain, async (req, res, next) => {
    try {
        var dataRes = {}
        var rankingReward = "";
        // var adrRewardKey = "";
        var isPro = (req.body.isPro == 1);
        var isADD = true;
        if (isPro) {
            if (isADD) rankingReward = "ranking-reward-pro:" + req.body.username;
            else rankingReward = "ranking-reward-adr-pro:" + req.body.username;
        }
        else {
            if (isADD) rankingReward = "ranking-reward-casual:" + req.body.username;
            else rankingReward = "ranking-reward-adr-casual:" + req.body.username;
        }
        var userId = await myRedis.hGet(UNAME_TO_UID, req.body.username);
        if (userId == null) {
            dataRes.code = 101;
            res.send(dataRes);
            return;
        }
        var key = ClaimRankingRewardLock + userId;
        var value = await myRedis.get(key);
        if (value != null && value == "true") {
            dataRes.code = 201;
            res.send(dataRes);
            return;
        }
        await myRedis.set(key, true);
        await myRedis.expire(key, 1);
        var rewardStr = await myRedis.get(rankingReward);
        logger.info("ranking_service claim:" + rewardStr);
        var reward = 0;
        if (rewardStr) {
            reward = parseInt(rewardStr);
        }
        if (reward) {
            var createTime = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
            var sql = `Insert Into trans_log (session_id,user_id,cash,cash_gain,gem,gem_gain,time,type)
                        Values (${-1},${userId},'${0}','${reward}','0','0','${createTime}',14)`;
            mySqlDB.execute(sql, async function (err, result, fields) {
                var UPDATE_MONEY = "update-money";
                await myRedis.publish(UPDATE_MONEY, `${userId}`);
                mySqlDB.claimRequestHis(req.body.username, reward, isADD ? 2 : 3);
                await myRedis.del(rankingReward);
                await myRedis.set(key, false);
                dataRes.code = 200;
                dataRes.msg = reward;
                res.send(dataRes);
            });
        }
        else {
            await myRedis.set(key, false);
            dataRes.code = 200;
            dataRes.msg = reward;
            res.send(dataRes);
        }
    } catch (error) {
        next(error);
    }

});

rankingService.get('/rankboard/:isPro', async (req, res, next) => {
    try {
        var dataRes = {}
        dataRes.code = 200;
        dataRes.data = req.params.isPro == 1 ? rankboard_config.pro : rankboard_config.casual;
        res.send(dataRes);
    } catch (error) {
        next(error);
    }
});

rankingService.get('/:isPro', async (req, res, next) => {
    try {
        logger.info("1:");
        var dataRes = {}
        var isPro = req.params.isPro == 1;
        var amount = 99;
        // if (!isPro) amount = 500;
        var topRankings = await myRedis.boards(isPro, amount);
        logger.info("2:");
        var str = "";
        for (var i = 0; i < topRankings.length; i++) {
            logger.info("topRankings[i]:" + topRankings[i]);
            if (i < topRankings.length - 1)
                str += `${topRankings[i].UserId},`;
            else str += `${topRankings[i].UserId}`;
        }
        logger.info("2:" + 2);

        var sql = `select user_id, nickname, avatar, frame from users where user_id in (${str});`;
        mySqlDB.query(sql, function (err, result, fields) {
            var dt = {};
            if (!err) {
                for (var r of result) {
                    // logger.info("result:" + r);
                    var key = `${r.user_id}`;
                    dt[key] = r;
                }
            }
            // logger.info("1:" + dt);
            var data = [];
            for (var i = 0; i < topRankings.length; i++) {
                var js = topRankings[i];
                var key = `${js.UserId}`;
                // logger.info("key:" + key);
                if (dt.hasOwnProperty(key)) {
                    // logger.info("dt[key]:" + dt[key]);
                    js.Nickname = dt[key].nickname;
                    js.Avatar = dt[key].avatar;
                    js.Frame = dt[key].frame;
                }
                data.push(js);
            }
            dataRes.code = 200;
            dataRes.data = data;
            res.send(dataRes);
        });
    } catch (error) {
        next(error);
    }
});

rankingService.get('/bot/insert-db', async (req, res, next) => {
    try {
        logger.info("insert-db");
        var dataRes = {}
        var array = bot["Sheet1"];
        var names = {}
        for (let index = 0; index < array.length; index++) {
            const element = array[index];
            var id = 1;
            if (names[`${element.Name}`] > 0) {
                id = names[`${element.Name}`];
                id += 1;
                names[`${element.Name}`] = id;
            }
            else names[`${element.Name}`] = 1;
            var name = element.Name;
            if (id > 1) name += (id - 1);

            var sql = `insert ignore into users(username, nickname, password, type, avatar, frame) value('${name}', '${name}', 'aaa', 1, ${element.Avatar}, ${element.Frame});`;
            mySqlDB.execute(sql, async function (err, result, fields) {
                if (err) {
                    // handle error
                } else {
                    var userId = result.insertId;
                    await myRedis.hSet("uname_to_uid", name, userId);
                    await myRedis.hSet("uid_to_uname", userId, name);
                    await myRedis.hSet("nname_to_uid", name, userId);
                    await myRedis.hSet("userid_to_nickname", userId, name);
                }
            });
        }

        // var array = botCasual["Sheet1"];
        // var names = {}
        // for (let index = 0; index < array.length; index++) {
        //     const element = array[index];
        //     var id = 1;
        //     if(names[`${element.Name}`] > 0){
        //         id = names[`${element.Name}`];
        //         id += 1;
        //         names[`${element.Name}`] = id;
        //     }
        //     else names[`${element.Name}`] = 1;
        //     var name = element.Name;
        //     if(id > 1) name += (id-1);
        //     var sql = `insert ignore into users(user_id, username, nickname, password, type, avatar, frame) value(${100000000+index}, '${name}', '${name}', 'aaa', 1, ${element.Avatar}, ${element.Frame});`;
        //     mySqlDB.execute(sql, function (err, fiels, result){

        //     });
        //     await myRedis.hSet("uname_to_uid", name, index + 100000000);
        //     await myRedis.hSet("uid_to_uname", index + 100000000, name);
        //     await myRedis.hSet("nname_to_uid", name, index + 100000000);
        //     await myRedis.hSet("userid_to_nickname", index + 100000000, name);
        // }
        // var array = botPro["Sheet1"];
        // for (let index = 0; index < array.length; index++) {
        //     const element = array[index];
        //     var id = 1;
        //     if(names[`${element.Name}`] > 0){
        //         id = names[`${element.Name}`];
        //         id += 1;
        //         names[`${element.Name}`] = id;
        //     }
        //     else names[`${element.Name}`] = 1;
        //     var name = element.Name;
        //     if(id > 1) name += (id-1);
        //     var sql = `insert ignore into users(user_id, username, nickname, password, type, avatar, frame) value(${200000000+index}, '${name}', '${name}', 'aaa', 1, ${element.Avatar}, ${element.Frame});`;
        //     mySqlDB.execute(sql, function (err, fiels, result){

        //     });        
        //     await myRedis.hSet("uname_to_uid", name, index + 200000000);
        //     await myRedis.hSet("uid_to_uname", index + 200000000, name);
        //     await myRedis.hSet("nname_to_uid", name, index + 200000000);
        //     await myRedis.hSet("userid_to_nickname", index + 200000000, name);
        // }
        dataRes.code = 200;
        res.send(dataRes);
    } catch (error) {
        next(error);
    }
});

rankingService.get('/bot/fake-ranking', async (req, res, next) => {
    try {
        var dataRes = {}
        dataRes.code = 200;
        res.send(dataRes);
        return;
        var array = botCasual["Sheet1"];
        logger.info("fake-ranking");
        var names = {}
        for (let index = 0; index < array.length; index++) {
            const element = array[index];
            var id = 1;
            if (names[`${element.Name}`] > 0) {
                id = names[`${element.Name}`];
                id += 1;
                names[`${element.Name}`] = id;
            }
            else names[`${element.Name}`] = 1;
            var name = element.Name;
            if (id > 1) name += (id - 1);
            var ranking = new Ranking(name, name, 1,element.Avatar, 1, parseInt(element.Point), 100, 1, false);
            var p = parseInt(element.Point);
            var uid = 100000000 + index;
            await myRedis.zAdd("ranking-board-casual", { score: p, value: uid });
            await myRedis.hSet("ranking-board-data-casual", 100000000 + index, JSON.stringify(ranking));
        }
        var array = botPro["Sheet1"];
        for (let index = 0; index < array.length; index++) {
            const element = array[index];
            var id = 1;
            if (names[`${element.Name}`] > 0) {
                id = names[`${element.Name}`];
                id += 1;
                names[`${element.Name}`] = id;
            }
            else names[`${element.Name}`] = 1;
            var name = element.Name;
            if (id > 1) name += (id - 1);
            var ranking = new Ranking(name, name,1, element.Avatar, 1, parseInt(element.Point), 100, 1, false);
            var p = parseInt(element.Point);
            var uid = 200000000 + index;
            await myRedis.zAdd("ranking-board-pro", { score: p, value: uid });
            await myRedis.hSet("ranking-board-data-pro", uid, JSON.stringify(ranking));
        }
        dataRes.code = 200;
        res.send(dataRes);
    } catch (error) {
        next(error);
    }
});

rankingService.get('/bot/clear-ranking', async (req, res, next) => {
    try {
        // var dataRes = {}
        // dataRes.code = 200;
        // res.send(dataRes);
        // return;
        var dataRes = {}
        var array = bot["Sheet1"];
        logger.info("clear-ranking");
        var names = {}
        for (let index = 0; index < array.length; index++) {
            const element = array[index];
            var id = 1;
            if (names[`${element.Name}`] > 0) {
                id = names[`${element.Name}`];
                id += 1;
                names[`${element.Name}`] = id;
            }
            else names[`${element.Name}`] = 1;
            var name = element.Name;
            if (id > 1) name += (id - 1);
            // var p = parseInt(element.Point);
            // var uid = 100000000 + index;

            var uid = await myRedis.hGet("uname_to_uid", name);
            await myRedis.zRem("ranking-board-casual", uid);
            await myRedis.hDel("ranking-board-data-casual", uid);
            await myRedis.zRem("ranking-board-pro", uid);
            await myRedis.hDel("ranking-board-data-pro", uid);
            await myRedis.hDel("ranking_userid_season", uid);
            await myRedis.hDel("ranking_userid_season_casual", uid);
        }

        // var array = botCasual["Sheet1"];
        // logger.info("clear-ranking");
        // var names = {}
        // for (let index = 0; index < array.length; index++) {
        //     const element = array[index];
        //     var id = 1;
        //     if(names[`${element.Name}`] > 0){
        //         id = names[`${element.Name}`];
        //         id += 1;
        //         names[`${element.Name}`] = id;
        //     }
        //     else names[`${element.Name}`] = 1;
        //     var name = element.Name;
        //     if(id > 1) name += (id-1);            
        //     var p = parseInt(element.Point);
        //     var uid = 100000000 + index;
        //     await myRedis.zRem("ranking-board-casual", uid);
        //     await myRedis.hDel("ranking-board-data-casual", uid);
        // }
        // var array = botPro["Sheet1"];
        // for (let index = 0; index < array.length; index++) {
        //     const element = array[index];
        //     var id = 1;
        //     if(names[`${element.Name}`] > 0){
        //         id = names[`${element.Name}`];
        //         id += 1;
        //         names[`${element.Name}`] = id;
        //     }
        //     else names[`${element.Name}`] = 1;
        //     var name = element.Name;
        //     if(id > 1) name += (id-1);
        //     var p = parseInt(element.Point);
        //     var uid = 200000000 + index;
        //     // var ranking = new Ranking(name, name, element.Avatar, 1, p, 100, 1, false);           
        //     await myRedis.zRem("ranking-board-pro", uid);
        //     await myRedis.hDel("ranking-board-data-pro",uid);
        // }
        dataRes.code = 200;
        res.send(dataRes);
    } catch (error) {
        next(error);
    }
});

rankingService.cleaRankingBot = async function () {
    var array = bot["Sheet1"];
    logger.info("clear-ranking");
    var names = {}
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        var id = 1;
        if (names[`${element.Name}`] > 0) {
            id = names[`${element.Name}`];
            id += 1;
            names[`${element.Name}`] = id;
        }
        else names[`${element.Name}`] = 1;
        var name = element.Name;
        if (id > 1) name += (id - 1);
        // var p = parseInt(element.Point);
        // var uid = 100000000 + index;

        var uid = await myRedis.hGet("uname_to_uid", name);
        if(uid && !isNaN(uid)){
            await myRedis.zRem("ranking-board-casual", uid);
            await myRedis.hDel("ranking-board-data-casual", uid);
            await myRedis.zRem("ranking-board-pro", uid);
            await myRedis.hDel("ranking-board-data-pro", uid);
            await myRedis.hDel("ranking_userid_season", uid);
            await myRedis.hDel("ranking_userid_season_casual", uid);
        }
    }
}

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

rankingService.startNewSeason = async function (season, ignoreBot) {
    var endTime = new Date(myRedis.rankingTimeConfig.endTime);
    var curDate = new Date();
    if (endTime > curDate) {
        if (rankingService.task != null) {
            rankingService.task.stop();
            rankingService.task = null;
        }
        await myRedis.rankingStartNewSeason(season, ignoreBot);
        rankingService.init();
    }
}

rankingService.updateSeason = async function () {
    var endTime = new Date(myRedis.rankingTimeConfig.endTime);
    var curDate = new Date();
    if (endTime > curDate) {
        if (rankingService.task != null) {
            rankingService.task.stop();
            rankingService.task = null;
        }
        await myRedis.rankingUpdateSeason();
        rankingService.init();
    }
}

rankingService.rewards = async function (isPro) {
    logger.info("pro:" + isPro);
    var amount = 3000;
    if (!isPro) amount = 2000;
    var topRankings = await myRedis.boards(isPro, amount);
    if (topRankings.length <= 0) return;

    var rankBoardCf = rankBoardConfig.pro;
    var rankBoardDiamond = rankBoardConfig.proDiamond;
    var rankBoardAdr = rankBoardConfig.ADRPro;
    if (!isPro) {
        rankBoardCf = rankBoardConfig.casual;
        rankBoardDiamond = rankBoardConfig.casualDiamond;
        rankBoardAdr = rankBoardConfig.ADRCasual;
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
                // var diamond = Math.floor(rankBoardDiamond * board.PerDiamond / 100 / rankingUsers.length);
                var diamond = board.RewardPerson;
                var adr = Math.floor(rankBoardAdr * board.PerDiamond / 100 / rankingUsers.length);
                // var rewards = `1-0-${diamond}`;
                for (var rankingUser of rankingUsers) {
                    var rankingReward = "";
                    var rewardAdrKey = "";
                    var isCasual = 1;
                    if (isPro) {
                        rankingReward = "ranking-reward-pro:" + rankingUser["UserId"];//username day la user id
                        rewardAdrKey = "ranking-reward-adr-pro:" + rankingUser["UserId"];
                        isCasual = 0;
                    }
                    else {
                        rankingReward = "ranking-reward-casual:" + rankingUser["UserId"];
                        rewardAdrKey = "ranking-reward-adr-casual:" + rankingUser["UserId"];
                    }
                    await myRedis.incrBy(rankingReward, diamond);
                    // await myRedis.incrBy(rewardAdrKey, adr);
                    mySqlDB.updateUserRankingEndSeason(rankingUser["UserId"], board.RankingType, rankingUser["Rank"], season, isCasual ,
                        rankingUser["Point"],diamond);
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