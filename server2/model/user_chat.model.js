const query = require("../common/helper/mysql");

var UserChat = {
    tableName: 'user_chat',

    get: async (val, field = 'id') => {

        let sql = 'SELECT * FROM '+UserChat.tableName+' WHERE '+field+' = ?';
        let result = await query(sql, [val]);

        if (result[0] != undefined) {

            return result[0];
        }

        return false;
    },
    
    select: async (val, field = 'id') => {
    
        let sql = 'SELECT * FROM '+UserChat.tableName+' WHERE '+field+' = ?';
        let result = await query(sql, [val]);
        return result;
    },
    
    update: function (option, callback) {
    
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
    },

    createChat: async (option) => {
        
        // 当前时间戳
        let create_time = parseInt(new Date().getTime() / 1000);
        let sql = 'INSERT INTO '+UserChat.tableName+'(id,uid,chat_uid,create_time) VALUES(0,?,?,?)';
        let result = await query(sql, [option.uid, option.chat_uid, create_time]);

        if (result.affectedRows > 0) {

            // 删除缓存
            let cache_key1 = global.cache.key('UserChatList', [option.uid]);
            let cache_key2 = global.cache.key('UserChatList', [option.chat_uid]);
            global.cache.delete([cache_key1, cache_key2]);

            let uchat = await UserChat.get(result.insertId);
            return uchat;
        }

        return false;
    },

    getChatList: async (uid) => {

        // 设置缓存信息
        let cache_key = global.cache.key('UserChatList', [uid]);
        let chat_list = global.cache.get(cache_key);

        if (!chat_list) {

            let sql_head = 'SELECT * FROM ( ';
            let sql_tail = ') as uchats';
            let sql_1 = 'SELECT * FROM '+UserChat.tableName+' WHERE uid = ? union ';
            let sql_2 = 'SELECT * FROM '+UserChat.tableName+' WHERE chat_uid = ?';
            let sql = sql_head + sql_1 + sql_2 + sql_tail;
            chat_list = await query(sql, [uid, uid]);

            // 数据存入缓存
            global.cache.set(cache_key, chat_list);
        }

        return chat_list;
    },

    getChatInfo: async (uid, chat_uid) => {

        let chat_list = await UserChat.getChatList(uid);

        for (const key in chat_list) {

            let val = chat_list[key];

            // 聊天的玩家ID
            if (chat_uid == UserChat.getChatUid(uid, val)) {

                return val;
            }
        }

        return false;
    },

    getChatUid: (uid, val) => {

        return (uid == val.uid) ? val.chat_uid : val.uid;
    },

    getChatIds:  async (uid) => {

        let chat_ids  = [];
        let chat_list = await UserChat.getChatList(uid);

        chat_list.forEach(val => {
            
            let chat_uid = UserChat.getChatUid(uid, val);
            chat_ids.push(chat_uid);
        });
        
        return chat_ids;
    },

    getChatState: async (uid, chat_uid) => {
        
        let chat_ids = await UserChat.getChatIds(uid);
        return (chat_ids.indexOf(chat_uid) != 0);
    },
};



module.exports = UserChat;
