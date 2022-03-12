var RankBoard = require('../entities/rankboard.js');

rankboard_config = {}
rankboard_config.proDiamond = 40000;
rankboard_config.casualDiamond = 10000;
rankboard_config.ADRPro = 40000;
rankboard_config.ADRCasual = 10000;

rankboard_config.pro=[
    new RankBoard(RankBoard.RankingType.Bronze, 1100, 1999, 50, 10, 4000 ),
    new RankBoard(RankBoard.RankingType.Silver, 2000, 2999, 50, 10, 1000 ),
    new RankBoard(RankBoard.RankingType.Gold, 3000, 3999, 50, 10, 400 ),
    new RankBoard(RankBoard.RankingType.Challenger, 4000, 4999, 50, 10, 400 ),
    new RankBoard(RankBoard.RankingType.Master, 5000, 5999, 50, 10, 200 ),
    new RankBoard(RankBoard.RankingType.GrandMaster, 6000, 6999, 50, 9, 200 ),
    new RankBoard(RankBoard.RankingType.Champion, 7000, 10000000, 50, 9, 100 ),
    new RankBoard(RankBoard.RankingType.Champion4, 7000, 10000000, 50, 9, 10 ),
    new RankBoard(RankBoard.RankingType.Champion3, 7000, 10000000, 50, 5, 3 ),
    new RankBoard(RankBoard.RankingType.Champion2, 7000, 10000000, 50, 8, 2 ),
    new RankBoard(RankBoard.RankingType.Champion1, 7000, 10000000, 50, 10, 1 ),
]

rankboard_config.casual=[
    new RankBoard(RankBoard.RankingType.Top1, 0, 1000, 50, 5, 1 ),
    new RankBoard(RankBoard.RankingType.Top2, 0, 1000, 50, 3, 2 ),
    new RankBoard(RankBoard.RankingType.Top3, 0, 1000, 50, 2, 3 ),
    new RankBoard(RankBoard.RankingType.Top4, 0, 1000, 50, 10, 10 ),
    new RankBoard(RankBoard.RankingType.Top11, 0, 1000, 50, 30, 100 ),
    new RankBoard(RankBoard.RankingType.Top101, 0, 1000, 50, 5, 200 ),
    new RankBoard(RankBoard.RankingType.Top201, 0, 1000, 50, 10, 300 ),
    new RankBoard(RankBoard.RankingType.Top301, 0, 1000, 50, 15, 400 ),
    new RankBoard(RankBoard.RankingType.Top401, 0, 1000, 50, 20, 500),
]

rankboard_config.toJson = function()
{
   return JSON.stringify(rankboard_config);
}

module.exports = rankboard_config;