const express = require('express')
const app = express()
const port = 2707
const myRedis = require('./myredis.js')
const mySqlDB = require('./mysqldb.js')
const jacpot = require('./jackpot.js')
var log4js = require("log4js");
var logger = log4js.getLogger();

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
        default: {appenders: ['cheese', 'test'], level: 'debug'},
    }
});

app.use(express.json());
app.use('/jackpot', jacpot);

app.get("/test", function(req,res){
    res.send("haha");
});

myRedis.loadJacpotConfig();
setTimeout(jacpot.init, 2000);

app.listen(port, async () => {
    logger.info("start server");
})