class Mission {
    constructor(name, des, missionType, charId, charLevel, missionCate, countUnlock, rewards, packs) {
        this.name = name;
        this.des = des;
        this.missionType = missionType;
        this.charId = charId;
        this.charLevel = charLevel;
        this.missionCate = missionCate;
        this.countUnlock = countUnlock;
        this.rewards = rewards;
        this.packs = pack;
    }
}
Mission.missionType = {
        None:0,
        UseEnergy:1,
        UseCardTypeInBattle:2,
        CollectDiamond:3,
        JoinBattle:4,
        WinBattle:5,
        KillCardAmountInBattle:6,
        DealDamageInBattle:7,

        CollectAmountCard:8,
        FusionCardLevel:9,
        FusionAmount:10,
        WinRankingBattleContinuous:11,//PVP,
        CollectCardFighter:12,
        CollectCardProtector:13,
        CollectCardCaster:14,
        CollectCardCommon:15,
        CollectCardUnCommon:16,
        CollectCardRare:17,
        CollectCardEpic:18,
        CollectCardLegendary:19
}
module.exports = Mission;