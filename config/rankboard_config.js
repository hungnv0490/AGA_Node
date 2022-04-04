var RankBoard = require('../entities/rankboard.js');
var log4js = require("log4js");
var logger = log4js.getLogger();
rankboard_config = {}
rankboard_config.proDiamond = 100000000;
rankboard_config.casualDiamond = 15000000;
rankboard_config.ADRPro = 10000;
rankboard_config.ADRCasual = 30000;

rankboard_config.pro = [
    new RankBoard(RankBoard.RankingType.Bronze, 1100, 1999, 50, 20, 3000, 20000),
    new RankBoard(RankBoard.RankingType.Silver, 2000, 2999, 50, 20, 2000, 28571),
    new RankBoard(RankBoard.RankingType.Gold, 3000, 3999, 50, 16, 1300, 32000),
    new RankBoard(RankBoard.RankingType.Challenger, 4000, 4999, 50, 16.5, 800, 41250),
    new RankBoard(RankBoard.RankingType.Master, 5000, 5999, 50, 9.5, 400, 47500),
    new RankBoard(RankBoard.RankingType.GrandMaster, 6000, 6999, 50, 7.9, 200, 79000),
    new RankBoard(RankBoard.RankingType.Champion, 7000, 10000000, 50, 8.1, 100, 90000),
    new RankBoard(RankBoard.RankingType.Champion4, 7000, 10000000, 50, 0.7, 10, 100000),
    new RankBoard(RankBoard.RankingType.Champion3, 7000, 10000000, 50, 0.3, 3, 300000),
    new RankBoard(RankBoard.RankingType.Champion2, 7000, 10000000, 50, 0.4, 2, 400000),
    new RankBoard(RankBoard.RankingType.Champion1, 7000, 10000000, 50, 0.6, 1, 600000),
]

rankboard_config.casual = [
    new RankBoard(RankBoard.RankingType.Top1, 0, 1000, 50, 0.6, 1, 90000),
    new RankBoard(RankBoard.RankingType.Top2, 0, 1000, 50, 0.4, 2, 60000),
    new RankBoard(RankBoard.RankingType.Top3, 0, 1000, 50, 0.3, 3, 45000),
    new RankBoard(RankBoard.RankingType.Top4, 0, 1000, 50, 0.7, 10, 15000),
    new RankBoard(RankBoard.RankingType.Top11, 0, 1000, 50, 8.1, 100, 13500),
    new RankBoard(RankBoard.RankingType.Top101, 0, 1000, 50, 7.9, 200, 11850),
    new RankBoard(RankBoard.RankingType.Top201, 0, 1000, 50, 9.5, 350, 9500),
    new RankBoard(RankBoard.RankingType.Top301, 0, 1000, 50, 16.5, 650, 8250),
    new RankBoard(RankBoard.RankingType.Top401, 0, 1000, 50, 16, 950, 8000),
    new RankBoard(RankBoard.RankingType.CSilver, 0, 1000, 50, 20, 1350, 7500),
    new RankBoard(RankBoard.RankingType.CBronze, 0, 1000, 50, 20, 2000, 4615),
]

rankboard_config.toJson = function () {
    for (var item of rankboard_config.casual) {
        item.Init(rankboard_config.casualDiamond, rankboard_config.ADRCasual);
    }
    for (var item of rankboard_config.pro) {
        item.Init(rankboard_config.proDiamond, rankboard_config.ADRPro);
    }
    return JSON.stringify(rankboard_config);
}

module.exports = rankboard_config;