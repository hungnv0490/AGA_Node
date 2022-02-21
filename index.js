const express = require('express')
const app = express()
const port = 2707
const myRedis = require('./myredis.js')
const mySqlDB = require('./mysqldb.js')
var log4js = require("log4js");
var logger = log4js.getLogger();
var util = require('./util.js');
const jackpotService = require('./service/jackpot_service.js')
const rankingService = require('./service/ranking_service.js')
var chestService = require('./service/chest_service.js');
var missionService = require('./service/mission_service.js');
var cardService = require('./service/card_service.js');
var charService = require('./service/char_service.js');
var rewardService = require('./service/battle_service.js');
var gameConfigService = require('./service/game_config_service.js');
var battleConfig = require('./config/battle_config.js');
var chestConfig = require('./config/chest_config.js');
var mailService = require('./service/mail_service.js');

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

app.get("/mysql/test", function (req, res) {
    mySqlDB.test(function(dt){
        res.send(dt);
    })
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
}

app.listen(port, async () => {
    // logger.info("index boards:"+await myRedis.boards(true, 10));
    logger.info("start server:" + util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false));
})
