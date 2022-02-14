var Chest = require('../entities/chest.js');
const myRedis = require('../myredis')
var PackCard = require('../entities/pack_card.js');
var log4js = require("log4js");
var logger = log4js.getLogger();

const CHEST_CONFIG = "chest-config";
const CHEST_CONFIG_NEW_DATA = "chest-config-new-data";

chestConfig = {}
chestConfig.DailyLoginMaxChestPoint = 10;
chestConfig.DailyMissionMaxChestPoint = 10;
chestConfig.AchievementMaxChestPoint = 10;

chestConfig.chests =
[
    new Chest([PackCard.Default(), PackCard.Default(), PackCard.Default()]),
    new Chest([PackCard.Default(), PackCard.Default(), PackCard.Default()]),
    new Chest([PackCard.Default(), PackCard.Default(), PackCard.Default()]),
    new Chest([PackCard.Default(), PackCard.Default(), PackCard.Default()]),
];

chestConfig.init = async function()
{
    var value = await myRedis.get(CHEST_CONFIG);
    logger.info("chest_redis init:" + value);
    if (value !== null) {
        var json = JSON.parse(value);
        chestConfig.DailyLoginMaxChestPoint = json.DailyLoginMaxChestPoint;
        chestConfig.DailyMissionMaxChestPoint = json.DailyMissionMaxChestPoint;
        chestConfig.AchievementMaxChestPoint = json.AchievementMaxChestPoint;
        chestConfig.chests = json.chests;
    }
    else {
        await myRedis.set(CHEST_CONFIG, JSON.stringify(chestConfig));
    }
}

chestConfig.toJson = function(){
    return JSON.stringify(chestConfig);
}

chestConfig.setConfig = async function(){
    await myRedis.set(CHEST_CONFIG, JSON.stringify(chestConfig));
    await myRedis.publish(CHEST_CONFIG_NEW_DATA);
}
module.exports = chestConfig;