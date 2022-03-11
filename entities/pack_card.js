class PackCard {
    constructor(common, uncommon, rare, epic, legend) {
        this.Common = common;
        this.UnCommon = uncommon;
        this.Rare = rare;
        this.Epic = epic;
        this.Legend = legend;
    }

    Format = function(){
        return `${this.Common}-${this.UnCommon}-${this.Rare}-${this.Epic}-${this.Legend}`;
    }
}


PackCard.Default = function () {
    return new PackCard(70, 20, 8, 1.8, 0.2);
}

module.exports = PackCard;