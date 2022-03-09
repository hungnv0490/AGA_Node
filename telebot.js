
process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.agaWidthdrawBot, { polling: true });

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

bot.on('message', async (msg) => {
    if(msg.text == '/addgroup'){
        const chatId = msg.chat.id;
        var dt = await myRedis.get("withdrawGroupBot");
        if(!dt){
            dt = chatId;
            await myRedis.set("withdrawGroupBot", dt);
        }
        else{
            if(dt.indexOf(chatId) == -1){
                dt += "|" + chatId;
                await myRedis.set("withdrawGroupBot", dt);
            }
        }
        logger.info(dt);
        bot.sendMessage(chatId, msg.text);
    }
  });

  module.exports  = bot;