var init = {
    table_elem: '#currentTable',
    table_render_id: 'currentTableRenderId',
    upload_exts: 'doc|gif|ico|icon|jpg|mp3|mp4|p12|pem|png|rar',
    join_url: 'view/room/info',
};

// 主 - 控制器
var main = {
    config: {// 主配置
        debug: true,
        heart: {// 心跳
            timeout: 3000,
            timeoutObj: null,
            lockReconnect: false,
            reconnect_num: 0,
            reconnectTimeout: null,
            serverTimeoutObj: null,
        },
        ws: '',
        ws_host: '',
        cdn_host: '',
        chat_colse: false,
    },
    data: {
        uid: '',
        messageData: [],
    },
    modules: {// 模块
        vue: {},
        layui: {},
    },
    index: function (cfg) {// 主入口

        if (!cfg.WS_HOST) {

            alert('未传入长连接地址');
            return false;
        }

        main.config.ws_host = cfg.WS_HOST;
        main.config.cdn_host = cfg.CDN_HOST;

        // 开始WebSocket
        return main.ws.start();
    },
    listen: function (option) {

        let title = document.querySelectorAll(".chat-list-header");

        for (let i = 0; i < title.length; i++) {
            let totalHeight = 0;
            title[i].addEventListener("click", function () {
                let result = this.nextElementSibling;
                let activeSibling = this.nextElementSibling.classList.contains('active');
                this.classList.toggle('active');
                result.classList.toggle("active");
                if (!activeSibling) {
                    for (i = 0; i < result.children.length; i++) {
                        totalHeight = totalHeight + result.children[i].scrollHeight + 40;
                    }
                } else {
                    totalHeight = 0;
                }
                result.style.maxHeight = totalHeight + "px";
            });
        }

        let themeColors = document.querySelectorAll('.theme-color');

        themeColors.forEach(themeColor => {
            themeColor.addEventListener('click', e => {
                themeColors.forEach(c => c.classList.remove('active'));
                let theme = themeColor.getAttribute('data-color');
                document.body.setAttribute('data-theme', theme);
                themeColor.classList.add('active');

                // 发送拉取玩家更改的主题颜色
                main.ws.send('updateThemeColor', theme);
            });
        });

        // 监听点击玩家列表
        main.click.userList();

        return false;
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

            if (rs.code == 0) {

                let data = rs.data;

                // 设置自己的ID
                main.data.uid = data.id;

                // 给主界面的玩家信息赋值
                main.modules.vue.myinfo = data.myinfo;

                // 设置主题颜色
                document.body.setAttribute('data-theme', data.myinfo.theme_color);

                let themeColors = document.querySelectorAll('.theme-color');

                themeColors.forEach(themeColor => {
                    let theme = themeColor.getAttribute('data-color');

                    if (theme == data.myinfo.theme_color) {

                        themeColor.classList.add('active');
                        return false;
                    }
                });

                // 更新聊天列表
                main.modules.vue.updateChatList(data.chat_list);

                // 更新世界列表
                main.modules.vue.updateWorldList(data.world_list);

                setTimeout(() => {

                    let layer = main.layui.init('layer');
                    layer.closeAll('loading');

                    // 左边界面去除居中
                    // $('.app-left').removeClass('center');

                    // 显示界面列表
                    $('.app-container').removeClass('hide');

                    // 执行主页监听
                    main.listen();

                    // 定时拉取数据，30秒执行一次
                    setInterval(() => {
                        main.ws.send('pullUser');
                    }, 30000);
                }, 500);

            } else if (rs.code == 1) {

                // 返回数据关闭loading
                let layer = main.layui.init('layer');
                layer.closeAll('loading');

                // 关闭连接
                main.ws.connect.close();

                // 设置连接状态
                main.config.heart.lockReconnect = true;

                alert(rs.msg);

                $('.app-container-404').removeClass('hide');

            } else if (rs.code == 2) {

                // 关闭连接
                main.ws.connect.close();
                alert('你的账号已被其他人登陆!');

                // 设置连接状态
                main.api.setConnectState(1);
                main.config.heart.lockReconnect = true;

            } else {

                alert(rs.code);
            }

            return false;
        },
        errorMsg: function (msg) {// 报错消息
            let data = msg.rs;
            let layer = main.layui.init('layer');

            // 返回数据关闭loading
            layer.closeAll('loading');

            // 提示
            main.layui.error(data.msg, function () {

                // 全部所有弹框
                if (data.code == 1) {

                    layer.closeAll();
                }

                $('.app-container-404').removeClass('hide');
            });
        },
        pullMess: function (msg) {// 拉取数据

            let data = msg.rs;
            data.forEach(element => {
                main.api.addMsgLi(element);
            });
        },
        pullUser: function (msg) {// 拉取玩家

            let data = msg.rs;

            // 更新聊天列表
            main.modules.vue.updateChatList(data.chat_list);

            // 更新世界列表
            main.modules.vue.updateWorldList(data.world_list);

            // 储存房间列表
            main.data.room_list = data;

            // 延时100毫秒，给vue加载时间
            setTimeout(() => {
                // 监听点击玩家列表
                main.click.userList();
            }, 50);
        },
        updateUser: function (msg) {// 修改玩家信息

            // 给主界面的玩家信息赋值
            main.modules.vue.myinfo = msg.rs;

            // 获取自己孩子的框架
            main.api.getChildFrame(function (contentWindow) {

                console.log('contentWindow: ', contentWindow);
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

            console.log('receiveMessage-data: ', data);

            let chat_id = data.chat_id;

            if (main.data.messageData[chat_id] != undefined) {

                main.data.messageData[chat_id].push(data);
                main.modules.vue.chat.mess = main.data.messageData[chat_id];

            } else {

                let temp_chatid = 'temp_' + data.uid;

                if (main.data.messageData[temp_chatid] != undefined) {

                    main.data.messageData[chat_id] = main.data.messageData[temp_chatid];
                    main.data.messageData[chat_id].push(data);
                    main.modules.vue.chat.mess = main.data.messageData[chat_id];

                    // 给当前聊天的玩家的聊天ID加上
                    main.modules.vue.chat.user.chat_id = chat_id;

                    // 删除临时聊天
                    delete main.data.messageData[temp_chatid];
                }
            }

            // 延时调用，给vue加载时间
            setTimeout(() => {
                if ($(".chat-wrapper")[0] != undefined) {
                    // 回滚到最下方
                    $(".chat-wrapper").scrollTop($(".chat-wrapper")[0].scrollHeight);
                }
            }, 10);

            // 检查是否打开聊天界面
            if (main.modules.vue.chat.user.id == data.uid) {

                // 清空红点
                main.modules.vue.clearChatUserReddot(data.uid, chat_id);

            } else {

                // 添加红点
                main.modules.vue.addChatUserReddot(data.uid);
            }

            // 检查是否为新的聊天
            if (data.is_new) {

                let ubasic = data.user_basic;
                ubasic.dot = 1;
                ubasic.chat_id = chat_id;

                main.modules.vue.chat.list.push(ubasic);

                // 延时100毫秒，给vue加载时间
                setTimeout(() => {
                    // 监听点击玩家列表
                    main.click.userList();
                }, 50);
            }

            // 消息提示音
            if (main.audio.music.receive != undefined) {

                // 初始化音频
                main.audio.music.receive.play();
            }

            return true;
        },
        pullUserMessage: function (msg) {// 拉取玩家消息

            let data = msg.rs;

            let layer = main.layui.init('layer');
            layer.closeAll('loading');

            // 判断数据是否为空
            if (data[0] != undefined && data[0].chat_id != undefined) {

                let chat_id = data[0].chat_id;

                if (main.data.messageData[chat_id] == undefined) {

                    main.data.messageData[chat_id] = [];
                }

                main.data.messageData[chat_id] = data;

                // 设置聊天信息
                main.modules.vue.chat.mess = main.data.messageData[chat_id];

                // 检查聊天玩家的红的
                if (main.modules.vue.chat.user.dot) {

                    // 清楚小红点
                    main.modules.vue.clearChatUserReddot(main.modules.vue.chat.user.id, chat_id);
                }
            }

            // 延时调用，给vue加载时间
            setTimeout(() => {

                $('.message-loading').fadeOut(500, function () {
                    $('.chat-message').fadeIn(500);

                    // 回滚到最下方
                    $(".chat-wrapper").scrollTop($(".chat-wrapper")[0].scrollHeight);
                });
                    
            }, 100);

            // 延时100毫秒，给vue加载时间
            setTimeout(() => {
                // main.listen();
            }, 100);
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

            // 监听在线状态按钮
            $('#switchStatus').off('click').on('click', function () {

                // 在线状态
                if (main.ws.getOnline()) {

                    // 断开连接
                    main.ws.connect.close();
                    main.api.setConnectState(1);

                    // 禁止重连
                    main.config.heart.lockReconnect = true;

                } else {

                    // 重连
                    main.ws.start();

                    // 开始重连
                    main.config.heart.lockReconnect = false;
                }

                console.log('main.ws.connect: ', main.ws.connect);
                console.log('main.config.heart.lockReconnect: ', main.config.heart.lockReconnect);
            });

            // 监听返回按钮
            $('.chat-wrapper-back').off('click').on('click', function () {

                // 清空缓存
                main.data.messageData = [];
                main.modules.vue.chat.user = {};
                main.modules.vue.chat.mess = [];
            });

            // 监听聊天信息界面
            $('.chat-more').off('click').on('click', function () {

                if (main.config.chat_colse) {

                    main.config.chat_colse = false;
                    $('.app-right').fadeOut(300);
                } else {

                    main.config.chat_colse = true;
                    $('.app-right').fadeIn(500);
                }

            });

            // 放大图片
            $('body').on('click', '[data-image]', function () {
                var title = $(this).attr('data-image'),
                    src = $(this).attr('src'),
                    alt = $(this).attr('alt');
                var photos = {
                    "title": title,
                    "id": Math.random(),
                    "data": [
                        {
                            "alt": alt,
                            "pid": Math.random(),
                            "src": src,
                            "thumb": src
                        }
                    ]
                };
                layer.photos({
                    photos: photos,
                    anim: 5
                });
                return false;
            });

            return true;
        },
        userList: function () {
            const chatItems = document.querySelectorAll(".chat-list-item");

            chatItems.forEach(chatItem => {

                chatItem.addEventListener("click", e => {
                    chatItems.forEach(c => c.classList.remove('active'));
                    chatItem.classList.add('active');

                    let data_id = $(chatItem).attr('data-id');
                    let chat_id = $(chatItem).attr('data-chatid');

                    // 获取聊天数据
                    let mess = main.data.messageData[chat_id] || false;

                    $('.chat-message').hide();
                        $('.message-loading').show();

                    // 检查聊天内容
                    if (!mess) {

                        

                        // 发送拉取玩家聊天数据
                        main.ws.send('pullUserMessage', {
                            uid: data_id,
                            chat_id: chat_id
                        });
                    } else {

                        // 清除小红点
                        main.modules.vue.clearChatUserReddot(data_id, chat_id);
                    }

                    main.modules.vue.chat.user = {};
                    main.modules.vue.chat.mess = mess;
                    main.modules.vue.setChatUser(data_id);

                    // 延时调用，给vue加载时间
                    setTimeout(() => {
                        
                        $('.message-loading').fadeOut(500, function () {
                            $('.chat-message').fadeIn(500);
        
                            if ($(".chat-wrapper")[0] != undefined) {

                                // 回滚到最下方
                                $(".chat-wrapper").scrollTop($(".chat-wrapper")[0].scrollHeight);
                            }
                        });

                        // if ($(".chat-wrapper")[0] != undefined) {

                        //     // 回滚到最下方
                        //     $(".chat-wrapper").scrollTop($(".chat-wrapper")[0].scrollHeight);
                        // }

                        // 发送文件
                        $('.chat-attachment-btn').off('click').on('click', function () {

                            // var file = $('#file-upload');
                            var file = document.getElementById('file-upload');

                            // 点击图片的同时，点击上传文件的input
                            file.click();

                            file.onchange = function() {
                                var fileData = this.files[0];//获取到一个FileList对象中的第一个文件( File 对象),是我们上传的文件
                                var pettern = /^image/;
                                 
                                if (!pettern.test(fileData.type)) {
                                    alert("图片格式不正确");
                                    return;
                                }

                                // 重复上传同一个文件，会没有效果：来回切换input[type=’file’]的type属性值
                                file.setAttribute("type",'text');
                                file.setAttribute("type",'file');

                                // 上传图片到服务器
                                main.request.ajaxFileData({
                                    data: fileData,
                                    loading: false
                                },function (res) {
                        
                                    // 发送图片
                                    var url = res.data.url;
                                    main.modules.vue.sendMessage(url, 7);
                                    return false;
                                });
                            }
                        });

                    }, 500);

                    // main.listen();
                    return true;
                });
            });

            return true;
        },
        upload: function (ok, no) {
            var layui = main.modules.layui,
                upload = layui.upload;

            var uploadList = document.querySelectorAll("[data-upload]");

            if (uploadList.length > 0) {

                $.each(uploadList, function (i, v) {
                    let exts = $(this).attr('data-upload-exts'),
                        uploadUrl = $(this).attr('data-upload-url'),
                        uploadSign = $(this).attr('data-upload-sign'),
                        uploadName = $(this).attr('data-upload'),
                        uploadNumber = $(this).attr('data-upload-number'),
                        uploadLoading = $(this).attr('data-upload-loading'),
                        uploadrefresh = $(this).attr('data-upload-refresh');

                    let elem = 'input[name="' + uploadName + '"]', uploadElem = this;

                    // 检查默认值
                    exts = exts || init.upload_exts;
                    uploadUrl = uploadUrl || main.url.cdnUrl('upload');
                    uploadSign = uploadSign || '|';
                    uploadNumber = uploadNumber || 'one';
                    uploadrefresh = uploadrefresh || false;
                    uploadLoading = uploadLoading || true;

                    ok = ok || function (res) {
                        return true;
                    };

                    no = no || function (err) {

                        console.log('upload - err: ', err);
                        return false;
                    };

                    // 监听上传事件
                    upload.render({
                        elem: this,
                        url: uploadUrl,
                        accept: 'file',
                        exts: exts,
                        // 让多图上传模式下支持多选操作
                        multiple: (uploadNumber !== 'one') ? true : false,
                        before: function (obj) {

                            if (uploadLoading != 'false') {

                                // 上传loading
                                index = main.layui.loading(); 
                            }
                        },
                        done: function (res) {
                            layer.closeAll('loading'); //关闭loading
                            if (res.code === 0) {
                                if (ok(res.data)) {
                                    var url = res.data.url;
                                    if (uploadNumber !== 'one') {
                                        var oldUrl = $(elem).val();
                                        if (oldUrl !== '') {
                                            url = oldUrl + uploadSign + url;
                                        }
                                    }

                                    $(elem).val(url);
                                    $(elem).trigger("input");
                                    main.layui.success(res.msg, function () {
                                        if (uploadrefresh) {
                                            table.reload(uploadrefresh);
                                            main.api.upload(ok);// 初始化图片显示以及监听上传事件
                                        }
                                    }, 1);
                                }
                            } else {
                                main.layui.error(res.msg);
                            }

                            return false;
                        }, error: function (index, upload) {

                            layer.closeAll('loading'); // 关闭loading
                            main.layui.error('上传失败');
                            return no(upload);
                        }
                    });

                    // 监听上传input值变化
                    $(elem).bind("input propertychange", function (event) {

                        var urlString = $(this).val(),
                            urlArray = urlString.split(uploadSign),
                            uploadIcon = $(uploadElem).attr('data-upload-icon');
                        uploadIcon = uploadIcon || "file";

                        $('#bing-' + uploadName).remove();
                        if (urlString.length > 0) {
                            var parant = $(this).parent('div');
                            var liHtml = '';
                            $.each(urlArray, function (i, v) {

                                console.log('upload - urlArray - v: ', v);
                                liHtml += '<li><a><img src="' + v + '" data-image  onerror="this.src=\'../../images/upload-icons/' + uploadIcon + '.png\';this.onerror=null"></a><small class="uploads-delete-tip bg-red badge" data-upload-delete="' + uploadName + '" data-upload-url="' + v + '" data-upload-sign="' + uploadSign + '">×</small></li>\n';
                            });
                            parant.after('<ul id="bing-' + uploadName + '" class="layui-input-block layuimini-upload-show">\n' + liHtml + '</ul>');
                        }

                    });

                    // 非空初始化图片显示
                    if ($(elem).val() !== '') {
                        $(elem).trigger("input");
                    }
                });

                // 监听上传文件的删除事件
                $('body').on('click', '[data-upload-delete]', function () {
                    var uploadName = $(this).attr('data-upload-delete'),
                        deleteUrl = $(this).attr('data-upload-url'),
                        sign = $(this).attr('data-upload-sign');
                    var confirm = main.layui.confirm('确定删除？', function () {
                        var elem = "input[name='" + uploadName + "']";
                        var currentUrl = $(elem).val();
                        var url = '';
                        if (currentUrl !== deleteUrl) {
                            url = currentUrl.search(deleteUrl) === 0 ? currentUrl.replace(deleteUrl + sign, '') : currentUrl.replace(sign + deleteUrl, '');
                            $(elem).val(url);
                            $(elem).trigger("input");
                        } else {
                            $(elem).val(url);
                            $('#bing-' + uploadName).remove();
                        }
                        main.layui.close(confirm);
                    });
                    return false;
                });
            }
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
                    main.ws.send('login', main.api.getQueryVariable('account'));
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
                main.api.setConnectState();
                main.api.consoleLog('WebSocket: onopen success');

                // 检查是否登陆
                if (main.api.isLogin()) {

                    let pms = {
                        "name": main.api.getQueryVariable('name'),
                        "head": main.api.getQueryVariable('head'),
                        "pass": main.api.getQueryVariable('pass'),
                        "account": main.api.getQueryVariable('account'),
                    };

                    // 发送登陆请求
                    main.ws.send('login', pms);
                }

                return true;

            }, function (err, state) {

                main.api.setConnectState(1);
            });

            return false;
        },
        send: function (cmd, rs, callback) {// 发送信息

            if (!main.ws.getOnline()) {

                console.log('发送消息失败，已断开连接:', cmd);
                return;
            }

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

            main.config.heart.reconnect_num++;
            main.config.heart.lockReconnect = true;

            // 断线重连10，停止
            if (main.config.heart.reconnect_num > 10) {

                alert('连接服务器失败，请稍后重试');

                // 关闭所有Loading
                main.layui.init('layer').closeAll('loading');

                $('.app-container').addClass('hide');

                // 显示404页面
                $('.app-container-404').removeClass('hide');
                return false;
            }

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
        },
        getOnline: function () {// 获取状态
            // 在线状态
            return (main.ws.connect.readyState == 1);
        }
    },
    url: {// 地址
        hostUrl: function () {
            return main.config.ws_host;
        },
        url: function (url) {
            init.admin_url = init.admin_url || '';
            return url ? init.admin_url + '/' + main.url.suffix(url) : '';
            // return url ? '/' + init.admin_url + '/' + url : '';
        },
        suffix: function (url) {
            return url.indexOf('.html') == -1 ? url + '.html' : url;
        },
        cdnUrl: function (url) {
            return main.config.cdn_host + '/' + url;
        }
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

            if (main.api.getQueryVariable('account')) {

                return true;
            }

            return false;
        },
        randAccount: function (e) {

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

            var idx = 1;

            // 获取当前页面的所有框架
            var frames = document.getElementsByTagName("iframe");

            if (frames[idx] == 0 || frames[idx].contentWindow == undefined) {

                return false;
            }

            return callback(frames[idx].contentWindow);
        },
        setConnectState: function (state = 0) {

            let checked = (state == 0);
            $('#switchStatus').attr('checked', checked);

            // 头像颜色
            if (checked) {

                $('#userHead').removeClass('gray');
            } else {

                $('#userHead').addClass('gray');
            }
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
        checkAccount: function (str) {
            var re = /^[0-9a-zA-Z]*$/;  //判断字符串是否为数字和字母组合     
            if (!re.test(str)) {
                return false;
            } else {
                return true;
            }
        },
        checkPassWord: function (nubmer) {
            var re = /^[0-9a-zA-Z]*$/;  //判断字符串是否为数字和字母组合     
            if (!re.test(nubmer)) {
                return false;
            } else {
                return true;
            }
        }
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

            if (!mm) {

                return layui;
            }

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
                                // if (main.checkAuth(operat.auth, elem)) {
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
                                // if (main.checkAuth(operat.auth, elem)) {
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
                            // if (main.checkAuth(operat.auth, elem)) {
                            html += main.layui.table.buildOperatHtml(operat);
                            // }
                        });
                    }
                });
                return html;
            },
            image: function (data, option) {
                option.imageWidth = option.imageWidth || 60;
                option.imageHeight = option.imageHeight || 60;
                option.imageSplit = option.imageSplit || '|';
                option.imageJoin = option.imageJoin || '<br>';
                option.title = option.title || option.field;
                var field = option.field,
                    title = data[option.title];
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    var value = undefined;
                }

                if (data.file_ext == 'json') {
                    value = BASE_URL + 'index/images/upload-icons/json.png';
                }

                if (value === undefined || value === null) {
                    return '<img style="width: ' + option.imageWidth + 'px; height: ' + option.imageHeight + 'px;border-radius: 50%;-o-object-fit: cover;object-fit: cover;" src="' + value + '" data-image="' + title + '">';
                } else {
                    var values = value.split(option.imageSplit),
                        valuesHtml = [];
                    values.forEach((value, index) => {
                        valuesHtml.push('<img style="width: ' + option.imageWidth + 'px; height: ' + option.imageHeight + 'px;border-radius: 50%;-o-object-fit: cover;object-fit: cover;" src="' + value + '" data-image="' + title + '">');
                    });
                    return valuesHtml.join(option.imageJoin);
                }
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
                offset: 't',
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
                audioElementHovertree.setAttribute('src', './music/' + file_name + '.mp3');
                main.audio.music[file_name] = audioElementHovertree;
            });

        }
    },
    request: {
        config: {
            is_loading: true,
        },
        post: function (option, ok, no, ex) {
            return main.request.ajax('post', option, ok, no, ex);
        },
        get: function (option, ok, no, ex) {
            return main.request.ajax('get', option, ok, no, ex);
        },
        ajax: function (type, option, ok, no, ex) {
            type = type || 'get';
            option.url = option.url || '';
            option.data = option.data || {};
            option.prefix = option.prefix || false;
            option.loading = option.loading || true;
            option.statusName = option.statusName || 'code';
            option.statusCode = option.statusCode || 1;
            ok = ok || function (res) {
                var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                main.layui.success(msg);
                return false;
            };
            no = no || function (res) {
                var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                main.layui.alert(msg);
                // main.layui.error(msg);
                return false;
            };
            ex = ex || function (xhr, res) {
                var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                main.layui.alert('Status:' + xhr.status + '，' + xhr.statusText + ' 请稍后再试！<br/>' + $.parseJSON(xhr.responseText));
            };
            if (option.url == '') {
                main.layui.error('请求地址不能为空');
                return false;
            }
            if (option.prefix == true) {
                option.url = main.url(option.url);
            }
            var index = option.loading ? main.layui.loading('加载中') : '';
            $.ajax({
                url: option.url,
                type: type,
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                dataType: "json",
                data: option.data,
                timeout: 60000000,
                success: function (res) {
                    main.layui.close(index);
                    // if (eval('res.' + option.statusName) == option.statusCode) {
                    //     return ok(res);
                    // } else {
                    //     return no(res);
                    // }

                    if (res.code == 0) {
                        return ok(res);
                    } else {
                        return no(res);
                    }
                },
                error: function (xhr, textstatus, thrown) {
                    // main.layui.alert('Status:' + xhr.status + '，' + xhr.statusText + ' 请稍后再试！<br/>' + xhr.responseText, function () {
                    //     ex(this);
                    // });
                    return ex(xhr, this);
                }
            });
        },
        ajaxFileData: function (option, ok, no, ex) {
            option.url = option.url || main.url.cdnUrl('upload');
            option.data = option.data || {};
            option.prefix = option.prefix || false;
            option.loading = option.loading || true;
            option.statusName = option.statusName || 'code';
            option.statusCode = option.statusCode || 1;
            ok = ok || function (res) {
                var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                main.layui.success(msg);
                return false;
            };
            no = no || function (res) {
                var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                main.layui.alert(msg);
                // main.layui.error(msg);
                return false;
            };
            ex = ex || function (xhr, res) {
                var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                main.layui.alert('Status:' + xhr.status + '，' + xhr.statusText + ' 请稍后再试！<br/>' + $.parseJSON(xhr.responseText));
            };

            var formData = new FormData();
            formData.append('file', option.data);

            var index = option.loading ? main.layui.loading('加载中') : '';

            $.ajax({
                url: option.url,
                type: 'post',
                dataType: "json",
                data: formData,
                cache: false,
                timeout: 60000000,
                processData: false,
                contentType: false,
                success: function (res) {
                    main.layui.close(index);

                    if (res.code == 0) {
                        return ok(res);
                    } else {
                        return no(res);
                    }
                },
                error: function (xhr, textstatus, thrown) {
                    main.layui.close(index);
                    return ex(xhr, this);
                }
            });
        },
    },
};

