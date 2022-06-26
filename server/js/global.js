var room = require('./room');
var common = require('./common');

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
            this.online = true;
            this.head_img = pms.head || 'head1.jpg';
            this.create_time = (new Date()).getTime();
        },
        get: function (uid) {
          
            let ukey = String(uid);
            if (!global.user_list[ukey]) {

                return false;
            }

            return global.user_list[ukey];
        },
        add: function (uid, ws) {

            let ukey = String(uid);

            if (global.user_list[ukey] != null) {

                global.user_list[ukey].close();
            }

            ws.uid = uid;
            global.user_list[ukey] = ws;

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
            
            let uid  = ws.uid;
            let data = global.user.getData(uid);

            if (!data) {

                return false;
            }

            data.name     = pms.name || '';
            data.remark   = pms.remark || '';
            data.head_img = pms.head_img || '';

            ws.user_data  = data;

            // 存入缓存
            let cache_key = global.cache.key('User', [uid]);
            global.cache.set(cache_key, data);

            // 保存修改
            global.user_list[String(uid)].user_data = data;
            
            return data;
        },
        getData: function (uid) {
            
            let data = global.user.get(uid);

            return data ? data.user_data : false;
        },
        create: function (pms, ws) {

            let uid       = pms.id;
            let cache_key = global.cache.key('User', [uid]);
            let user_info = global.cache.get(cache_key);

            if (!user_info) {

                // 创建玩家
                user_info = new global.user.data(pms);

                // 存入缓存
                global.cache.set(cache_key, user_info);
            }
            
            ws.user_data  = user_info;

            // 添加玩家
            global.user.add(user_info.id, ws);
        },
        isExist: function (uid) {

            let ukey = String(uid);
            return (global.user_list[ukey] != null);
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
        pullRoom: function (uid) {
            
            var mapArr = function(map) {

                var list = [];

                for (var key in map) {

                    list.push(map[key]);
                }

                return list;
            };

            if (uid) {

                global.send.toUser(uid, common.jsonStr('pullRoom', mapArr(global.room_list)));
            }else {

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
        delete: function (key) {

            if (!key) {

                console.log('删除缓存失败，KEY为空');
                return false;
            }
            
            delete this.data[key];

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