class PackCard {
    constructor(common, uncommon, rare, epic, legend) {
        this.Common = common;
        this.UnCommon = uncommon;
        this.Rare = rare;
        this.Epic = epic;
        this.Legend = legend;
    }
}


PackCard.Default = function () {
    return new PackCard(70, 20, 5, 4, 1);
}


module.exports = PackCard;