const myRedis = require('./myredis.js')
const mySqlDB = require('./mysqldb.js')
const cron = require('node-cron');

const jacpot = {}
const JackpotRewardTitle = "Jackpot reward";
const JackpotRewardContent = "You received reward from jackpot season %s";

jacpot.task = null;
if (jacpot.task == null) console.log("wwwwwwwwwww");
jacpot.init = function () {
    var endTime = new Date(myRedis.jackpotConfig.endTime);
    var curDate = new Date();
    console.log("jackpot init end time:" + endTime + " curDate:" + curDate);
    if (endTime > curDate) {
        console.log(endTime.getDate() + " " + (curDate.getMonth() + 1));
        var job = `${endTime.getSeconds()} ${endTime.getMinutes()} ${endTime.getHours()} ${endTime.getDate()} ${endTime.getMonth() + 1} *`;
        console.log("jackpot schedule:" + job);
        jacpot.task = cron.schedule(job, async () => {
            await jacpot.rewards();
        });
    }
}

jacpot.startNewSeason = async function () {
    var endTime = new Date(myRedis.jackpotConfig.endTime);
    var curDate = new Date();
    if (endTime > curDate) {
        if (jacpot.task != null) {
            jacpot.task.stop();
            jacpot.task = null;
        }
        await myRedis.startNewSeason();
        jacpot.init();
    }
}

jacpot.rewards = async function () {
    console.log("jackpot rewards");
    var userTickets = await myRedis.getJackpotUserTickets();
    if (userTickets.length > 0) {
        var diamond = myRedis.jackpotConfig.diamond / userTickets.length;
        var content = JackpotRewardContent;
        var rewards = `1-0-${diamond}`;
        userTickets.forEach(element => {
            mySqlDB.addMailBox(JackpotRewardTitle, content, -1, element["userId"], rewards, 0, 0);
        });
        jacpot.task.stop();
        jacpot.task = null;
    }
    else {
        jacpot.task.stop();
        jacpot.task = null;
    }
}

module.exports = jacpot;
