layui.define(['layer', 'table'], function (exports) {
    var $ = layui.jquery;
    var layer = layui.layer;
    var table = layui.table;

    var treetable = {
        config: {
            switch_confirm: false,
            search_pms: []
        },
        // 渲染树形表格
        render: function (param) {
            param.homdPid =  param.homdPid || -1;
            // 检查参数
            if (!treetable.checkParam(param)) {
                return;
            }
            // 获取数据
            if (param.data) {
                treetable.init(param, param.data);
            } else {
                $.getJSON(param.url, param.where, function (res) {
                    treetable.init(param, res.data);
                });
            }
        },
        // 渲染表格
        init: function (param, data) {
            var mData = [];
            var doneCallback = param.done;
            var tNodes = data;
            // 补上id和pid字段
            for (var i = 0; i < tNodes.length; i++) {
                var tt = tNodes[i];
                if (!tt.id) {
                    if (!param.treeIdName) {
                        layer.msg('参数treeIdName不能为空', {icon: 5});
                        return;
                    }
                    tt.id = tt[param.treeIdName];
                }
                if (!tt.pid) {
                    if (!param.treePidName) {
                        layer.msg('参数treePidName不能为空', {icon: 5});
                        return;
                    }
                    tt.pid = tt[param.treePidName];
                }
                if(tt.pid == param.homdPid){
                    mData.push(tt);
                }
            }

            // 对数据进行排序
            var sort = function (s_pid, data) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].pid == s_pid) {
                        var len = mData.length;
                        if (len > 0 && mData[len - 1].id == s_pid) {
                            mData[len - 1].isParent = true;
                        }
                        mData.push(data[i]);
                        sort(data[i].id, data);
                    }
                }
            };
            sort(param.treeSpid, tNodes);

            // 重写参数
            param.url = undefined;
            param.data = mData;
            param.page = {
                count: param.data.length,
                limit: param.data.length
            };
            param.layFilter = param.id + '_LayFilter';

            // 初始化表格lay-filter
            $(param.elem).attr('lay-filter', param.layFilter);

            param.cols[0][param.treeColIndex].templet = function (d) {
                var mId = d.id;
                var mPid = d.pid;
                var isDir = d.isParent;
                var emptyNum = treetable.getEmptyNum(mPid, mData, param.indent);
                var iconHtml = '';
                for (var i = 0; i < emptyNum; i++) {
                    iconHtml += '<span class="treeTable-empty"></span>';
                }
                if (isDir) {
                    iconHtml += '<i class="layui-icon layui-icon-triangle-d"></i> <i class="layui-icon layui-icon-layer"></i>';
                } else {
                    iconHtml += '<i class="layui-icon layui-icon-file"></i>';
                }
                iconHtml += '&nbsp;&nbsp;';
                var ttype = isDir ? 'dir' : 'file';
                var vg = '<span class="treeTable-icon open" lay-tid="' + mId + '" lay-tpid="' + mPid + '" lay-ttype="' + ttype + '">';
                return vg + iconHtml + d[param.cols[0][param.treeColIndex].field] + '</span>'
            };

            param.done = function (res, curr, count) {
                $(param.elem).next().addClass('treeTable');
                $('.treeTable .layui-table-page').css('display', 'none');
                $(param.elem).next().attr('treeLinkage', param.treeLinkage);
                // 绑定事件换成对body绑定
                /*$('.treeTable .treeTable-icon').click(function () {
                    treetable.toggleRows($(this), param.treeLinkage);
                });*/
                if (param.treeDefaultClose) {
                    treetable.foldAll(param.elem);
                }
                if (doneCallback) {
                    doneCallback(res, curr, count);
                }
            };

            // 初始化表格右上方工具栏
            param.defaultToolbar = treetable.renderDefaultToolbar(param);

            // 渲染表格
            table.render(param);
        },
        renderDefaultToolbar: function (param) {
            if (param.defaultToolbar == false) {
                setTimeout(function () {
                    $('.layui-table-tool').addClass('layui-hide');
                }, 50);
                return false;
            }

            // 获取默认的工具
            let defaultToolbar = param.defaultToolbar || ['filter', 'print'];

            // 判断是否为移动端
            // if (treetable.checkMobile()) {

            //     // 去除打印功能
            //     defaultToolbar.remove( 'print' );
            // }

            // 判断是否开启导出
            if (param.export_url) {

                // 开启导出功能
                defaultToolbar.push({
                    title: '导出',
                    layEvent: 'TABLE_EXPORT',
                    icon: 'layui-icon-export',
                    extend: 'data-url="' + param.export_url + '"'
                });
            }

            // 判断是否开启导入
            if (param.import_url) {

                // 开启导出功能
                defaultToolbar.push({
                    title: '导入',
                    layEvent: 'TABLE_IMPORT',
                    icon: 'layui-icon-import',
                    extend: 'data-upload="file_url" data-upload-url="'+param.import_url+'" data-upload-exts="xlsx" data-upload-number="one" data-upload-refresh="'+param.id+'"'
                });
            }

            // 判断是否开启搜索
            if (param.search) {

                // 开启搜索功能
                defaultToolbar.push({
                    title: '搜索',
                    layEvent: 'TABLE_SEARCH',
                    icon: 'layui-icon-search',
                    extend: 'data-table-id="' + param.id + '"'
                });

                // // 初始化表格搜索
                // treetable.table.renderSearch(param.cols, param.elem, param.id);
                // if (param.open_search === true) {
                //     // 打开搜索框
                //     treetable.table.switchToolbar(param.id);
                // }
            }

            treetable.listenToolbar(param.layFilter, param.id);

            return defaultToolbar;
        },
        listenToolbar: function (layFilter, tableId) {
            table.on('toolbar(' + layFilter + ')', function (obj) {
                // 搜索表单的显示
                switch (obj.event) {
                    // 搜索
                    case 'TABLE_SEARCH':
                        // treetable.table.switchToolbar(tableId);
                    break;
                    
                    // 导出
                    case 'TABLE_EXPORT':
                        let url = $(this).attr('data-url');
                        if (!url) {
                            return false;
                        }
                        let index = treetable.msg.confirm('根据查询进行导出，确定导出？', function () {
                            let search_pms = treetable.config.search_pms;
                            if (typeof search_pms.filter == 'string') {
                                url += '?filter=' + search_pms.filter;
                                url += '&op=' + search_pms.op;
                            }
                            window.location = treetable.url(url);
                            layer.close(index);
                        });
                    break;
                }
            });
        },
        // 计算缩进的数量
        getEmptyNum: function (pid, data, indent) {
            var num = 0;
            if (!pid) {
                return num;
            }
            var tPid;
            for (var i = 0; i < data.length; i++) {
                if (pid == data[i].id) {
                    num += indent || 1;
                    tPid = data[i].pid;
                    break;
                }
            }
            return num + treetable.getEmptyNum(tPid, data, indent);
        },
        // 展开/折叠行
        toggleRows: function ($dom, linkage) {
            var type = $dom.attr('lay-ttype');
            if ('file' == type) {
                return;
            }
            var mId = $dom.attr('lay-tid');
            var isOpen = $dom.hasClass('open');
            if (isOpen) {
                $dom.removeClass('open');
            } else {
                $dom.addClass('open');
            }
            $dom.closest('tbody').find('tr').each(function () {
                var $ti = $(this).find('.treeTable-icon');
                var pid = $ti.attr('lay-tpid');
                var ttype = $ti.attr('lay-ttype');
                var tOpen = $ti.hasClass('open');
                if (mId == pid) {
                    if (isOpen) {
                        $(this).hide();
                        if ('dir' == ttype && tOpen == isOpen) {
                            $ti.trigger('click');
                        }
                    } else {
                        $(this).show();
                        if (linkage && 'dir' == ttype && tOpen == isOpen) {
                            $ti.trigger('click');
                        }
                    }
                }
            });
        },
        // 检查参数
        checkParam: function (param) {
            if (!param.treeSpid && param.treeSpid != 0) {
                layer.msg('参数treeSpid不能为空', {icon: 5});
                return false;
            }

            if (!param.treeColIndex && param.treeColIndex != 0) {
                layer.msg('参数treeColIndex不能为空', {icon: 5});
                return false;
            }
            return true;
        },
        // 展开所有
        expandAll: function (dom) {
            $(dom).next('.treeTable').find('.layui-table-body tbody tr').each(function () {
                var $ti = $(this).find('.treeTable-icon');
                var ttype = $ti.attr('lay-ttype');
                var tOpen = $ti.hasClass('open');
                if ('dir' == ttype && !tOpen) {
                    $ti.trigger('click');
                }
            });
        },
        // 折叠所有
        foldAll: function (dom) {
            $(dom).next('.treeTable').find('.layui-table-body tbody tr').each(function () {
                var $ti = $(this).find('.treeTable-icon');
                var ttype = $ti.attr('lay-ttype');
                var tOpen = $ti.hasClass('open');
                if ('dir' == ttype && tOpen) {
                    $ti.trigger('click');
                }
            });
        },
        msg: {
            config: {
                anim: 0,
                time: 3800,
                skin: 'layui-layer-setmybg',
                shade: [0.8, '#393D49'], // 透明度  颜色
            },
            // 成功消息
            success: function (msg, callback) {
                if (callback === undefined) {
                    callback = function () {
                    }
                }

                if (!msg) {
                    treetable.msg.error('消息提示标题不能为空[msg]');
                    return false;
                }
                var index = layer.msg(msg, {icon: 1, shade: treetable.config.shade, scrollbar: false, time: 2000, shadeClose: true}, callback);
                return index;
            },
            // 失败消息
            error: function (msg, callback) {
                if (callback === undefined) {
                    callback = function () {
                    }
                }

                if (!msg) {
                    treetable.msg.error('消息提示标题不能为空[msg]');
                    return false;
                }
                let icon  = treetable.msg.config.icon ? treetable.msg.config.icon : 2;
                var index = layer.msg(msg, {icon: icon, anim: treetable.msg.config.anim, shade: treetable.config.shade, scrollbar: false, time: 3500, shadeClose: true}, callback);
                return index;
            },
            // 警告消息框
            alert: function (msg, callback, anim = 6) {
                if (!msg) {
                    treetable.msg.error('消息提示标题不能为空[msg]');
                    return false;
                }

                // 自定义警告消息框
                var index = layer.msg( msg, {
                    btn: '确认',
                    end: callback,
					area: '420px',
                    anim: anim,
					time: 30000000, // 30分钟后自动关闭
					skin: treetable.msg.config.skin,
					shade: treetable.msg.config.shade,
					// offset: 't',
				});
                // var index = layer.alert(msg, {end: callback, scrollbar: false});
                return index;
            },
            // 对话框
            confirm: function (msg, ok, no) {
                if (!msg) {
                    treetable.msg.error('消息提示标题不能为空[msg]');
                    return false;
                }

                // 自定义对话框
                var msg_index = layer.msg(msg, {
                    btn: ['确认', '取消'],
                    time: 3000000, // 30s后自动关闭
                    skin: treetable.msg.config.skin,
                    anim: treetable.msg.config.anim,
                    shade: treetable.msg.config.shade,
                    btnAlign: 'c',
                    yes: function() {
                        typeof ok === 'function' && ok.call(this);
                    },
                    btn2: function(index, layero){
                        typeof no === 'function' && no.call(this);
                    },
                    cancel: function(){ 
                        // 关闭了右上角关闭回调
                    }
                });
                // var index = layer.confirm(msg, {title: '操作确认', btn: ['确认', '取消']}, function () {
                //     typeof ok === 'function' && ok.call(this);
                // }, function () {
                //     typeof no === 'function' && no.call(this);
                //     self.close(index);
                // });
                return msg_index;
            },
            // 消息提示
            tips: function (msg, time, callback) {
                if (!msg) {
                    treetable.msg.error('消息提示标题不能为空[msg]');
                    return false;
                }
                var index = layer.msg(msg, {time: (time || 3) * 1000, shade: this.shade, end: callback, shadeClose: true});
                return index;
            },
            // 加载中提示
            loading: function (msg, callback) {
                var index = msg ? layer.msg(msg, {icon: 16, scrollbar: false, shade: this.shade, time: 0, end: callback}) : layer.load(2, {scrollbar: false, time: 0, offset: ['40%', '49%'], shade: [0.8, '#f5f5f5'], end: callback});
                return index;
            },
            // 关闭消息框
            close: function (index) {
                return layer.close(index);
            }
        },
        url: function (url) {
            return url ? '/' + CONFIG.ADMIN + '/' + url : '';
        },
    };

    // layui.link(layui.cache.base + '/treetable-lay/treetable.css');

    // 给图标列绑定事件
    $('body').on('click', '.treeTable .treeTable-icon', function () {
        var treeLinkage = $(this).parents('.treeTable').attr('treeLinkage');
        if ('true' == treeLinkage) {
            treetable.toggleRows($(this), true);
        } else {
            treetable.toggleRows($(this), false);
        }
    });

    exports('treetable', treetable);
});
