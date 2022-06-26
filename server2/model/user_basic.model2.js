var UserBasic = function () {
    var mysql = require('mysql');
    var config = require('../common/config/mysql');
    this.DB = mysql.createPool({
        connectionLimit: 10,
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
    });

    this.tableName = 'user_basic';
};

UserBasic.prototype.get = function (option, callback) {

    let self = this;
    let sql_str = '';

    if (option.id) {

        sql_str = "SELECT * FROM " + this.tableName + " WHERE id = " + option.id;
    }else {

        sql_str = "SELECT * FROM " + this.tableName + " WHERE account = '" + option.account + "'";
    }

    this.DB.query(sql_str, function (err, rows) {
        if (err) {
            console.log(err);
            return;
        }

        if (rows[0] != undefined) {

            return callback(rows[0]);

        } else {

            // 新增玩家
            self.reg(option, function (err, result) {

                if (err) {
                    console.log(err);
                    return;
                }

                return self.get(option, callback);
            });
        }

    });

    return false;
}

UserBasic.prototype.reg = function (option, callback) {

    var timestamp = parseInt(new Date().getTime()/1000);    // 当前时间戳
    var sql_str = 'INSERT INTO ' + this.tableName + '(id,account,password,reg_time) VALUES(0,?,?,?)';

    this.DB.query(sql_str, [option.account, option.pass, timestamp], function (err, result) {
        if (err) {
            console.log(err);
            return;
        }

        return callback(err, result);
    });

    return false;
}

UserBasic.prototype.update = function (option, callback) {

    option.remark = option.remark || '';
    var sql_str = 'UPDATE ' + this.tableName + ' SET name = ?,head = ?,sex = ?,remark = ? WHERE id = ?';
    let self = this;

    this.DB.query(sql_str, [option.name, option.head, option.sex, option.remark, option.id], function (err, result) {
        if (err) {
            console.log(err);
            return;
        }

        if (result.affectedRows == 0) {

            return callback(false);
        }

        return self.get(option, callback);
    });

    return false;
}

UserBasic.prototype.loadData = function (uid) {

    // 设置缓存信息
    let cache_key  = global.cache.key('User', [uid]);
    let user_basic = global.cache.get(cache_key);

    if (!user_basic) {

        

    }

    return user_basic;
}

module.exports = UserBasic;
