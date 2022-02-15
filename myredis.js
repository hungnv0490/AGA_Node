var log4js = require("log4js");
var logger = log4js.getLogger();
const nanoId = require("nanoid")
const nanoTk = nanoId.customAlphabet("ABCDEFGHIJKLMNOPQRSTUVXYZ123456789", 9);
const nanoidNumber = nanoId.customAlphabet("123456789", 10);
const nanoidSS = nanoId.customAlphabet("ABCDEFGHIJKLMNOPQRSTUVXYZ123456789", 5);
const rankBoardConfig = require('./config/rankboard_config.js')
const redis = require('redis');
var config = require('./config.json');
const myredis = redis.createClient({
    host: config.redisHost,
    port: 6379,
    password: config.redisPass
});
myredis.connect();
var util = require('./util.js');

const JACKPOT_CONFIG = "jackpot-config";
const JACKPOT_PAUSE = "JackpotPause";
const JACKPOT_START_NEW = "JackpotStartSeason";

const JACKPOT_UNIQUE = "jackpot-unique";
const JACKPOT_SECRET = "jackpot-secret";
const JACKPOT_SEASON = "jackpot-season";
const JACKPOT_TICKET = "jackpot-ticket";
const JACKPOT_NEAREST = "jackpot-nearest";
const JACKPOT_USER_TICKET = "jackpot-user-ticket";
const JACKPOT_PREV_SEASON = "jackpot-prev-season";
const JACKPOT_PREV_DIAMOND = "jackpot-prev-diamond";
const JACKPOT_PREV_TICKET = "jackpot-prev-ticket";
const JACKPOT_START_TIME = "jackpot-start-time";
const JACKPOT_END_TIME = "jackpot-end-time";

const RANKING_PAUSE = "ranking-pause";
const RANKING_START_NEW = "ranking-start-new";
const RANKING_SEASON = "ranking-season";
const RANKING_START_TIME = "ranking-start-time";
const RANKING_END_TIME = "ranking-end-time";

const RANKING_CONFIG_SEASON = "ranking-config-season";
const RANKING_CONFIG_BOARD = "ranking-config-board";
const RankingBoardPro = "ranking-board-pro";
const RankingBoardCasual = "ranking-board-casual";
const RankingBoard = "ranking-board";
const RankingLoadNewData = "ranking-load-new-data";

const PUBLIC_CARD_ADD = "card-add";
const PUBLIC_MISSION_ADD = "mission-add";

// var myredis = {}
// myredis.client = client;

myredis.jackpotConfig = {
    "diamond": 1000000,
    "startTime": "2022-01-01 01:01:01",
    "endTime": "2022-01-01 01:01:01"
}
myredis.rankingTimeConfig = {
    "startTime": "2022-01-01 01:01:01",
    "endTime": "2022-01-01 01:01:01"
}

myredis.loadJackpotConfig = async function () {
    var value = await myredis.get(JACKPOT_CONFIG);
    logger.info("myredis loadJacpotConfig:" + value);
    if (value !== null) {
        var json = JSON.parse(value);
        myredis.jackpotConfig.diamond = json.diamond;
        myredis.jackpotConfig.startTime = json.startTime;
        myredis.jackpotConfig.endTime = json.endTime;
    }
    else {
        await myredis.set(JACKPOT_CONFIG, JSON.stringify(myredis.jackpotConfig));
    }
    return value;
}

myredis.setJackpotConfig = async function () {
    await myredis.set(JACKPOT_CONFIG, JSON.stringify(myredis.jackpotConfig));
}

myredis.getJackpotUserTickets = async function () {
    var maxScore = await myredis.sendCommand(["zrevrange", JACKPOT_NEAREST, 0, 0, "withscores"]);
    console.log(maxScore);
    if (maxScore.length >= 2) {
        var score = maxScore[1];
        console.log(score);
        var tickets = await myredis.sendCommand(["zrevrangebyscore", JACKPOT_NEAREST, score, score]);
        if (tickets.length > 0) {
            var res = [];
            for (var ticket of tickets) {
                var userId = await myredis.hGet(JACKPOT_USER_TICKET, ticket);
                console.log(userId);
                res.push({ "userId": userId, "ticket": ticket });
            }
            var diamondPerUser = myredis.jackpotConfig.diamond / res.length;
            console.log("dm:" + diamondPerUser);
            return res;
        }
        return [];
    }
    return [];
}

myredis.jackpotStartNewSeason = async function () {
    await myredis.publish(JACKPOT_PAUSE);
    var endTime = new Date(myredis.jackpotConfig.endTime);
    var endTimeStr = util.dateFormat(endTime, "%Y-%m-%d %H:%M:%S", false);//endTime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var startTime = new Date(myredis.jackpotConfig.startTime);
    var startTimeStr = util.dateFormat(startTime, "%Y-%m-%d %H:%M:%S", false);;//startTime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var season = nanoidSS();
    var jackpotTk = nanoTk();
    var secret = nanoidNumber();
    await myredis.SET(JACKPOT_SEASON, season);
    await myredis.SET(JACKPOT_TICKET, jackpotTk);
    await myredis.SET(JACKPOT_SECRET, secret);
    await myredis.SET(JACKPOT_START_TIME, startTimeStr);
    await myredis.SET(JACKPOT_END_TIME, endTimeStr);

    await myredis.DEL(JACKPOT_NEAREST);
    await myredis.DEL(JACKPOT_USER_TICKET);
    var start = `${startTimeStr}|${endTimeStr}|${season}|${jackpotTk}|${secret}`;
    await myredis.publish(JACKPOT_START_NEW, start);
}

myredis.jackpotEndSeason = async function (diamond) {
    await myredis.publish(JACKPOT_PAUSE);
    var season = await myredis.get(JACKPOT_SEASON);
    var tk = await myredis.get(JACKPOT_TICKET);
    await myredis.SET(JACKPOT_PREV_SEASON, season);
    await myredis.SET(JACKPOT_PREV_TICKET, tk);
    await myredis.SET(JACKPOT_PREV_DIAMOND, diamond);

    await myredis.DEL(JACKPOT_SEASON);
    await myredis.DEL(JACKPOT_TICKET);
    await myredis.DEL(JACKPOT_SECRET);
    await myredis.DEL(JACKPOT_START_TIME);
    await myredis.DEL(JACKPOT_END_TIME);
    await myredis.DEL(JACKPOT_NEAREST);
    await myredis.DEL(JACKPOT_USER_TICKET);
}

myredis.loadRankingConfig = async function () {
    var value = await myredis.get(RANKING_CONFIG_SEASON);
    logger.info("myredis RANKING_CONFIG_SEASON:" + value);
    if (value !== null) {
        var json = JSON.parse(value);
        myredis.rankingTimeConfig.startTime = json.startTime;
        myredis.rankingTimeConfig.endTime = json.endTime;
    }
    else {
        await myredis.set(RANKING_CONFIG_SEASON, JSON.stringify(myredis.rankingTimeConfig));
    }
    var board = await myredis.get(RANKING_CONFIG_BOARD);
    logger.info("myredis RANKING_CONFIG_BOARD:" + board);
    if (board !== null) {
        var json = JSON.parse(board);
        rankBoardConfig.proDiamond = json.proDiamond;
        rankBoardConfig.casualDiamond = json.casualDiamond;
        rankBoardConfig.pro = json.pro;
        rankBoardConfig.casual = json.casual;
        // logger.info("myredis loadRankingConfig :" + rankBoardConfig.pro);
    }
    else await myredis.set(RANKING_CONFIG_BOARD, rankBoardConfig.toJson());
}

myredis.setRankingTimeConfig = async function () {
    await myredis.set(RANKING_CONFIG_SEASON, JSON.stringify(myredis.rankingTimeConfig));
}

myredis.setBoardConfig = async function(){
    await myredis.set(RANKING_CONFIG_BOARD, JSON.stringify(rankBoardConfig));
    await myredis.publish(RankingLoadNewData);
}

myredis.boards = async function (isPro, top) {
    var key = RankingBoardPro;
    if (!isPro) key = RankingBoardCasual;
    var maxScore = await myredis.sendCommand(["zrevrange", key, 0, top, "withscores"]);
    // logger.info("myredis boards:" + maxScore);
    var res = [];
    if (maxScore.length > 0) {
        var i = 0;
        for (var value of maxScore) {
            if (i % 2 == 0) {
                // logger.info("value:" + value)
                var ranking = await myredis.hGet(RankingBoard, value);
                // logger.info("ranking:" + ranking)
                if (ranking != null) res.push(JSON.parse(ranking));
            }
            i++;
        }
    }
    return res;
}

myredis.rankingStartNewSeason = async function () {
    logger.info("myredis rankingStartNewSeason RANKING_PAUSE:" + RANKING_PAUSE);
    await myredis.publish(RANKING_PAUSE);
    var endTime = new Date(myredis.rankingTimeConfig.endTime);
    var endTimeStr = util.dateFormat(endTime, "%Y-%m-%d %H:%M:%S", false);//endTime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var startTime = new Date(myredis.rankingTimeConfig.startTime);
    var startTimeStr = util.dateFormat(startTime, "%Y-%m-%d %H:%M:%S", false);;//startTime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var season = nanoidSS();
    await myredis.SET(RANKING_SEASON, season);
    await myredis.SET(RANKING_START_TIME, startTimeStr);
    await myredis.SET(RANKING_END_TIME, endTimeStr);

    await myredis.DEL(RankingBoardPro);
    await myredis.DEL(RankingBoardCasual);
    await myredis.DEL(RankingBoard);

    var start = `${startTimeStr}|${endTimeStr}|${season}`;
    logger.info("myredis rankingStartNewSeason RANKING_START_NEW:" + start);
    await myredis.publish(RANKING_START_NEW, start);
}

myredis.rankingEndSeason = async function () {
    await myredis.publish(RANKING_PAUSE);
    // var season = await myredis.get(JACKPOT_SEASON);
    // var tk = await myredis.get(JACKPOT_TICKET);
    // await myredis.SET(JACKPOT_PREV_SEASON, season);
    // await myredis.SET(JACKPOT_PREV_TICKET, tk);
    // await myredis.SET(JACKPOT_PREV_DIAMOND, diamond);

    await myredis.DEL(RANKING_SEASON);
    await myredis.DEL(RANKING_START_TIME);
    await myredis.DEL(RANKING_END_TIME);
    await myredis.DEL(RankingBoardPro);
    await myredis.DEL(RankingBoardCasual);
    await myredis.DEL(RankingBoard);
}

myredis.addNewCard = async function(userId, charId, level, cardId)
{
    var start = `${userId}|${charId}|${level}|${cardId}`;
    await myredis.publish(PUBLIC_CARD_ADD, start);
}

myredis.updateMission = async function(userId, missionType, amount)
{
    var start = `${userId}|${missionType}|${amount}`;
    await myredis.publish(PUBLIC_MISSION_ADD, start);
}
module.exports = myredis;
