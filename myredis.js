const nanoId = require("nanoid")
const nanoTk = nanoId.customAlphabet("ABCDEFGHIJKLMNOPQRSTUVXYZ123456789", 9);
const nanoidNumber = nanoId.customAlphabet("123456789", 10);
const nanoidSS = nanoId.customAlphabet("ABCDEFGHIJKLMNOPQRSTUVXYZ123456789", 5);
const redis = require('redis');
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

var myredis = {}
myredis.jackpotConfig ={
    "diamond":1000000,
    "startTime":"2022-01-01 01:01:01",
    "endTime":"2022-01-01 01:01:01"
}
myredis.test = "haha";

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

myredis.setJackpotConfig = async function()
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
    await client.publish(JACKPOT_PAUSE);
    var endTime = new Date(myredis.jackpotConfig.endTime);
    var endTimeStr = endTime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var startTime = new Date(myredis.jackpotConfig.startTime);
    var startTimeStr = startTime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var season = nanoidSS();
    var jackpotTk = nanoTk();
    var secret = nanoidNumber();
    await client.SET(JACKPOT_SEASON, season);
    await client.SET(JACKPOT_TICKET, jackpotTk);
    await client.SET(JACKPOT_SECRET, secret);
    await client.SET(JACKPOT_START_TIME, startTimeStr);
    await client.SET(JACKPOT_END_TIME, endTimeStr);

    await client.DEL(JACKPOT_NEAREST);
    await client.DEL(JACKPOT_USER_TICKET);
    var start = `${startTimeStr}|${endTimeStr}|${season}|${jackpotTk}|${secret}`;
    await client.publish(JACKPOT_START_NEW, start);
}

myredis.endSeason = async function(diamond){  
    await client.publish(JACKPOT_PAUSE);
    var season = await client.get(JACKPOT_SEASON);
    var tk = await client.get(JACKPOT_TICKET);
    await client.SET(JACKPOT_PREV_SEASON, season);
    await client.SET(JACKPOT_PREV_TICKET, tk);
    await client.SET(JACKPOT_PREV_DIAMOND, diamond);

    await client.DEL(JACKPOT_SEASON);
    await client.DEL(JACKPOT_TICKET);
    await client.DEL(JACKPOT_SECRET);
    await client.DEL(JACKPOT_START_TIME);
    await client.DEL(JACKPOT_END_TIME);    
    await client.DEL(JACKPOT_NEAREST);
    await client.DEL(JACKPOT_USER_TICKET);
}

module.exports = myredis;
