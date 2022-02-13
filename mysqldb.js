var mysql      = require('mysql2');
var connection = mysql.createConnection({
  host     : '159.223.62.35',
  user     : 'admin',
  password : '88qL8f_Tams!G_RX',
  database : 'aga'
});
 
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  console.log('connected as id ' + connection.threadId);
});

const mySqlDB = {}
mySqlDB.test = function(){
  connection.query('SELECT * From users Limit 1', function (error, results, fields) {
    console.log('The solution is: ', results[0]);
  });
}

mySqlDB.addMailBox = function(title, content, sender, receiver, rewards, isRead, isReceive)
{
  var createTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log("createTime:" + createTime);
  var sql = 'INSERT INTO `aga`.`mail_box`(`title`,`content`,`sender`,`receiver`,`rewards`,`is_read`,`is_receive`,`create_time`,`update_time`)'+
            'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
  connection.execute(sql, [title, content, sender, receiver, rewards, isRead, isReceive, createTime, createTime], function(err, result, fields){
    console.log(err);
  });  
}
module.exports = mySqlDB;

