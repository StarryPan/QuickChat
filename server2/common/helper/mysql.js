// var db     = {};
// var mysql  = require('mysql');
// var config = require('../config/mysql');
// var pool   = mysql.createPool({
//   connectionLimit : 10,
//   host            : config.host,
//   user            : config.user,
//   password        : config.password,
//   database        : config.database,
// });

// db.query = function(sql, callback){

// 	if (!sql) {
// 		callback();
// 		return;
// 	}
// 	pool.query(sql, function(err, rows, fields) {
// 	  if (err) {
// 	    console.log(err);
// 	    callback(err, null);
// 	    return;
// 	  };

// 	  callback(null, rows, fields);
// 	});
// }
// module.exports = db;
const mysql = require('mysql')
var config = require('../config/mysql');
var pool = mysql.createPool({
	connectionLimit: 10,
	host: config.host,
	user: config.user,
	port: config.port,
	password: config.password,
	database: config.database,
});

// 接收一个sql语句 以及所需的values
// 这里接收第二参数values的原因是可以使用mysql的占位符 '?'
// 比如 query(`select * from my_database where id = ?`, [1])

let query = async function (sql, values) {

	// 返回一个 Promise
	return new Promise((resolve, reject) => {
		pool.getConnection(function (err, connection) {
			if (err) {
				reject(err)
			} else {
				connection.query(sql, values, (err, rows) => {

					if (err) {
						reject(err)
					} else {
						resolve(rows)
					}
					// 结束会话
					connection.release()
				})
			}
		})
	})
}

module.exports = query;