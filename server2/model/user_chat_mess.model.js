const query = require("../common/helper/mysql");

var UserChatMess = {
    // 主键
    pk_name: 'id',

    // 表名
    tableName: 'user_chat_mess',

    get: async (val, field = 'id') => {

        let sql = 'SELECT * FROM '+UserChatMess.tableName+' WHERE '+field+' = ?';
        let result = await query(sql, [val]);

        if (result[0] != undefined) {

            return result[0];
        }

        return false;
    },
    
    select: async (val, field = 'id', limit = -1, order = '') => {
    
        let sql = 'SELECT * FROM '+UserChatMess.tableName+' WHERE '+field+' = ?';

        if (order != null) {

            sql += ' ORDER BY ' + order;
        }

        if (limit > 0) {

            sql += ' LIMIT ' + limit;
        }

        let result = await query(sql, [val]);
        return result;
    },
    
    update: async (option) => {

        var sql    = 'UPDATE ' + UserChatMess.tableName + ' SET state = 1 WHERE uid = ? AND chat_id = ?';
        let result = await query(sql, [option.uid, option.chat_id]);

        return result.affectedRows;
    },

    addMessage: async (option) => {

        option.msg_type = option.msg_type || 1;// 文字

        // 当前时间戳
        let create_time = parseInt(new Date().getTime() / 1000);
        let sql = 'INSERT INTO '+UserChatMess.tableName+'(id,uid,chat_id,msg_type,content,create_time) VALUES(0,?,?,?,?,?)';
        let result = await query(sql, [option.uid, option.chat_id, option.msg_type, option.content, create_time]);

        if (!result.insertId) {
            
            return false;
        }

        return await UserChatMess.get(result.insertId);
    },

    getUnreadMessCount: async (uid, chat_id) => {
        let sql = 'SELECT COUNT(*) AS count FROM '+UserChatMess.tableName+' WHERE uid = ? AND chat_id = ? AND state = 0';
        let result = await query(sql, [uid, chat_id]);

        if (result[0] == undefined) {

            return 0;
        }

        return result[0]['count'];
    },
};



module.exports = UserChatMess;
