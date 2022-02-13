class PackCard {
    constructor(common, uncommon, rare, epic, legend) {
      this.common = common;
      this.uncommon = uncommon;
      this.rare = rare;
      this.epic = epic;
      this.legend = legend;
    }
  }

  class Pack{
    constructor(packCards, amountPack) {
        this.packCards = packCards;
        this.amountPack = amountPack;
      }
  }