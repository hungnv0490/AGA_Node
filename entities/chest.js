class Chest{
    constructor(packCards) {
        this.packCards = packCards;
      }

      Format = function () {
        var ids = "";
        var i = 0;
        for (var result of this.packCards) {
          if (i < this.packCards.length - 1)
            ids += result.Format() + "|";
          else ids += result.Format();
          i++;
        }
        return ids;
      }
  }

  module.exports = Chest;