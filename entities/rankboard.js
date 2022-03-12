class RankBoard {
    constructor(rankingType, pointMin, pointMax, battleMin, perDiamond, inRank) {
      this.RankingType = rankingType;
      this.PointMin = pointMin;
      this.PointMax = pointMax;
      this.BattleMin = battleMin;
      this.PerDiamond = perDiamond;
      this.InRank = inRank
    }
    Init(add, adr){
      this.ADD = Math.ceil(add * this.PerDiamond / 100); 
      this.ADR = Math.ceil(adr * this.PerDiamond / 100); 
    }
  }
  // "RankingType": 1,
        // "PointMin": 1100,
        // "PointMax": 1999,
        // "BattleMin": 50,
        // "PerDiamond": 10,
        // "InRank": 4000,
        // "ADD": 2000,
        // "ADR": 1000
  RankBoard.fromJson=function(json){
    return new RankBoard(json.RankingType, json.PointMin, json.PointMax, json.BattleMin, json.PerDiamond, json.InRank);
  }

  RankBoard.proRanks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  RankBoard.casualRanks = [12, 13, 14, 15, 16, 17, 18, 19, 20];

  RankBoard.RankingType =
  {
      None:0,
      Bronze:1,
      Silver:2,
      Gold:3,
      Challenger:4,
      Master:5,
      GrandMaster:6,
      Champion:7,
      Champion4:8,//top 4-10
      Champion3:9,//top 3
      Champion2:10,//top 2
      Champion1:11,// top 1,
      
      Top1:12,
      Top2:13,
      Top3:14,
      Top4:15,//4-10
      Top11:16,
      Top101:17,
      Top201:18,
      Top301:19,
      Top401:20
  }

  module.exports = RankBoard