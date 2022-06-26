var init = {
    table_elem: '#currentTable',
    table_render_id: 'currentTableRenderId',
    upload_url: 'ajax/upload',
    upload_exts: 'doc|gif|ico|icon|jpg|mp3|mp4|p12|pem|png|rar',
    join_url: 'view/room/info',
};

// 主 - 控制器
var main = {
    config: {// 主配置
        debug: true,
        hostname: 'ws://127.0.0.1',
        hostprot: 9001,
        heart: {// 心跳
            timeout: 3000,
            timeoutObj: null,
            lockReconnect: false,
            reconnectTimeout: null,
            serverTimeoutObj: null,
        },
        ws: '',
    },
    data: {
        uid: '',
        room_list: []
    },
    modules: {// 模块
        vue: {},
        layui: {},
    },
    index: function () {// 主入口

        // 开始WebSocket
        return main.ws.start();
    },
    message: {// 长连接消息
        controller: function (message) {// 处理

            let msg = JSON.parse(message.data);
            let cmd = msg.cmd;

            main.api.consoleLog('cmd: ', cmd);
            main.api.consoleLog('msg: ', msg);

            // 检查接口是否存在
            if (main.message[cmd] == undefined) {

                main.layui.alert('未定义的CMD:' + cmd);
                return false;
            }

            // 调用CMD接口
            main.message[cmd](msg);

            // 执行监听Click
            main.click.listen();
        },
        ping: function (msg) {// 心跳消息

        },
        loginrs: function (msg) {// 登陆

            let rs = msg.rs;

            if (rs.code == 1) {

                // 显示房间列表
                $('.room').removeClass('hide');

                // 设置自己的ID
                main.data.uid = rs.data.id;

                // 给主界面的玩家信息赋值
                main.modules.vue.info = rs.data;

                // 拉取房间数据
                main.ws.send('pullRoom');

            } else if (rs.code == 2) {

                // 关闭连接
                main.ws.connect.close();
                alert('你的账号已被其他人登陆!');

                // 设置连接状态
                main.config.heart.lockReconnect = true;
                main.api.setConnectState('离线');

            } else {

                alert(rs.code);
            }

            return false;
        },
        errorMsg: function (msg) {// 报错消息
            let data = msg.rs;

            // 返回数据关闭loading
            layer.closeAll('loading');

            // 提示
            main.layui.error(data.msg, function () {

                // 清空回调
                main.callback = {};

                // 全部所有弹框
                if (data.code == 1) {

                    layer.closeAll();
                }
            });
        },
        pullMess: function (msg) {// 拉取数据

            let data = msg.rs;
            data.forEach(element => {
                main.api.addMsgLi(element);
            });
        },
        pullRoom: function (msg) {// 拉取房间

            // 获取自己孩子的框架
            main.api.getChildFrame(function (contentWindow) {

                if (contentWindow.closeAddFrame) {

                    // 关闭界面
                    contentWindow.closeAddFrame();
                }
            });

            // 使用LayuiTable组件
            let data = msg.rs;
            var table = main.layui.init('table');

            table.render({
                elem: '#currentTable'
                , data: data
                , cellMinWidth: 80 //全局定义常规单元格的最小宽度，layui 2.2.1 新增
                , cols: [[
                    { field: 'id', title: 'ID', sort: true }
                    , { field: 'name', title: '房间名' }
                    , { field: 'uid', title: '房主' }
                    , { field: 'players', title: '人数', sort: true }
                    , { field: 'create_time', title: '时间', search: 'range', templet: "<div>{{layui.util.toDateString(d.create_time, 'yyyy-MM-dd HH:mm:ss')}}</div>" }
                    , {
                        width: 250,
                        title: '操作',
                        templet: main.layui.table.tool,
                        operat: [
                            'join'
                        ]
                    }
                ]]
            });

            // 储存房间列表
            main.data.room_list = data;
        },
        updateUser: function (msg) {// 修改玩家信息

            // 给主界面的玩家信息赋值
            main.modules.vue.info = msg.rs;
            
            // 获取自己孩子的框架
            main.api.getChildFrame(function (contentWindow) {
                
                // 关闭界面
                contentWindow.closeFrame();
            });
        },
        updateRoom: function (msg) {// 房间信息
            // main.callback.test1();
            // let layer = main.layui.init('layer');
            // let index = main.callback.addRoom;
            // layer.close(index);    //返回数据关闭loading
            // layer.closeAll('iframe');
        },
        receiveMessage: function (msg) {// 接收消息

            let data = msg.rs;

            // 获取自己孩子的框架
            main.api.getChildFrame(function (contentWindow) {
                
                // 不是自己的消息
                if (data.uid != main.data.uid) {

                    // 消息提示音
                    main.audio.music['receive'].play();
                }

                // 接收消息
                contentWindow.receiveMessage(msg.rs);
            });
        },
        pullRoomMessage: function (msg) {// 拉取房间消息
        
            // 获取自己孩子的框架
            main.api.getChildFrame(function (contentWindow) {
                
                // 调用初始化消息
                contentWindow.initMessage(msg.rs);
            });
        },
    },
    click: {// 点击事件
        listen: function () {// 主动监听

            // 发送消息
            $('.sendMsg').off('click').on('click', function () {

                var msg = $('#msg').val();
                main.api.consoleLog('send.msg: ', msg);

                if (msg == null || msg == '') {

                    main.api.consoleLog('发送消息不能为空');
                    return false;
                }

                main.ws.send('sendMsg', msg);
                $('#msg').val('');
            });

            // 表格修改
            $("body").off('click').on("mouseenter", ".table-edit-tips", function () {
                var openTips = layer.tips('点击行内容可以进行修改', $(this), { tips: [2, '#e74c3c'], time: 4000 });
            });

            // 监听弹出层的打开
            $('body').off('click').on('click', '[data-open]', function () {

                var clienWidth = $(this).attr('data-width'),
                    clientHeight = $(this).attr('data-height'),
                    dataFull = $(this).attr('data-full'),
                    checkbox = $(this).attr('data-checkbox'),
                    url = $(this).attr('data-open'),
                    tableId = $(this).attr('data-table');

                if (checkbox === 'true') {
                    tableId = tableId || init.table_render_id;
                    var checkStatus = table.checkStatus(tableId),
                        data = checkStatus.data;
                    if (data.length <= 0) {
                        main.layui.msg.error('请勾选需要操作的数据');
                        return false;
                    }

                    var ids = [];
                    $.each(data, function (i, v) {
                        ids.push(v.id);
                    });
                    if (url.indexOf("?") === -1) {
                        url += '?id=' + ids.join(',');
                    } else {
                        url += '&id=' + ids.join(',');
                    }
                }

                if (clienWidth === undefined || clientHeight === undefined) {
                    var width = document.body.clientWidth,
                        height = document.body.clientHeight;
                    if (width >= main.layui.config.open_width && height >= main.layui.config.open_height) {
                        clienWidth = main.layui.config.open_width + 'px';
                        clientHeight = main.layui.config.open_height + 'px';
                    } else {
                        clienWidth = '100%';
                        clientHeight = '100%';
                    }
                }

                // 全屏
                if (main.layui.config.open_full || dataFull === 'true') {
                    clienWidth = '100%';
                    clientHeight = '100%';
                }

                main.layui.open(
                    $(this).attr('data-title'),
                    main.url.url(url),
                    clienWidth,
                    clientHeight,
                );
            });

            return true;
        },
    },
    ws: {// WebSocket
        connect: null,
        run: function (msg, op, err) {

            try {

                // 连接WebSocket
                var ws_url = main.url.hostUrl();
                main.ws.connect = new WebSocket(ws_url);

                return main.ws.init(msg, op, err);

            } catch (e) {

                main.api.consoleLog('catch');
                return main.ws.reconnect(main.url.hostUrl());
            }
        },
        init: function (msg, op, err) {// 初始化

            main.ws.connect.onopen = function (e) {

                op = op || function (e) {
                    main.api.consoleLog('WebSocket: onopen success');
                    main.ws.send('login', main.api.getQueryVariable('token'));
                    return false;
                };

                // 心跳检测重置
                main.ws.heartCheck();

                return op(e);
            }

            main.ws.connect.onclose = function (e) {

                main.api.consoleLog('WebSocket: onclose');

                // 断线重连
                main.ws.reconnect(main.url.hostUrl());

                return err(e, 1);
            }

            main.ws.connect.onerror = function (e) {

                main.api.consoleLog('WebSocket: onerror', e);

                // 断线重连
                main.ws.reconnect(main.url.hostUrl());

                return err(e, 2);
            }

            main.ws.connect.onmessage = function (message) {

                // main.api.consoleLog('ws.onmessage: ', message.data);

                // 心跳检测重置
                main.ws.heartCheck();

                // 回调消息
                return msg(message);
            }
        },
        start: function () {

            // 执行WebSocket
            main.ws.run(main.message.controller, function () {

                // 设置连接状态
                main.api.setConnectState('在线');
                main.api.consoleLog('WebSocket: onopen success');

                // 检查是否登陆
                if (main.api.isLogin()) {

                    let pms = {
                        "id": main.api.getQueryVariable('token'),
                        "name": main.api.getQueryVariable('name'),
                        "head": main.api.getQueryVariable('head'),
                    };

                    // 发送登陆请求
                    main.ws.send('login', pms);
                }

                return true;

            }, function (err, state) {

                let err_str = (state > 1) ? '出错' : '断开';
                main.api.setConnectState(err_str, 1);
            });

            return false;
        },
        send: function (cmd, rs, callback) {// 发送信息

            callback = callback || function () {
                return false;
            };
            main.ws.connect.send(main.api.jsonStr(cmd, rs));
            return callback();
        },
        reconnect: function (url) {// 断线重连

            if (main.config.heart.lockReconnect) {

                main.api.consoleLog('lockReconnect stop');
                return;
            }

            main.config.heart.lockReconnect = true;

            // 没连接上会一直重连，设置延迟避免请求过多
            main.config.heart.reconnectTimeout && clearTimeout(main.config.heart.reconnectTimeout);
            main.config.heart.reconnectTimeout = setTimeout(function () {

                main.api.consoleLog('开始重连');

                // 执行WebSocket
                main.ws.start();

                // 停止重连
                main.config.heart.lockReconnect = false;
            }, 4000);
        },
        heartCheck: function () {// 心跳检测

            main.api.consoleLog('heartCheck start');
            var heart_cfg = main.config.heart;
            heart_cfg.timeoutObj && clearTimeout(heart_cfg.timeoutObj);
            heart_cfg.serverTimeoutObj && clearTimeout(heart_cfg.serverTimeoutObj);
            heart_cfg.timeoutObj = setTimeout(function () {

                // 这里发送一个心跳，后端收到后，返回一个心跳消息，
                main.api.consoleLog('heartCheck ping');
                main.ws.send('ping', 1);

                // 关闭服务器连接
                heart_cfg.serverTimeoutObj = setTimeout(function () {

                    main.api.consoleLog('心跳停止');
                    main.ws.connect.close();

                }, heart_cfg.timeout);

            }, heart_cfg.timeout);
        }
    },
    url: {// 地址
        hostUrl: function () {
            return main.config.hostname + ':' + main.config.hostprot;
        },
        url: function (url) {
            init.admin_url = init.admin_url || '';
            return url ? init.admin_url + '/' + main.url.suffix(url) : '';
            // return url ? '/' + init.admin_url + '/' + url : '';
        },
        suffix: function (url) {
            return url.indexOf('.html') == -1 ? url + '.html' : url;
        },
    },
    api: {// 接口
        jsonStr: function (cmd, rs) {

            let js_obj = {
                "cmd": cmd,
                "rs": rs
            };
            return JSON.stringify(js_obj);
        },
        isLogin: function () {

            if (main.api.getQueryVariable('token')) {

                return true;
            }

            return false;
        },
        randToken: function (e) {

            e = e || 32;
            var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz" + (new Date()).getTime(),
                a = t.length,
                n = "";
            for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
            return n;
        },
        consoleLog: function (str, val = '') {

            if (!main.config.debug) {

                return false;
            }

            console.log(str, val);
            return true;
        },
        checkMobile: function () {
            var userAgentInfo = navigator.userAgent;
            var mobileAgents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
            var mobile_flag = false;
            //根据userAgent判断是否是手机
            for (var v = 0; v < mobileAgents.length; v++) {
                if (userAgentInfo.indexOf(mobileAgents[v]) > 0) {
                    mobile_flag = true;
                    break;
                }
            }
            var screen_width = window.screen.width;
            var screen_height = window.screen.height;
            //根据屏幕分辨率判断是否是手机
            if (screen_width < 600 && screen_height < 800) {
                mobile_flag = true;
            }
            return mobile_flag;
        },
        getChildFrame: function (callback) {

            // 获取当前页面的所有框架
            var frames = document.getElementsByTagName("iframe");

            if (frames.length == 0 || frames[0].contentWindow == undefined) {

                return false;
            }

            return callback(frames[0].contentWindow);
        },
        setConnectState: function (msg, state = 0) {

            let dot_color = '<span class="layui-badge-dot"></span>';

            if (state == 0) {

                dot_color = '<span class="layui-badge-dot" style="background-color: green;"></span>';
            }

            // 更改连接状态
            $('.connect-state').html(msg + dot_color);
            return true;
        },
        getQueryVariable: function (variable) {

            var query = window.location.search.substring(1);
            var vars = query.split("&");

            for (var i = 0; i < vars.length; i++) {

                var pair = vars[i].split("=");

                if (pair[0] == variable) {

                    return pair[1];
                }
            }

            return false;
        },

    },
    layui: {// Layui组件
        config: {
            anim: 0,
            time: 3800,
            skin: 'layui-layer-setmybg',
            shade: [0.02, '#000'],
            open_full: false,// 全窗口
            open_width: 800,// 窗口宽度
            open_height: 600,// 窗口高度
            listen_upload: true,// 监听上传事件
            open_iframe: []
        },
        init: function (mm) {

            if (main.modules.layui == undefined) {

                main.api.consoleLog('初始化Init加载扩展失败 ', '[main.modules.layui]');
                return;
            }

            let layui = main.modules.layui;

            if (layui[mm] == undefined) {

                main.layui.alert('Layui模块不存在: ' + mm);
                return false;
            }

            return layui[mm];
        },
        open: function (title, url, width, height, isResize) {

            isResize = isResize === undefined ? true : isResize;
            var layer = main.layui.init('layer');
            var index = layer.open({
                title: title,
                type: 2,
                area: [width, height],
                content: url,
                maxmin: true,
                moveOut: true,
                success: function (layero, index) {
                    var body = layer.getChildFrame('body', index);

                    if (body.length > 0) {
                        $.each(body, function (i, v) {

                            // todo 优化弹出层背景色修改
                            $(v).before('<style>\n' +
                                'html, body {\n' +
                                '    background: #ffffff;\n' +
                                '}\n' +
                                '</style>');
                        });
                    }
                }
            });
            if (main.api.checkMobile() || width === undefined || height === undefined) {
                layer.full(index);
            }
            if (isResize) {
                $(window).on("resize", function () {
                    layer.full(index);
                })
            }
        },
        table: {
            buildOperatHtml: function (operat) {
                var html = '';
                operat.class = operat.class || '';
                operat.icon = operat.icon || '';
                operat.auth = operat.auth || '';
                operat.url = operat.url || '';
                operat.extend = operat.extend || '';
                operat.method = operat.method || 'open';
                operat.field = operat.field || 'id';
                operat.title = operat.title || operat.text;
                operat.text = operat.text || operat.title;

                var formatOperat = operat;
                formatOperat.icon = formatOperat.icon !== '' ? '<i class="' + formatOperat.icon + '"></i> ' : '';
                formatOperat.class = formatOperat.class !== '' ? 'class="' + formatOperat.class + '" ' : '';
                if (operat.method === 'open') {
                    formatOperat.method = formatOperat.method !== '' ? 'data-open="' + formatOperat.url + '" data-title="' + formatOperat.title + '" ' : '';
                } else {
                    formatOperat.method = formatOperat.method !== '' ? 'data-request="' + formatOperat.url + '" data-title="' + formatOperat.title + '" ' : '';
                }
                html = '<a ' + formatOperat.class + formatOperat.method + formatOperat.extend + '>' + formatOperat.icon + formatOperat.text + '</a>';

                return html;
            },
            toolSpliceUrl(url, field, data) {
                url = main.url.suffix(url);
                url = url.indexOf('?') !== -1 ? url + '&' + field + '=' + data[field] : url + '?' + field + '=' + data[field];
                return url;
            },
            tool: function (data, option) {
                option.operat = option.operat || ['edit', 'delete'];
                var elem = init.table_elem;
                var html = '';
                $.each(option.operat, function (i, item) {
                    if (typeof item === 'string') {
                        switch (item) {
                            case 'join':
                                var operat = {
                                    class: 'layui-btn layui-btn-success layui-btn-xs',
                                    method: 'open',
                                    field: 'id',
                                    icon: '',
                                    text: '进入房间',
                                    title: data.name,
                                    auth: 'join',
                                    url: init.join_url,
                                    extend: ""
                                };
                                operat.url = main.layui.table.toolSpliceUrl(operat.url, operat.field, data);
                                // if (admin.checkAuth(operat.auth, elem)) {
                                html += main.layui.table.buildOperatHtml(operat);
                                // }
                                break;
                            case 'delete':
                                var operat = {
                                    class: 'layui-btn layui-btn-danger layui-btn-xs',
                                    method: 'get',
                                    field: 'id',
                                    icon: '',
                                    text: '删除',
                                    title: '确定删除？',
                                    auth: 'delete',
                                    url: option.init.delete_url,
                                    extend: ""
                                };
                                operat.url = main.layui.table.toolSpliceUrl(operat.url, operat.field, data);
                                // if (admin.checkAuth(operat.auth, elem)) {
                                html += main.layui.table.buildOperatHtml(operat);
                                // }
                                break;
                        }

                    } else if (typeof item === 'object') {
                        $.each(item, function (i, operat) {
                            operat.class = operat.class || '';
                            operat.icon = operat.icon || '';
                            operat.auth = operat.auth || '';
                            operat.url = operat.url || '';
                            operat.method = operat.method || 'open';
                            operat.field = operat.field || 'id';
                            operat.title = operat.title || operat.text;
                            operat.text = operat.text || operat.title;
                            operat.extend = operat.extend || '';
                            operat.url = main.layui.table.toolSpliceUrl(operat.url, operat.field, data);
                            // if (admin.checkAuth(operat.auth, elem)) {
                            html += main.layui.table.buildOperatHtml(operat);
                            // }
                        });
                    }
                });
                return html;
            },
        },
        // 成功消息
        success: function (msg, callback) {
            if (callback === undefined) {
                callback = function () {
                }
            }

            if (!msg) {
                layui.msg.error('消息提示标题不能为空[msg]');
                return false;
            }

            var layer = main.layui.init('layer');
            var index = layer.msg(msg, { icon: 1, shade: main.layui.config.shade, scrollbar: false, time: 2000, shadeClose: true }, callback);
            return index;
        },
        // 失败消息
        error: function (msg, callback) {
            if (callback === undefined) {
                callback = function () {
                }
            }

            if (!msg) {
                main.layui.error('消息提示标题不能为空[msg]');
                return false;
            }
            let icon = main.layui.config.icon ? main.layui.config.icon : 2;
            var index = main.layui.init('layer').msg(msg, { icon: icon, anim: main.layui.config.anim, shade: main.layui.config.shade, scrollbar: false, time: 3500, shadeClose: true }, callback);
            return index;
        },
        // 警告消息框
        alert: function (msg, callback, anim = 6) {
            if (!msg) {
                main.layui.error('消息提示标题不能为空[msg]');
                return false;
            }

            // 自定义警告消息框
            var index = main.layui.init('layer').msg(msg, {
                btn: '确认',
                end: callback,
                area: '420px',
                anim: anim,
                time: 30000000, // 30分钟后自动关闭
                skin: main.layui.config.skin,
                shade: main.layui.config.shade,
                // offset: 't',
            });
            // var index = main.layui.init('layer').main.layui.alert(msg, {end: callback, scrollbar: false});
            return index;
        },
        // 对话框
        confirm: function (msg, ok, no) {
            if (!msg) {
                main.layui.error('消息提示标题不能为空[msg]');
                return false;
            }

            // 自定义对话框
            var msg_index = main.layui.init('layer').msg(msg, {
                btn: ['确认', '取消'],
                time: 3000000, // 30s后自动关闭
                skin: main.layui.config.skin,
                anim: main.layui.config.anim,
                shade: main.layui.config.shade,
                btnAlign: 'c',
                yes: function () {
                    typeof ok === 'function' && ok.call(this);
                },
                btn2: function (index, layero) {
                    typeof no === 'function' && no.call(this);
                },
                cancel: function () {
                    // 关闭了右上角关闭回调
                }
            });
            return msg_index;
        },
        // 消息提示
        tips: function (msg, time, callback) {
            if (!msg) {
                main.layui.error('消息提示标题不能为空[msg]');
                return false;
            }
            var index = main.layui.init('layer').msg(msg, { time: (time || 3) * 1000, shade: this.shade, end: callback, shadeClose: true });
            return index;
        },
        // 加载中提示
        loading: function (msg, callback) {
            var index = msg ? main.layui.init('layer').msg(msg, { icon: 16, scrollbar: false, shade: this.shade, time: 0, end: callback }) : main.layui.init('layer').load(2, { scrollbar: false, time: 0, offset: ['40%', '49%'], shade: [0.8, '#f5f5f5'], end: callback });
            return index;
        },
        // 关闭消息框
        close: function (index) {
            return main.layui.init('layer').close(index);
        }
    },
    model: {
        getRommWithId: function (rid) {
            
            let room_list = main.data.room_list;

            for (const key in room_list) {

                let rinfo = room_list[key];

                if (rinfo.id == rid) {

                    return rinfo;
                }
            }

            return false;
        },
    },
    audio: {// 提示音
        music: {},
        init: function (arr) {

            arr = arr || [];

            if (arr.length == 0) {

                return false;
            }

            arr.forEach(file_name => {
                
                var audioElementHovertree = document.createElement('audio');
                audioElementHovertree.setAttribute('src', './music/'+file_name+'.mp3');
                main.audio.music[file_name] = audioElementHovertree;
            });
            
        }
    }
};

