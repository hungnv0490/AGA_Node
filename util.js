util = {}
util.map =
{
    '18': 1,
    '25': 2,
    '11': 3,
    '1': 4,
    '2': 5,
    '3': 6,
    '12': 7,
    '4': 8,
    '19': 9,
    '26': 10,
    '13': 11,
    '14': 12,
    '5': 13,
    '6': 14,
    '20': 15,
    '7': 16,
    '27': 17,
    '29': 18,
    '8': 19,
    '9': 20,
    '15': 21,
    '28': 22,
    '10': 23,
    '21': 24,
    '22': 25,
    '16': 26,
    '17': 27,
    '30': 28,
    '23': 29,
    '24': 30
};

util.dateFormat = function (date, fstr, utc) {
    utc = utc ? 'getUTC' : 'get';
    return fstr.replace(/%[YmdHMS]/g, function (m) {
        switch (m) {
            case '%Y': return date[utc + 'FullYear'](); // no leading zeros required
            case '%m': m = 1 + date[utc + 'Month'](); break;
            case '%d': m = date[utc + 'Date'](); break;
            case '%H': m = date[utc + 'Hours'](); break;
            case '%M': m = date[utc + 'Minutes'](); break;
            case '%S': m = date[utc + 'Seconds'](); break;
            default: return m.slice(1); // unknown code, remove %
        }
        // add leading zero if required
        return ('0' + m).slice(-2);
    });
}

util.dateFormat2 = function () {
    var date = new Date();
    return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
}

util.getCharIdFromNftId = function(nftId){
    return util.map[nftId];
}
module.exports = util;