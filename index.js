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

app.use(function(err, req, res, next) {
    logger.error(err);
    res.send({error:999, track:err.stack});
    res.end();
});

setTimeout(initConfig, 1000);
setTimeout(init, 2000);

async function initConfig() {
    await myRedis.loadJackpotConfig();
    await myRedis.loadRankingConfig();
    await battleConfig.init();
    await chestConfig.init();
    // var dataRes = {}
    // dataRes.tickets = [];
    // var sql = `SELECT * FROM aga.user_ticket
    //     where user_id = (select user_id from users where username = '2f4b1bb82ad4ed48c3e008d2b8b9c3fe') And season = '9FCMR';`;
    // mySqlDb.query(sql, function(err, result, fields){
    //     logger.info(err);
    //     if(err == null){
    //         dataRes.code = 200;
    //         if(result && result.length > 0){
    //             for(var rs of result){
    //                 dataRes.tickets.push(rs.ticket);
    //             }
    //         }
    //         // res.send(dataRes);
    //         logger.info(dataRes);
    //     }
    //     else{
    //         dataRes.code = 600;
    //         logger.info(dataRes);
    //     }
    // });
}

async function init() {
    jackpotService.init();
    rankingService.init();
    cardService.init();
}

app.listen(port, async () => {
    // var sign = jwt.sign({name:'aga',start:2022,type:'game'}, process.env.tokenSecret);
    // logger.info(sign);
    console.log(process.env.mysqlHot || process.env.mysqlHot_Product);
    logger.info("start server:" + util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false));
})
