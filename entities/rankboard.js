class RankBoard {
    constructor(rankingType, pointMin, pointMax, battleMin, perDiamond, inRank, rewardPerson) {
      this.RankingType = rankingType;
      this.PointMin = pointMin;
      this.PointMax = pointMax;
      this.BattleMin = battleMin;
      this.PerDiamond = perDiamond;
      this.InRank = inRank;
      this.RewardPerson = rewardPerson;
      this.RankingTypeDesc =  RankBoard.RankingTypeDesc[rankingType];
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
    return new RankBoard(json.RankingType, json.PointMin, json.PointMax, json.BattleMin, json.PerDiamond, json.InRank, json.RewardPerson);
  }

  RankBoard.proRanks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  RankBoard.casualRanks = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  RankBoard.RankingType =
  {
      None:0,
      Bronze:1,//2001-3000
      Silver:2, //1301-2000
      Gold:3, //801-1300
      Challenger:4, //Diamond: 401-800
      Master:5, //201-400
      GrandMaster:6, // Champion: 101-200
      Champion:7,//Legend 11-100
      Champion4:8,//top 4-10
      Champion3:9,//top 3
      Champion2:10,//top 2
      Champion1:11,// top 1,
      
      Top1:12,
      Top2:13,
      Top3:14,
      Top4:15,//4-10
      Top11:16,//Legendar:11-100
      Top101:17,//Champion:101-200
      Top201:18,//Master:201-350
      Top301:19,//Diamond:351-650
      Top401:20,//Gold: 651-950
      CSilver:21,//951-1350
      CBronze:22//1351-2000
  }

  RankBoard.RankingTypeDesc =
  {
      '0':'None',
      '1':'Bronze',//2001-3000
      '2':'Silver', //1301-2000
      '3':'Gold', //801-1300
      '4':'Diamond', //Diamond: 401-800
      '5':'Master', //201-400
      '6':'Champion', // Champion: 101-200
      '7':'Legendary',//Legend 11-100
      '8':'Top4-10',//top 4-10
      '9':'Top3',//top 3
      '10':'Top2',//top 2
      '11':'Top1',// top 1,
      
      '12':'Top1',
      '13':'Top2',
      '14':'Top3',
      '15':'Top4-10',//4-10
      '16':'Legendary',//Legendar:11-100
      '17':'Champion',//Champion:101-200
      '18':'Master',//Master:201-350
      '19':'Diamond',//Diamond:351-650
      '20':'Gold',//Gold: 651-950
      '21':'Silver',//951-1350
      '22':'Bronze'//1351-2000
  }

  module.exports = RankBoard