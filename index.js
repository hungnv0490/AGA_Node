const express = require('express')
const jacpot = require('./jacpot.js')
const app = express()
const port = 2707
const myRedis = require('./myredis.js')
const mySqlDB = require('./mysqldb.js')

app.use(express.json());

myRedis.loadJacpotConfig();

app.get('/jackpot/get', async (req, res) => {
    res.send(myRedis.jackpotConfig);
});

app.post('/jackpot/set', async (req, res) => {
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
            await myRedis.setJacpotConfig();
            await jacpot.startNewSeason();
            res.send(JSON.stringify({ "code": 200 }));
            return;
        }
        res.send(JSON.stringify({ "code": 100 }));
        return;
    }
    res.send(JSON.stringify({ "code": 101 }));
    return;
});

setTimeout(jacpot.init, 2000);

app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`)
})