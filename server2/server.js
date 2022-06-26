var ws = require('nodejs-websocket');

var global = require('./js/global');
var common = require('./js/common');
var config = require('./common/config/server');
var UserChat = require('./model/user_chat.model');
var UserBasic = require('./model/user_basic.model');
var UserChatMess = require('./model/user_chat_mess.model');

console.log('开始建立连接...');

// 服务器地址
var ws_host = config.host;

// 访问端口
var ws_port = config.ws_port;

// 创建服务器
var server_oo = ws.createServer(function (conn) {

    // 设置最后的心跳时间
    conn.last_ping = new Date().getTime();

    // 监听消息
    conn.on('text', async (message) => {

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

                    if (pms.account == undefined) {

                        console.log('参数为空');
                        return;
                    }

                    var ubasic = await UserBasic.get(pms.account, 'account');

                    if (!ubasic) {

                        // 注册
                        if (!await UserBasic.reg(pms)) {

                            console.log('注册失败:', pms);
                            return;
                        }

                        // 重新获取
                        ubasic = await UserBasic.get(pms.account, 'account');
                    }

                    var uid = ubasic.id;

                    // 检查密码
                    if (ubasic.password != pms.pass) {

                        conn.send(common.jsonStr('loginrs', {
                            "code": 1,
                            'msg': '密码错误',
                            'data': {}
                        }));

                        return;
                    }

                    if (global.user.isExist(uid)) {

                        global.send.toUser(uid, common.jsonStr('loginrs', {
                            "code": 2,
                            'data': {}
                        }));
                    }

                    // 设置在线状态
                    ubasic.online = true;

                    // 设置缓存信息
                    var cache_key = global.cache.key('User', [uid]);
                    global.cache.set(cache_key, ubasic);

                    // 添加玩家
                    global.user.add(ubasic.id, conn);

                    // 获取玩家列表
                    let user_list = await global.user.getUserList(uid);
                    user_list.myinfo = ubasic;

                    console.log('登陆成功-account:', pms.account);

                    // 发送消息给客户端
                    global.send.toUser(uid, common.jsonStr('loginrs', { 'code': 0, 'data': user_list }));
                    break;

                case 'pullData':

                    var uid = conn.uid;
                    console.log('pullData-uid: ', uid);
                    global.send.toUser(uid, common.jsonStr('pullData', global.msg_data));
                    break;

                case 'pullUser':

                    var uid = conn.uid;
                    // console.log('pullUser-uid: ', uid);
                    global.send.toUser(uid, common.jsonStr('pullUser', await global.user.getUserList(uid)));
                    break;

                case 'updateUser':

                    var uid = conn.uid;
                    var data = msg.rs;
                    console.log('updateUser-uid: ', uid);
                    // console.log('updateUser-data: ', data);

                    if (!data) {

                        console.log('修改玩家信息失败，参数为空');
                        return false;
                    }

                    // 修改玩家信息  name = ?,head = ?,file = ?,sex = ?,remark
                    var upnum = await UserBasic.update({
                        id: uid,
                        sex: data.sex,
                        name: data.name,
                        head: data.head,
                        remark: data.remark
                    });

                    if (!upnum) {

                        console.log('修改玩家信息失败，保存出错');
                        return;
                    }

                    var ubasic = await UserBasic.get(uid);

                    // 设置缓存信息
                    var cache_key = global.cache.key('User', [uid]);
                    global.cache.set(cache_key, ubasic);

                    // 发送消息给客户端
                    global.send.toUser(uid, common.jsonStr('updateUser', ubasic));
                    break;

                case 'createRoom':

                    var data = msg.rs;
                    data.uid = conn.uid;
                    global.room.createRoom(data, conn);
                    break;

                case 'joinRoom':

                    var uid = conn.uid;
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

                    var uid = conn.uid;
                    var content = msg.rs.content;
                    var chat_uid = msg.rs.chat_uid;
                    var msg_type = msg.rs.msg_type;
                    console.log('sendMessage-uid: ', uid);
                    console.log('sendMessage-data: ', msg.rs);

                    if (chat_uid == '' || content == null || msg_type == null) {

                        console.log('发送消息失败，参数为空');
                        return false;
                    }

                    // 是否为新的聊天
                    let isnew = false;

                    // 获取聊天数据
                    let uchat = await UserChat.getChatInfo(uid, chat_uid);

                    // 检查是否聊过
                    if (!uchat) {

                        // 创建聊天
                        uchat = await UserChat.createChat({ uid: uid, chat_uid: chat_uid });

                        if (!uchat) {

                            console.log('创建聊天失败，保存出错', msg.rs);
                            return false;
                        }

                        isnew = true;
                    }

                    // 添加聊天
                    let cheat_mess = await UserChatMess.addMessage({
                        uid: uid,
                        chat_id: uchat.id,
                        content: content,
                        msg_type: msg_type,
                    });

                    if (!cheat_mess) {

                        console.log('添加聊天失败，保存出错', chat_mess);
                        return false;
                    }

                    // 获取在线状态
                    cheat_mess.online = global.user.getOnline(chat_uid);

                    // 检查是否为新的聊天
                    if (isnew) {

                        // 设置为新的聊天
                        cheat_mess.is_new     = true;

                        // 获取玩家基础信息
                        cheat_mess.user_basic = await UserBasic.loadData(uid);
                        cheat_mess.user_basic.dot = 0;
                    }

                    // 发送消息给客户端
                    global.send.toUser(chat_uid, common.jsonStr('receiveMessage', cheat_mess));
                    break;

                case 'seeUserMessage':

                    var uid = conn.uid;
                    var data = msg.rs;
                    // console.log('seeUserMessage-uid: ', uid);
                    // console.log('seeUserMessage-data: ', data);

                    // 修改消息状态
                    let up_ok = UserChatMess.update(data);

                    if (!up_ok) {

                        console.log('修改玩家聊天状态失败，保存出错', data);
                        return false;
                    }

                    // 设置缓存信息
                    let user_basic = await UserBasic.loadData(data.uid);
                    user_basic.dot = 0;

                    // 发送消息给客户端
                    // global.send.toUser(uid, common.jsonStr('receiveMessage', cheat_mess));
                    break;

                case 'pullUserMessage':

                    var uid = conn.uid;
                    var data = msg.rs;
                    // console.log('pullUserMessage-uid: ', uid);
                    // console.log('pullUserMessage-data: ', data);

                    if (data.uid == '') {

                        console.log('拉取玩家消息失败，参数为空');
                        return false;
                    }

                    var user_mess = await UserChatMess.select(data.chat_id, 'chat_id', 50, '`id` DESC');

                    // 重新排序，按照ID
                    user_mess.sort(function (a, b) {
                        return a.id - b.id;
                    });

                    // 发送消息给客户端
                    global.send.toUser(uid, common.jsonStr('pullUserMessage', user_mess));
                    break;

                case 'updateThemeColor': 

                    var uid = conn.uid;
                    var color = msg.rs;

                    if (color == '') {

                        console.log('修改玩家主题失败，参数为空');
                        return false;
                    }

                    // 修改玩家信息
                    var upnum = await UserBasic.update({id: uid, theme_color: color});

                    if (!upnum) {

                        console.log('修改玩家信息失败，保存出错');
                        return;
                    }

                    var ubasic = await UserBasic.get(uid);

                    // 设置缓存信息
                    var cache_key = global.cache.key('User', [uid]);
                    global.cache.set(cache_key, ubasic);
                    
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
                global.send.toUser(conn.uid, common.jsonStr('errorMsg', e));
            }

            console.log('onmessage error: ' + e);
        }
    });

    conn.on('close', function (code, reason) {

        global.user.unset(conn.uid, conn);
        console.log('关闭连接, uid: ', conn.uid);
    });

    conn.on('error', function (code, reason) {

        global.user.unset(conn.uid, conn);
        // console.log('异常关闭, uid: ', conn.uid);
    });

}).listen(ws_port);

console.log('建立连接完毕');
console.log('websocket client connect: ws://' + ws_host + ':' + ws_port);
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