var room = require('./room');
var common = require('./common');
const UserChat = require('../model/user_chat.model');
const UserBasic = require('../model/user_basic.model');
const UserChatMess = require('../model/user_chat_mess.model');

global = {
    room_id: 0,
    msg_data: [],
    room_list: {},
    user_list: {},
    user: {
        data: function (pms) {

            this.id = pms.id;
            this.vip = pms.vip || 0;
            this.name = pms.name || '';
            this.head = pms.head || 'default.jpg';
            this.online = true;
            this.create_time = (new Date()).getTime();
        },
        get: async (uid) => {

            let ukey = String(uid);
            if (!global.user_list[ukey]) {

                return false;
            }

            return global.user_list[ukey];
        },
        add: function (uid, conn) {

            let ukey = String(uid);

            if (global.user_list[ukey] != null) {

                global.user_list[ukey].close();
            }

            conn.uid = uid;
            global.user_list[ukey] = conn;

            return true;
        },
        unset: function (uid, ws) {

            let ukey = String(uid);

            if (global.user_list[ukey] == ws) {

                delete global.user_list[ukey];
                return true;
            }

            return false;
        },
        update: function (pms, ws) {

            let uid = ws.uid;
            let data = global.user.getData(uid);

            if (!data) {

                return false;
            }

            data.name = pms.name || '';
            data.head = pms.head || '';
            data.remark = pms.remark || '';

            // 存入缓存
            let cache_key = global.cache.key('User', [uid]);
            global.cache.set(cache_key, data);

            return data;
        },
        getData: async (uid) => {

            let data = global.user.get(uid);

            return data ? data.user_data : false;
        },
        isExist: async (uid) => {

            let ukey = String(uid);
            return (global.user_list[ukey] != null);
        },
        getUserList: async (uid) => {

            let chat_uids = [];
            let chat_list = await global.user.getChatList(uid);

            // 遍历出，玩家iD
            for (const key in chat_list) {
                const val = chat_list[key];
                chat_uids.push(val.id);
            }

            let client_rs = {
                'chat_list': chat_list,
                'world_list': await global.user.getWorldList(uid, chat_uids),
            };

            return client_rs;
        },
        getOnline: (uid) => {
            let ukey = String(uid);
            return (global.user_list[ukey] != null);
        },
        getChatList: async (uid) => {

            let arr = [];
            let chat_list = await UserChat.getChatList(uid);

            for (const key in chat_list) {

                let val = chat_list[key];

                // 判断聊天ID
                let chat_uid = (val.uid == uid) ? val.chat_uid : val.uid;

                // 设置缓存信息
                let user_basic = await UserBasic.loadData(chat_uid);
                user_basic.online = global.user.getOnline(user_basic.id);
                user_basic.chat_id = val.id;
                user_basic.dot = await UserChatMess.getUnreadMessCount(chat_uid, val.id);

                arr.push(user_basic);
            }

            return arr;
        },
        getWorldList: async (uid, notArr = []) => {

            let arr = [];
            let user_list = global.user_list;

            for (const key in user_list) {

                let val = user_list[key];

                if (val.uid != uid && notArr.indexOf(val.uid) == -1) {

                    // 设置缓存信息
                    let cache_key = global.cache.key('User', [val.uid]);
                    let cache_data = global.cache.get(cache_key);
                    cache_data.chat_id = 0;
                    cache_data.online = true;
                    arr.push(cache_data);
                }

            }

            return arr;
        },
    },
    room: {
        get: function (room_id) {

            let room_key = String(room_id);

            if (global.room_list[room_key] == undefined) {

                return false;
            }

            return global.room_list[room_key];
        },
        incId: function () {

            global.room_id = (global.room_id + 10000);
            return global.room_id;
        },
        pullRoom: async (uid) => {

            var mapArr = function (map) {

                var list = [];

                for (var key in map) {

                    list.push(map[key]);
                }

                return list;
            };

            if (uid) {

                global.send.toUser(uid, common.jsonStr('pullRoom', mapArr(global.room_list)));
            } else {

                global.send.toAll(common.jsonStr('pullRoom', mapArr(global.room_list)));
            }
        },
        createRoom: function (pms, conn) {

            // 自增房间ID
            pms.id = global.room.incId();

            // 创建房间对象
            var room_info = new room(pms);

            // 把玩家加入房间
            room_info.joinRoom(conn.user_data);

            // 设置房间列表
            global.room_list[String(pms.id)] = room_info;

            // 推送给所有玩家
            global.room.pullRoom();
        },
        leaveRoom: function (rid) {
            rid = String(rid);
            let room = global.room_list['player_' + rid];
            if (room != null) {

                room.leaveRoom(parseInt(rid));
            }
        },

    },
    send: {
        toUser: function (uid, data) {
            uid = uid + '';
            try {

                if (global.user_list[uid] != null) {

                    // 必须是在开启状态才能发送
                    if (global.user_list[uid].readyState == 1)

                        global.user_list[uid].send(data);
                }

            } catch (e) {

                console.log('message error:' + e);
            }
        },
        toAll: function (data) {
            try {

                for (var key in global.user_list) {

                    let element = global.user_list[key];

                    // 必须是在开启状态才能发送
                    if (element.readyState == 1)

                        element.send(data);
                }

            } catch (e) {

                console.log('message error:' + e);
            }
        },

    },
    cache: {
        data: {},
        key: function (key, arr) {

            arr = arr || [];
            return key + ':' + arr.join('_');
        },
        get: function (key) {

            if (!key) {

                console.log('获取缓存失败，KEY为空');
                return false;
            }

            return this.data[key] ? this.data[key] : false;
        },
        set: function (key, val) {

            if (!key) {

                console.log('设置缓存失败，KEY为空');
                return false;
            }

            this.data[key] = val;

            return true;
        },
        delete: function (keys) {

            if (!keys) {

                console.log('删除缓存失败，KEY为空');
                return false;
            }

            if (typeof keys == 'object') {

                for (const k in keys) {
                    const key = keys[k];
                    delete this.data[key];
                }

            }else {

                delete this.data[key];
            }

            return true;
        },
    },
    message: {
        add: function (uid, data, is_send = false) {

            uid = uid + '';
            try {

                let msg = {
                    uid: uid,
                    data: data
                };

                global.msg_data.push(msg);

                if (is_send)
                    global.send.toAll(common.jsonStr('receiveMsg', msg));

            } catch (e) {

                console.log('message error:' + e);
            }
        },
    },
    api: {
    },

};

// global = global;

module.exports = global;