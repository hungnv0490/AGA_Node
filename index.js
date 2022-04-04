require('dotenv').config();
const express = require('express')
const app = express()
const port = 2707
const myRedis = require('./myredis.js')
const mySqlDb = require('./mysqldb.js')
var log4js = require("log4js");
var logger = log4js.getLogger();
var util = require('./util.js');
const jwt = require('jsonwebtoken');
const https = require("https");
const fs = require("fs");
var http = require('http');
var Ranking = require('./entities/ranking.js');

var battleConfig = require('./config/battle_config.js');
var chestConfig = require('./config/chest_config.js');

const jackpotService = require('./service/jackpot_service.js')
const rankingService = require('./service/ranking_service.js')
var chestService = require('./service/chest_service.js');
var missionService = require('./service/mission_service.js');
var cardService = require('./service/card_service.js');
var charService = require('./service/char_service.js');
var rewardService = require('./service/battle_service.js');
var gameConfigService = require('./service/game_config_service.js');
var mailService = require('./service/mail_service.js');
var moneyService = require('./service/money_service.js');

log4js.configure({
    replaceConsole: false,
    appenders: {
        cheese: {
            //  set the type as dateFile
            type: 'dateFile',
            //  configuration file name myLog.log
            filename: 'logs/myLog.log',
            //  specifies the encoding format as utf-8
            encoding: 'utf-8',
            //  configuration layout， custom patterns are used here pattern
            layout: {
                type: "pattern",
                //  configuration patterns are described below 
                pattern: '%d %m'
            },
            //  log files by date （ day ） cutting 
            pattern: "yyyy-MM-dd",
            //  when rolling back old log files, make sure to  .log  at the end （ only in the alwaysIncludePattern  for false  to take effect ）
            keepFileExt: true,
            //  the output log file name is always included pattern  end date 
            alwaysIncludePattern: true,
        },
        test: {
            type: 'console',
        },
    },
    categories: {
        //  set default categories
        default: { appenders: ['cheese', 'test'], level: 'debug' },
    }
});

app.disable('x-powered-by');
const session = require('express-session')
let RedisStore = require("connect-redis")(session)
app.set('trust proxy', 1) // trust first proxy
app.use(
    session({
        store: new RedisStore({ client: myRedis }),
        saveUninitialized: false,
        secret: "HL@1&^)#",
        resave: false,
        name: "game AGA"
    })
)

app.use(express.json());
app.use('/jackpot', jackpotService);
app.use('/ranking', rankingService);
app.use('/chest', chestService);
app.use('/mission', missionService);
app.use('/card', cardService);
app.use('/char', charService);
app.use('/battle', rewardService);
app.use('/server-game-config', gameConfigService);
app.use('/mail', mailService);
app.use('/diamond', moneyService);
// app.use('/diamond', moneyService);

app.get("/mysql/test", function (req, res, next) {
    try {
        mySqlDb.test(function (dt) {
            res.send(dt);
        })
    } catch (error) {
        next(error);
    }

    // try {
    //     await myRedis.set("test", 1);
    //     throw new Error("Broken");
    // } catch (error) {
    //     next(error);
    // }
});

app.use(function (err, req, res, next) {
    logger.error(err);
    res.send({ error: 999, track: err.stack });
    res.end();
});

setTimeout(initConfig, 1000);
setTimeout(init, 2000);

async function initConfig() {
    await myRedis.loadJackpotConfig();
    await myRedis.loadRankingConfig();
    await battleConfig.init();
    await chestConfig.init();
}

async function init() {
    jackpotService.init();
    rankingService.init();
    cardService.init();
    // var sql = `Select *, now() nw from users where user_id = ${2}`;
    // var nextSecond = 0;
    // var times = 0;
    // mySqlDb.query(sql, (err, result, fields)=>{
    //     logger.info(result);
    //     logger.info(JSON.stringify(result));
    //     if(result.length > 0){
    //         var dt = result[0];
    //         times = dt.withdraw_times;
    //         var lastDate = new Date(dt.withdraw_last_date);
    //         logger.info(lastDate);
    //         if(lastDate.getDate() == new Date().getDate()){
    //             if(times < 5) {
    //                 var nextDate = new Date(lastDate.getTime() + 30 * 60 * 1000);
    //                 var ms = nextDate.getTime() - lastDate.getTime();
    //                 nextSecond  = Math.round(ms / 1000);
    //             }
    //             else{
    //                 var nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
    //                 var startNextDate =  util.dateFormat(nextDate, "%Y-%m-%d", false);
    //                 // logger.info("startNextDate:" + startNextDate);
    //                 var ms = new Date(startNextDate).getTime() - lastDate.getTime();
    //                 nextSecond  = Math.round(ms / 1000);
    //             }
    //         }
    //         else{
    //             var nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
    //             var startNextDate =  util.dateFormat(nextDate, "%Y-%m-%d", false);
    //             // logger.info("startNextDate:" + startNextDate);
    //             var ms = new Date(startNextDate).getTime() - lastDate.getTime();
    //             nextSecond  = Math.round(ms / 1000);
    //         }
    //     }
    //     logger.info("times:" + times + " next:" + nextSecond);
    // });
}

// https.createServer(
    // Provide the private and public key to the server by reading each
    // file's content with the readFileSync() method.
// {
//   key: fs.readFileSync("key.pem"),
//   cert: fs.readFileSync("cert.pem"),
// },
// app
// )
// app.listen(port, async () => {
//     // var sign = jwt.sign({name:'aga',start:2022,type:'game'}, process.env.tokenSecret);
//     // logger.info(sign);
//     console.log("port:" + port);
//     logger.info("start server:" + util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false));
// })
http.createServer(app.handle.bind(app)).listen(2707, ()=>{
    var rb = new Ranking("haha", "hihi", "1", 200, 100, 100, 0, false);

    logger.info("start on " + 2707);
    logger.info(rb.GetRankBoard(false).RankingType);
});
https.createServer({
//   ca: fs.readFileSync('./server.ca-bundle'),
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}, app.handle.bind(app)).listen(2708, ()=>{
    logger.info("start on 2708");
});