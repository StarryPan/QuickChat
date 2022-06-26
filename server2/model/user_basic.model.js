const query = require('../common/helper/mysql');

var UserBasic = {

    // 主键
    pk_name: 'id',

    // 表名
    tableName: 'user_basic',

    get: async (val, field = 'id') => {

        let sql = 'SELECT * FROM ' + UserBasic.tableName + ' WHERE ' + field + ' = ?';
        let result = await query(sql, [val]);

        if (result[0] != undefined) {

            return result[0];
        }

        return false;
    },

    reg: async (option) => {

        // 当前时间戳
        let timestamp = parseInt(new Date().getTime() / 1000);
        let sql = 'INSERT INTO ' + UserBasic.tableName + '(id,account,password,reg_time) VALUES(0,?,?,?)';
        let result = await query(sql, [option.account, option.pass, timestamp]);

        return (result.affectedRows > 0);
    },

    update: async (option) => {

        let sql_set   = '';
        let sql_vals  = [];
        let sql_where = '';
        let where_val = 0;

        for (const key in option) {
            const value = option[key];

            if (UserBasic.pk_name == key) {

                sql_where = key + ' = ?';
                where_val = value;

            }else {

                sql_set += key + ' = ?,';
                sql_vals.push(value);
            }
        }

        if (!sql_set) {

            console.log('修改失败，修改值不能为空');
            return false;
        }

        sql_set = sql_set.substring(0, sql_set.length - 1);

        sql_vals.push(where_val);

        var sql = 'UPDATE ' + UserBasic.tableName + ' SET '+sql_set+' WHERE ' + sql_where;
        let result = await query(sql, sql_vals);

        return result.affectedRows;
    },

    loadData: async (uid) => {

        // 设置缓存信息
        let cache_key = global.cache.key('User', [uid]);
        let user_basic = global.cache.get(cache_key);

        if (!user_basic) {

            // 从数据库里取
            user_basic = await UserBasic.get(uid);
            global.cache.set(cache_key, user_basic);
        }

        return user_basic;
    }

};

module.exports = UserBasic;
