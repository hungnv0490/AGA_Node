const express = require('express');
var log4js = require("log4js");
var logger = log4js.getLogger();
const mySqlDb = require('../mysqldb.js');
const myRedis = require('../myredis.js');
const verifyTokenBlockchain = require('../middlewares/verifyToken.js');
const teleBot = require('../telebot.js');
const axios = require('axios');

const moneyService = express.Router();
const USERNAME_MONEY_LOCK = "username-money-lock";

moneyService.get('/get/:username', async (req, res, next) => {
    try {
        var dataRes = {}
        dataRes.maxTimes = 5;
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
            logger.info("money_service err:" + err + " result:" + JSON.stringify(result));
            if (result.length != 0) {
                var diamond = result[result.length - 1][0]['@diamond'];
                var err = result[result.length - 1][0]['@err'];
                var userId = result[result.length - 1][0]['@userId'];
                dataRes.code = err;
                dataRes.diamond = diamond;

                sql = `Select *, now() nw from users where user_id = ${userId}`;
                var nextSecond = 0;
                var times = 0;
                mySqlDb.query(sql, (err, result, fields) => {
                    // logger.info(result);
                    logger.info(JSON.stringify(result));
                    if (!err && result.length > 0) {
                        var dt = result[0];
                        times = dt.withdraw_times;
                        var lastDate = new Date(dt.withdraw_last_date);
                        logger.info(lastDate);
                        if (lastDate.getDate() == new Date().getDate()
                            && lastDate.getMonth() == new Date().getMonth()
                            && lastDate.getFullYear() == new Date().getFullYear()) {
                            if (times < 5) {
                                var nextDate = new Date(lastDate.getTime() + 30 * 60 * 1000);
                                var ms = nextDate.getTime() - new Date().getTime();
                                if (ms <= 0) nextSecond = 0;
                                else nextSecond = Math.round(ms / 1000);
                            }
                            else {
                                var curTime = new Date().getTime();
                                var nextDate = new Date(curTime + 24 * 60 * 60 * 1000);
                                var startNextDate = util.dateFormat(nextDate, "%Y-%m-%d", false);
                                startNextDate += " 00:00:00";
                                logger.info("startNextDate:" + startNextDate);
                                var ms = new Date(startNextDate).getTime() - curTime;
                                nextSecond = Math.round(ms / 1000);
                            }
                        }
                        else {
                            times = 0;
                            nextSecond = 0;
                            // var curTime = new Date().getTime();
                            // var nextDate = new Date(curTime + 24 * 60 * 60 * 1000);
                            // var startNextDate = util.dateFormat(nextDate, "%Y-%m-%d", false);
                            // startNextDate += " 00:00:00";
                            // logger.info("startNextDate:" + startNextDate);
                            // var ms = new Date(startNextDate).getTime() - curTime;
                            // nextSecond = Math.round(ms / 1000);
                        }
                    }
                    dataRes.times = times;
                    dataRes.nextSecond = nextSecond;
                    res.send(dataRes);
                    logger.info("money_service get:" + JSON.stringify(dataRes));
                });
            }
            else {
                dataRes.code = 600;
                dataRes.diamond = 0;
                dataRes.times = 0;
                dataRes.nextSecond = 0;
                res.send(dataRes);
                logger.info("money_service get:" + JSON.stringify(dataRes));
            }
        });
    } catch (error) {
        next(error);
    }
});

moneyService.post('/check-withdraw', verifyTokenBlockchain, async (req, res, next) => {
    try {
        logger.info("money_service check-withdraw start:" + req.body);
        var username = mySqlDb.escape(req.body.username);
        var usernameStr = username.replaceAll("'", "");
        var key = `${USERNAME_MONEY_LOCK}:${usernameStr}`;
        var value = await myRedis.get(key);
        if (value != null && value == "true") {
            dataRes.code = 201;
            res.send(dataRes);
            logger.info("money_service check-withdraw:" + JSON.stringify(dataRes));
            return;
        }
        await myRedis.set(key, true);
        await myRedis.expire(key, 1);
        if (isNaN(req.body.diamond) || req.body.diamond <= 0) {
            dataRes.code = 300;
            res.send(dataRes);
            await myRedis.hSet(key, false);
            logger.info("money_service check-withdraw:" + JSON.stringify(dataRes));
            return;
        }
        var dataRes = {}
        var today = new Date();
        var priorDate = new Date(new Date().setDate(today.getDate() - 7));
        var date = util.dateFormat(priorDate, "%Y-%m-%d", false);
        var curDate = util.dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
        var sql = `set @err = 0;
    Set @userId = 0;
    call aga.SP_CheckWithDraw(${username}, ${req.body.diamond}, '${date}', '${curDate}', @userId,@err);
    select @userId,@err;
    `;
        mySqlDb.query(sql, async function (err, result, fields) {
            logger.info("money_service withdraw result:" + JSON.stringify(result));
            if (result.length != 0) {
                var err = result[result.length - 1][0]['@err'];
                var userId = result[result.length - 1][0]['@userId'];
                dataRes.code = err;
                // logger.info("money_service check-withdaw withdraw:" + JSON.stringify(dataRes));
                res.send(dataRes);
                await myRedis.set(key, false);

                // var withdrawGroupBot = await myRedis.get("withdrawGroupBot");
                // if(withdrawGroupBot){
                //     var groups = withdrawGroupBot.split("|");
                //     for(var group of groups){
                //         teleBot.sendMessage(group, `${usernameStr} widthraw ${req.body.diamond} diamond`);
                //     }
                // }

                // if (err == 200) {
                //     var UPDATE_MONEY = "update-money";
                //     await myRedis.publish(UPDATE_MONEY, `${userId}`);
                // }
                logger.info("money_service check-withdaw end time:" + util.dateFormat2());
            }
            else {
                dataRes.code = 600;
                res.send(dataRes);
                await myRedis.hSet(key, false);
                logger.info("money_service check-withdraw:" + JSON.stringify(dataRes));
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
        logger.info("money_service withdaw start:" + moneyService.withdawCount + " time:" + util.dateFormat2());
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
        mySqlDb.claimRequestHis(req.body.username, req.body.diamond, 1);

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
                res.send(dataRes);
                logger.info("money_service withdraw:" + JSON.stringify(dataRes));

                await myRedis.set(key, false);

                var withdrawGroupBot = await myRedis.get("withdrawGroupBot");
                if (withdrawGroupBot) {
                    var groups = withdrawGroupBot.split("|");
                    var url = `https://api.telegram.org/bot${process.env.agaWidthdrawBot}/sendMessage`;
                    var content = `${usernameStr} widthraw ${req.body.diamond} diamond`;
                    for (var group of groups) {
                        logger.info("group:" + group);                      
                        if (group) {
                            axios.post(url, {
                                chat_id: group,
                                text: content
                              })
                              .then(function (response) {
                                // logger.error(response);
                              })
                              .catch(function (error) {
                                  if(error.response){
                                    logger.error(error.response.data);
                                  }
                              });
                        }
                    }
                }

                if (err == 200) {
                    var UPDATE_MONEY = "update-money";
                    await myRedis.publish(UPDATE_MONEY, `${userId}`);
                }
                logger.info("money_service withdaw end:" + moneyService.withdawCount + " time:" + util.dateFormat2());
            }
            else {
                dataRes.code = 600;
                res.send(dataRes);
                await myRedis.hSet(key, false);
                logger.info("money_service withdraw:" + JSON.stringify(dataRes));
                logger.info("money_service withdaw end 2:" + moneyService.withdawCount);
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

moneyService.post('/add-energy', verifyTokenBlockchain, async (req, res, next) => {
    try {
        var username = mySqlDb.escape(req.body.username);
        var usernameStr = username.replaceAll("'", "");
        if (isNaN(req.body.energy) || req.body.energy <= 0) {
            dataRes.code = 300;
            logger.info("money_service add-energy:" + JSON.stringify(dataRes));
            res.send(dataRes);
            return;
        }
        await myRedis.hIncrBy("add-energy", usernameStr, req.body.energy);
        await myRedis.publish("ADD-ENERGY", `${usernameStr}|${req.body.energy}`);
        res.send({ code: 200 });
    } catch (error) {
        next(error);
    }
});

module.exports = moneyService;