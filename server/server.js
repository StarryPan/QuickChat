var ws = require('nodejs-websocket');

var global = require('./js/global');
var common = require('./js/common');

console.log('开始建立连接...');

// 访问端口
var ws_port   = 9001;

// 创建服务器
var server_oo = ws.createServer(function (conn) {

    // 设置最后的心跳时间
    conn.last_ping = new Date().getTime();

    // 监听消息
    conn.on('text', function (message) {

        // 设置最后的心跳时间
        conn.last_ping = new Date().getTime();

        try {

            // console.log('收到的信息为:' + message);
            let msg = JSON.parse(message);
            let cmd = msg.cmd;

            switch (cmd) {
                case 'login':

                    var pms = msg.rs;

                    console.log('login-data: ', pms);
                    console.log('login-uid: ', pms.id);

                    if (pms.id == undefined) {

                        console.log('参数为空');
                        return;
                    }

                    var uid = pms.id;

                    if (global.user.isExist(uid)) {
                        
                        global.send.toUser(uid, common.jsonStr('loginrs', {
                            "code": 2,
                            'data': {}
                        }));
                    }

                    switch (uid) {
                        case 'chunchun':
                            
                            pms = {
                                id: 'chunchun',
                                name: '春春❤',
                                head: 'chunchun.jpg',
                                vip: 9
                            }
                            break;

                        case 'panpan': 

                            pms = {
                                id: 'panpan',
                                name: '盼盼❤',
                                head: 'panpan.jpg',
                                vip: 9
                            }
                            break;
                    
                        default:
                            break;
                    }

                    global.user.create(pms, conn);

                    global.send.toUser(uid, common.jsonStr('loginrs', {
                        "code": 1,
                        'data': conn.user_data
                    }));
                    break;

                case 'pullData':

                    var uid = conn.uid;
                    console.log('pullData-uid: ', uid);
                    global.send.toUser(uid, common.jsonStr('pullData', global.msg_data));
                    break;

                case 'pullRoom':

                    var uid = conn.uid;
                    console.log('pullRoom-uid: ', uid);
                    global.room.pullRoom(uid);
                    break;

                case 'updateUser':

                    var uid  = conn.uid;
                    var data = msg.rs;
                    console.log('updateUser-uid: ', uid);
                    console.log('updateUser-data: ', data);

                    if (!data) {

                        console.log('修改玩家信息失败，参数为空');
                        return false;
                    }

                    global.user.update(data, conn);
                    global.send.toUser(uid, common.jsonStr('updateUser', data));
                    break;

                case 'createRoom': 

                    var data = msg.rs;
                    data.uid = conn.uid;
                    global.room.createRoom(data, conn);
                    break;

                case 'joinRoom':

                    var uid     = conn.uid;
                    var room_id = msg.rs;
                    console.log('joinRoom-uid: ', uid);

                    if (!room_id) {

                        console.log('加入房间失败，房间ID为空');
                        return false;
                    }

                    // 获取房间
                    var room = global.room.get(room_id);

                    // 把玩家加入房间
                    room.joinRoom(conn.user_data);

                    let mess_all = [];

                    room.messages.forEach(mess => {
                        
                        mess_all.push(room.getMessage(mess));
                    });

                    global.send.toUser(uid, common.jsonStr('pullRoomMessage', mess_all));
                    
                    break;

                case 'sendMessage':

                    var uid     = conn.uid;
                    var room_id = msg.rs.room_id;
                    var content = msg.rs.content;
                    console.log('sendMessage-uid: ', uid);

                    if (room_id == '' || content == null) {

                        console.log('发送消息失败，参数为空');
                        return false;
                    }

                    // 获取房间
                    var room = global.room.get(room_id);

                    if (!room) {

                        console.log('发送消息失败，房间不存在: ' + room_id);
                        return false;
                    }

                    // 获取玩家信息
                    let user_info = conn.user_data;

                    let message = {
                        "uid": user_info.id,
                        "smile1": "",
                        "online": user_info.online,
                        "content": content,
                        "create_time": (new Date()).getTime(),
                    };

                    room.addMessage(message);
                    break;

                case 'ping':
                    var uid = conn.uid;
                    global.send.toUser(uid, common.jsonStr('ping', 1));
                    break;

                default:
                    console.log('未定义的CMD: ', cmd);
                    break;
            }

        } catch (e) {

            if (e.code != undefined && e.code != 0) {

                console.log('发送错误信息');
                global.send.toUser(conn.uid,  common.jsonStr('errorMsg', e));
            }

            console.log('onmessage error: ' + e);
        }
    });

    conn.on('close', function (code, reason) {

        global.user.unset(conn.uid, conn);
        console.log('关闭连接, uid: ', conn.uid);
    });

    conn.on('error', function (code, reason) {

        console.log('异常关闭, uid: ', conn.uid);
    });

}).listen(ws_port);

console.log('建立连接完毕');
console.log('client connect: ws://127.0.0.1:' + ws_port);
console.log('\n\n---------------------------------------');
console.log('---------------------------------------\n\n');

// 定时维持心跳，10秒执行一次
setInterval(() => {

    var last_ping = new Date().getTime();

    for (var k in global.user_list) {
        try {
            var ws_k = global.user_list[k];

            // 超过30秒没有心跳，断开连接
            if ((last_ping - ws_k.last_ping) > 30000) {

                console.log('清理30秒没有心跳的玩家, uid: ', ws_k.uid);
                ws_k.destroy();
            }

        } catch (e) {

            console.log('destroy user err:' + e);
        }
    }

}, 10000);