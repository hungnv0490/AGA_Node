const rankBoardConfig = require('../config/rankboard_config.js');
var log4js = require("log4js");
var logger = log4js.getLogger();
class Ranking {
    constructor(nickname, username, avatar, rank, point, battleAmount, rankingType, isPro) {
      this.Nickname = nickname;
      this.Username = username;
      this.Avatar = avatar;
      this.Rank = rank;
      this.Point = point;
      this.BattleAmount = battleAmount;
      this.RankingType = rankingType;
      this.isPro = isPro;
    }

    GetRankBoard(isPro){
      if(isPro == true){
        var config = rankBoardConfig.pro;
        // var config = _config.reverse();
        for (let index = config.length - 1; index > 0; index--) {
          const element = config[index];
          // logger.info("point:" + this.Point  + " ep:" + element.PointMin + " battle:" + this.BattleAmount + " rank:" + this.Rank + " element 2:" + element.InRank);
          if(this.Point >= element.PointMin && this.BattleAmount >= element.BattleMin && this.Rank > 0 && this.Rank <= element.InRank)
          {
            return element;
          }
        }
        return null;
      }
      else{
        var config = rankBoardConfig.casual;
        for (let index = 0; index < config.length; index++) {
          const element = config[index];
          // logger.info("battle:" + this.BattleAmount + " rank:" + this.Rank + " element:" + element.InRank);
          if(this.BattleAmount >= element.BattleMin && this.Rank > 0 && this.Rank <= element.InRank)
          {
            return element;
          }
        }
        return null;
      }
    }
  }

  module.exports = Ranking;