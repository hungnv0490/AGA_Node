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
  }

  module.exports = Ranking;