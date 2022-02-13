const redis = require('redis');
const jacpot = require('./jacpot.js');
const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
    password: ''
});
client.connect();

const JACKPOT_CONFIG = "jackpot-config";

const JACKPOT_PAUSE = "JackpotPause";
const JACKPOT_START_NEW= "JackpotStartSeason";
const  JACKPOT_UNIQUE = "jackpot-unique";
const  JACKPOT_SECRET = "jackpot-secret";
const  JACKPOT_SEASON = "jackpot-season";
const  JACKPOT_TICKET = "jackpot-ticket";
const  JACKPOT_NEAREST = "jackpot-nearest";
const  JACKPOT_USER_TICKET = "jackpot-user-ticket";
const  JACKPOT_PREV_SEASON = "jackpot-prev-season";
const  JACKPOT_PREV_DIAMOND = "jackpot-prev-diamond";
const  JACKPOT_PREV_TICKET = "jackpot-prev-ticket";
const  JACKPOT_START_TIME = "jackpot-start-time";
const  JACKPOT_END_TIME = "jackpot-end-time";
const nanoId = require("nanoid")
const nanoid = nanoId.customAlphabet("ABCDEFGHIJKLMNOPQRSTUVXYZ123456789", 9);
const nanoidNumber = nanoId.customAlphabet("123456789", 10);
const nanoidSS = nanoId.customAlphabet("ABCDEFGHIJKLMNOPQRSTUVXYZ123456789", 5);

var myredis = {}
myredis.jackpotConfig ={
    "diamond":1000000,
    "startTime":"2022-01-01 01:01:01",
    "endTime":"2022-01-01 01:01:01"
}

myredis.loadJacpotConfig = async function()
{
    var value = await client.get(JACKPOT_CONFIG);
    if(value !== null)
    {        
        var json = JSON.parse(value);        
        myredis.jackpotConfig.diamond = json.diamond;
        myredis.jackpotConfig.startTime = json.startTime;
        myredis.jackpotConfig.endTime = json.endTime;
    }
    else{
        await client.set(JACKPOT_CONFIG, JSON.stringify(myredis.jackpotConfig));
    }
    return value;
}

myredis.setJacpotConfig = async function()
{
    await client.set(JACKPOT_CONFIG, JSON.stringify(myredis.jackpotConfig));
}

myredis.getJackpotUserTickets = async function()
{
    var maxScore = await client.sendCommand(["zrevrange", JACKPOT_NEAREST, 0, 0, "withscores"]);
    console.log(maxScore);
    if(maxScore.length >= 2)
    {
        var score = maxScore[1];
        console.log(score);
        var tickets = await client.sendCommand(["zrevrangebyscore", JACKPOT_NEAREST, score, score]);
        if(tickets.length > 0)
        {
            var res = [];
            for (var ticket of tickets) {
                var userId = await client.hGet(JACKPOT_USER_TICKET, ticket);
                console.log(userId);
                res.push({"userId":userId, "ticket":ticket});
            }
           var diamondPerUser = myredis.jackpotConfig.diamond / res.length;
           console.log("dm:" + diamondPerUser);
           return res;
        }       
        return [];
    }  
    return [];
}

myredis.startNewSeason = async function(){  
    await client.publish(JACKPOT_START_NEW, start);
    var endTime = new Date(myredis.jackpotConfig.endTime);
    var endTimeStr = endTime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var startTime = new Date(myredis.jackpotConfig.startTime);
    var startTimeStr = startTime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var season = nanoidSS();
    var jackpotTk = nanoid();
    var secret = nanoidNumber();
    await client.set(JACKPOT_SEASON, season);
    await client.set(JACKPOT_TICKET, jackpotTk);
    await client.set(JACKPOT_SECRET, secret);
    await client.del(JACKPOT_NEAREST);
    await client.del(JACKPOT_USER_TICKET);
    var start = `${startTimeStr}|${endTimeStr}|${season}|${jackpotTk}|${secret}`;
    await client.publish(JACKPOT_START_NEW, start);
}
module.exports = myredis;
