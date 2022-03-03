const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const myRedis = require('../myredis.js');
const verifyTokenBlockchain = require('../middlewares/verifyToken.js');

const moneyService = express.Router();
const USERNAME_MONEY_LOCK = "username-money-lock";

moneyService.get('/get/:username', async (req, res, next) => {
    try {
        var dataRes = {}
        var username = mySqlDb.escape(req.params.username);
        var today = new Date();
        var priorDate = new Date(new Date().setDate(today.getDate() - 7));
        var date = util.dateFormat(priorDate, "%Y-%m-%d", false);
        var sql = `set @err = 0;
    set @userId = 0;
    set @diamond = 0;
    call aga.SP_GetMoney(${username}, '{${date}}', @err, @userId, @diamond);
    select @err, @userId, @diamond;
    `;
        mySqlDb.query(sql, function (err, result, fields) {
            logger.info("money_service err:" + err + " result:" + result);
            if (result.length != 0) {
                var diamond = result[result.length - 1][0]['@diamond'];
                var err = result[result.length - 1][0]['@err'];
                dataRes.code = err;
                dataRes.diamond = diamond;
                logger.info("money_service get:" + JSON.stringify(dataRes));
                res.send(dataRes);
            }
            else {
                dataRes.code = 600;
                dataRes.diamond = 0;
                logger.info("money_service get:" + JSON.stringify(dataRes));
                res.send(dataRes);
            }
        });
    } catch (error) {
        next(error);
    }
});
moneyService.withdawCount = 0;
moneyService.post('/withdraw', verifyTokenBlockchain, async (req, res, next) => {
    try {
        moneyService.withdawCount++;
        logger.info("withdaw start:" + moneyService.withdawCount + " time:" + util.dateFormat2());
        var username = mySqlDb.escape(req.body.username);
        var usernameStr = username.replaceAll("'", "");
        var key = `${USERNAME_MONEY_LOCK}:${usernameStr}`;
        var value = await myRedis.get(key);
        if (value != null && value == "true") {
            dataRes.code = 201;
            logger.info("money_service withdraw:" + JSON.stringify(dataRes));
            res.send(dataRes);
            return;
        }
        await myRedis.set(key, true);
        await myRedis.expire(key, 1);
        if (isNaN(req.body.diamond) || req.body.diamond <= 0) {
            dataRes.code = 300;
            logger.info("money_service withdraw:" + JSON.stringify(dataRes));
            res.send(dataRes);
            await myRedis.hSet(key, false);
            return;
        }
        var dataRes = {}
        var today = new Date();
        var priorDate = new Date(new Date().setDate(today.getDate() - 7));
        var date = util.dateFormat(priorDate, "%Y-%m-%d", false);
        var curDate = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
        var sql = `set @err = 0;
    Set @userId = 0;
    call aga.SP_WithDraw(${username}, ${req.body.diamond}, '${date}', '${curDate}', @userId,@err);
    select @userId,@err;
    `;
        mySqlDb.query(sql, async function (err, result, fields) {
            logger.info("money_service withdraw result:" + JSON.stringify(result));
            if (result.length != 0) {
                var err = result[result.length - 1][0]['@err'];
                var userId = result[result.length - 1][0]['@userId'];
                dataRes.code = err;
                logger.info("money_service withdraw:" + JSON.stringify(dataRes));
                res.send(dataRes);
                await myRedis.set(key, false);
                if (err == 200) {
                    var UPDATE_MONEY = "update-money";
                    await myRedis.publish(UPDATE_MONEY, `${userId}`);
                }
                logger.info("withdaw end:" + moneyService.withdawCount + " time:" + util.dateFormat2());
            }
            else {
                dataRes.code = 600;
                logger.info("money_service withdraw:" + JSON.stringify(dataRes));
                res.send(dataRes);
                await myRedis.hSet(key, false);
                logger.info("withdaw end 2:" + moneyService.withdawCount);
            }
        });
    } catch (error) {
        next(error);
    }
});

moneyService.post('/deposit', verifyTokenBlockchain, async (req, res, next) => {
    try {
        var username = mySqlDb.escape(req.body.username);
        var usernameStr = username.replaceAll("'", "");
        if (isNaN(req.body.diamond) || req.body.diamond <= 0) {
            dataRes.code = 300;
            logger.info("money_service deposit:" + JSON.stringify(dataRes));
            res.send(dataRes);
            return;
        }
        var dataRes = {}
        var curDate = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
        var sql = `Set @userId = 0;
    Set @err=0;
    call aga.SP_Deposit(${username}, ${req.body.diamond}, '${curDate}', @userId,@err);
    Select @userId,@err;`;
        mySqlDb.query(sql, async function (err, result, fields) {
            logger.info("money_service deposit result:" + JSON.stringify(result));
            if (result.length != 0) {
                var userId = result[result.length - 1][0]['@userId'];
                var err = result[result.length - 1][0]['@err'];
                dataRes.code = err;
                logger.info("money_service deposit dataRes:" + JSON.stringify(dataRes));
                res.send(dataRes);
                if (err == 200) {
                    var UPDATE_MONEY = "update-money";
                    await myRedis.publish(UPDATE_MONEY, `${userId}`);
                }
            }
            else {
                dataRes.code = 600;
                logger.info("money_service deposit dataRes:" + JSON.stringify(dataRes));
                res.send(dataRes);
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = moneyService;