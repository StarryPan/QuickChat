define(["jquery", "tableSelect", "ckeditor", "vue"], function ($, tableSelect, undefined, vue) {

    var form = layui.form,
        layer = layui.layer,
        table = layui.table,
        laydate = layui.laydate,
        upload = layui.upload,
        element = layui.element,
        laytpl = layui.laytpl,
        tableSelect = layui.tableSelect;

    layer.config({
        skin: 'layui-layer-easy'
    });

    var init = {
        table_elem: '#currentTable',
        table_render_id: 'currentTableRenderId',
        upload_url: 'ajax/upload',
        upload_exts: 'doc|gif|ico|icon|jpg|mp3|mp4|p12|pem|png|rar',
    };

    var admin = {
        config: {
            shade: [0.02, '#000'],
            open_full: false,// 全窗口
            open_width: 800,// 窗口宽度
            open_height: 600,// 窗口高度
            listen_upload: true,// 监听上传事件
        },
        url: function (url) {
            return url ? '/' + CONFIG.ADMIN + '/' + url : '';
        },
        empty: function (data) {
            if (!data || data == 0 || data == 'null') {
                return true;
            }else if (typeof(data) == 'undefined') {
                return true;
            }else if (typeof(data) == 'object' && data.length == 0) {
                return true;
            }else {
                return false;
            }
        },
        checkAuth: function (node, elem) {
            if (CONFIG.IS_SUPER_ADMIN) {
                return true;
            }
            if ($(elem).attr('data-auth-' + node) === '1') {
                return true;
            } else {
                return false;
            }
        },
        parame: function (param, defaultParam) {
            return param !== undefined ? param : defaultParam;
        },
        request: {
            config: {
                is_loading: true,
            },
            post: function (option, ok, no, ex) {
                return admin.request.ajax('post', option, ok, no, ex);
            },
            get: function (option, ok, no, ex) {
                return admin.request.ajax('get', option, ok, no, ex);
            },
            ajax: function (type, option, ok, no, ex) {
                type = type || 'get';
                option.url = option.url || '';
                option.data = option.data || {};
                option.prefix = option.prefix || false;
                option.statusName = option.statusName || 'code';
                option.statusCode = option.statusCode || 1;
                ok = ok || function (res) {
                    var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                    admin.msg.success(msg);
                    return false;
                };
                no = no || function (res) {
                    var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                    admin.msg.alert(msg);
                    // admin.msg.error(msg);
                    return false;
                };
                ex = ex || function (xhr, res) {
                    var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                    admin.msg.alert('Status:' + xhr.status + '，' + xhr.statusText + ' 请稍后再试！<br/>' + $.parseJSON(xhr.responseText));
                };
                if (option.url == '') {
                    admin.msg.error('请求地址不能为空');
                    return false;
                }
                if (option.prefix == true) {
                    option.url = admin.url(option.url);
                }
                var index = admin.request.config.is_loading ? admin.msg.loading('加载中') : '';
                $.ajax({
                    url: option.url,
                    type: type,
                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                    dataType: "json",
                    data: option.data,
                    timeout: 60000000,
                    success: function (res) {
                        admin.msg.close(index);
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
                        // admin.msg.alert('Status:' + xhr.status + '，' + xhr.statusText + ' 请稍后再试！<br/>' + xhr.responseText, function () {
                        //     ex(this);
                        // });
                        return ex(xhr, this);
                    }
                });
            }
        },
        common: {
            parseNodeStr: function (node) {
                var array = node.split('/');
                $.each(array, function (key, val) {
                    if (key === 0) {
                        val = val.split('.');
                        $.each(val, function (i, v) {
                            val[i] = admin.common.humpToLine(v.replace(v[0], v[0].toLowerCase()));
                        });
                        val = val.join(".");
                        array[key] = val;
                    }
                });
                node = array.join("/");
                return node;
            },
            lineToHump: function (name) {
                return name.replace(/\_(\w)/g, function (all, letter) {
                    return letter.toUpperCase();
                });
            },
            humpToLine: function (name) {
                return name.replace(/([A-Z])/g, "_$1").toLowerCase();
            },
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
                    admin.msg.error('消息提示标题不能为空[msg]');
                    return false;
                }
                var index = layer.msg(msg, {icon: 1, shade: admin.config.shade, scrollbar: false, time: 2000, shadeClose: true}, callback);
                return index;
            },
            // 失败消息
            error: function (msg, callback) {
                if (callback === undefined) {
                    callback = function () {
                    }
                }

                if (!msg) {
                    admin.msg.error('消息提示标题不能为空[msg]');
                    return false;
                }
                let icon  = admin.msg.config.icon ? admin.msg.config.icon : 2;
                var index = layer.msg(msg, {icon: icon, anim: admin.msg.config.anim, shade: admin.config.shade, scrollbar: false, time: 3500, shadeClose: true}, callback);
                return index;
            },
            // 警告消息框
            alert: function (msg, callback, anim = 6) {
                if (!msg) {
                    admin.msg.error('消息提示标题不能为空[msg]');
                    return false;
                }

                // 自定义警告消息框
                var index = layer.msg( msg, {
                    btn: '确认',
                    end: callback,
					area: '420px',
                    anim: anim,
					time: 30000000, // 30分钟后自动关闭
					skin: admin.msg.config.skin,
					shade: admin.msg.config.shade,
					// offset: 't',
				});
                // var index = layer.alert(msg, {end: callback, scrollbar: false});
                return index;
            },
            // 对话框
            confirm: function (msg, ok, no) {
                if (!msg) {
                    admin.msg.error('消息提示标题不能为空[msg]');
                    return false;
                }

                // 自定义对话框
                var msg_index = layer.msg(msg, {
                    btn: ['确认', '取消'],
                    time: 3000000, // 30s后自动关闭
                    skin: admin.msg.config.skin,
                    anim: admin.msg.config.anim,
                    shade: admin.msg.config.shade,
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
                    admin.msg.error('消息提示标题不能为空[msg]');
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
        table: {
            config: {
                switch_confirm: false,
                search_pms: []
            },
            render: function (options) {
                options.init = options.init || init;
                options.modifyReload = admin.parame(options.modifyReload, true);
                options.elem = options.elem || options.init.table_elem;
                options.id = options.id || options.init.table_render_id;
                options.layFilter = options.id + '_LayFilter';
                options.url = options.url || admin.url(options.init.index_url);
                options.data = options.data || options.init.index_data;
                options.page = admin.parame(options.page, true);
                options.search = admin.parame(options.search, true);
                options.skin = options.skin || 'line';
                options.limit = options.limit || 15;
                options.limits = options.limits || [10, 15, 20, 25, 50, 100, 200, 300, 500, 1000, 2000];
                options.cols = options.cols || [];

                // 自定义参数 | 初始化
                options.open_search  = options.init.open_search || false;
                options.edit_confirm = options.edit_confirm || false;

                // 初始化表格lay-filter
                $(options.elem).attr('lay-filter', options.layFilter);

                // 判断元素对象是否有嵌套的
                options.cols = admin.table.formatCols(options.cols, options.init);

                // 判断是否有操作列表权限
                options.cols = admin.table.renderOperat(options.cols, options.elem);

                // 初始化表格左上方工具栏
                options.toolbar = options.toolbar || ['refresh', 'add', 'delete'];
                options.toolbar = admin.table.renderToolbar(options.toolbar, options.elem, options.id, options.init);

                // 初始化表格右上方工具栏
                options.defaultToolbar = admin.table.renderDefaultToolbar(options);

                // 初始化表格
                var newTable = table.render(options);

                // 监听表格搜索开关显示
                admin.table.listenToolbar(options.layFilter, options.id);

                // 监听表格开关切换
                admin.table.renderSwitch(options.cols, options.init, options.id, options.modifyReload);

                // 监听表格开关切换
                admin.table.listenEdit(options.init, options.layFilter, options.id, options.modifyReload);

                return newTable;
            },
            renderToolbar: function (data, elem, tableId, init) {
                data = data || [];
                var toolbarHtml = '';
                $.each(data, function (i, v) {
                    if (v === 'refresh') {
                        toolbarHtml += ' <button class="layui-btn layui-btn-sm layuimini-btn-primary" data-table-refresh="' + tableId + '"><i class="fa fa-refresh"></i> </button>\n';
                    } else if (v === 'add') {
                        if (admin.checkAuth('add', elem) && init.add_url) {
                            toolbarHtml += '<button class="layui-btn layui-btn-normal layui-btn-sm" data-open="' + init.add_url + '" data-title="添加"><i class="fa fa-plus"></i> 添加</button>\n';
                        }
                    } else if (v === 'delete') {
                        if (admin.checkAuth('delete', elem) && init.delete_url) {
                            let delete_name = init.delete_name || '';
                            toolbarHtml    += '<button class="layui-btn layui-btn-sm layui-btn-danger" data-url="' + init.delete_url + '" data-table-delete="' + tableId + '"><i class="fa fa-trash-o"></i> '+delete_name+'</button>\n';
                        }
                    } else if (v === 'freeze') {
                        if (admin.checkAuth('freeze', elem) && init.freeze_url) {
                            toolbarHtml += '<button class="layui-btn layui-btn-sm layui-btn-warm" data-url="' + init.freeze_url + '" data-table-freeze="' + tableId + '"><i class="fa fa-file-excel-o"></i> 冻结</button>\n';
                        }
                    } else if (typeof v === "object") {
                        $.each(v, function (ii, vv) {
                            vv.class = vv.class || '';
                            vv.icon = vv.icon || '';
                            vv.auth = vv.auth || '';
                            vv.url = vv.url || '';
                            vv.method = vv.method || 'open';
                            vv.title = vv.title || vv.text;
                            vv.text = vv.text || vv.title;
                            vv.extend = vv.extend || '';
                            vv.checkbox = vv.checkbox || false;
                            if (admin.checkAuth(vv.auth, elem)) {
                                toolbarHtml += admin.table.buildToolbarHtml(vv, tableId);
                            }
                        });
                    }
                });
                return '<div>' + toolbarHtml + '</div>';
            },
            renderDefaultToolbar: function (options) {
                if (options.defaultToolbar == false) {
                    setTimeout(function () {
                        $('.layui-table-tool').addClass('layui-hide');
                    }, 50);
                    return false;
                }

                // 获取默认的工具
                let defaultToolbar = options.defaultToolbar || ['filter', 'print'];

                // 判断是否为移动端
                if (admin.checkMobile()) {

                    // 去除打印功能
                    defaultToolbar.remove( 'print' );
                }

                // 判断是否开启导出
                if (options.init.export_url) {

                    // 开启导出功能
                    defaultToolbar.push({
                        title: '导出',
                        layEvent: 'TABLE_EXPORT',
                        icon: 'layui-icon-export',
                        extend: 'data-url="' + options.init.export_url + '"'
                    });
                }

                // 判断是否开启导入
                if (options.init.import_url) {

                    // 开启导入功能
                    defaultToolbar.push({
                        title: '导入',
                        layEvent: 'TABLE_IMPORT',
                        icon: 'layui-icon-import',
                        extend: 'data-upload="file_url" data-upload-url="'+options.init.import_url+'" data-upload-exts="xlsx" data-upload-number="one" data-upload-refresh="'+options.id+'"'
                    });
                }

                // 判断是否开启搜索
                if (options.search) {

                    // 开启搜索功能
                    defaultToolbar.push({
                        title: '搜索',
                        layEvent: 'TABLE_SEARCH',
                        icon: 'layui-icon-search',
                        extend: 'data-table-id="' + options.id + '"'
                    });

                    // 初始化表格搜索
                    admin.table.renderSearch(options.cols, options.elem, options.id);
                    if (options.open_search === true) {
                        // 打开搜索框
                        admin.table.switchToolbar(options.id);
                    }
                }

                return defaultToolbar;
            },
            renderSearch: function (cols, elem, tableId) {
                // TODO 只初始化第一个table搜索字段，如果存在多个(绝少数需求)，得自己去扩展
                cols = cols[0] || {};
                var newCols = [];
                var formHtml = '';
                $.each(cols, function (i, d) {
                    d.field = d.field || false;
                    d.title = d.title || d.field || '';
                    let titleTip = d.title;
                    if (titleTip != '') {
                        let tip_arr = titleTip.split('<br/>');
                        titleTip = tip_arr[0];
                    }
                    d.fieldAlias = admin.parame(d.fieldAlias, d.field);
                    d.selectList = d.selectList || {};
                    d.search = admin.parame(d.search, true);
                    d.searchTip = d.searchTip || '请输入' + titleTip || '';
                    d.searchValue = d.searchValue || '';
                    d.searchOp = d.searchOp || '%*%';
                    d.timeType = d.timeType || 'datetime';
                    d.selectDef = d.selectDef || '- 全部 -';
                    if (d.field !== false && d.search !== false) {
                        switch (d.search) {
                            case true:
                                formHtml += '\t<div class="layui-form-item layui-inline">\n' +
                                    '<label class="layui-form-label">' + d.title + '</label>\n' +
                                    '<div class="layui-input-inline">\n' +
                                    '<input id="c-' + d.fieldAlias + '" name="' + d.fieldAlias + '" data-search-op="' + d.searchOp + '" value="' + d.searchValue + '" placeholder="' + d.searchTip + '" class="layui-input">\n' +
                                    '</div>\n' +
                                    '</div>';
                                break;
                            case  'select':
                                d.searchOp = '=';
                                var selectHtml = '';
                                $.each(d.selectList, function (sI, sV) {
                                    var selected = '';
                                    if (sI === d.searchValue) {
                                        selected = 'selected=""';
                                    }
                                    selectHtml += '<option value="' + sI + '" ' + selected + '>' + sV + '</option>/n';
                                });
                                formHtml += '\t<div class="layui-form-item layui-inline">\n' +
                                    '<label class="layui-form-label">' + d.title + '</label>\n' +
                                    '<div class="layui-input-inline">\n' +
                                    '<select class="layui-select" id="c-' + d.fieldAlias + '" name="' + d.fieldAlias + '"  data-search-op="' + d.searchOp + '" lay-search="">\n' +
                                    '<option value="">' + d.selectDef + '</option> \n' +
                                    selectHtml +
                                    '</select>\n' +
                                    '</div>\n' +
                                    '</div>';
                                break;
                            case 'range':
                                d.searchOp = 'range';
                                formHtml += '\t<div class="layui-form-item layui-inline">\n' +
                                    '<label class="layui-form-label">' + d.title + '</label>\n' +
                                    '<div class="layui-input-inline">\n' +
                                    '<input id="c-' + d.fieldAlias + '" name="' + d.fieldAlias + '"  data-search-op="' + d.searchOp + '"  value="' + d.searchValue + '" placeholder="' + d.searchTip + '" class="layui-input" autocomplete="off">\n' +
                                    '</div>\n' +
                                    '</div>';
                                break;
                            case 'time':
                                d.searchOp = '=';
                                formHtml += '\t<div class="layui-form-item layui-inline">\n' +
                                    '<label class="layui-form-label">' + d.title + '</label>\n' +
                                    '<div class="layui-input-inline">\n' +
                                    '<input id="c-' + d.fieldAlias + '" name="' + d.fieldAlias + '"  data-search-op="' + d.searchOp + '"  value="' + d.searchValue + '" placeholder="' + d.searchTip + '" class="layui-input" autocomplete="off">\n' +
                                    '</div>\n' +
                                    '</div>';
                                break;
                            case 'hidden':
                                formHtml += '<input type="hidden" id="c-' + d.fieldAlias + '" name="' + d.fieldAlias + '" data-search-op="' + d.searchOp + '" value="' + d.searchValue + '" placeholder="' + d.searchTip + '" class="layui-input">\n' ;
                                break;
                        }
                        newCols.push(d);
                    }
                });
                if (formHtml !== '') {

                    $(elem).before('<fieldset id="searchFieldset_' + tableId + '" class="table-search-fieldset layui-hide">\n' +
                        '<legend>条件搜索</legend>\n' +
                        '<form class="layui-form layui-form-pane form-search">\n' +
                        formHtml +
                        '<div class="layui-form-item layui-inline" style="margin-left: 115px">\n' +
                        '<button type="submit" class="layui-btn layui-btn-normal" data-type="tableSearch" data-table="' + tableId + '" lay-submit lay-filter="' + tableId + '_filter"> 搜 索</button>\n' +
                        '<button type="reset" class="layui-btn layui-btn-primary" data-table-reset="' + tableId + '"> 重 置 </button>\n' +
                        ' </div>' +
                        '</form>' +
                        '</fieldset>');

                    // 收索的ID
                    let fieldset_id = '#searchFieldset_' + tableId;

                    // 监听表格收索事件
                    admin.table.listenTableSearch(tableId);

                    // 初始化form表单
                    form.render();

                    $.each(newCols, function (ncI, ncV) {
                        if (ncV.search === 'range') {
                            laydate.render({range: true, type: ncV.timeType, elem: fieldset_id + ' [name="' + ncV.field + '"]'});
                            // laydate.render({range: true, type: ncV.timeType, elem: '[name="' + ncV.field + '"]'});
                        }
                        if (ncV.search === 'time') {
                            laydate.render({type: ncV.timeType, elem: fieldset_id + ' [name="' + ncV.field + '"]'});
                            // laydate.render({type: ncV.timeType, elem: '[name="' + ncV.field + '"]'});
                        }
                    });
                }
            },
            renderSwitch: function (cols, tableInit, tableId, modifyReload) {
                tableInit.modify_url = tableInit.modify_url || false;
                cols = cols[0] || {};
                tableId = tableId || init.table_render_id;
                if (cols.length > 0) {
                    $.each(cols, function (i, v) {
                        v.filter = v.filter || false;
                        if (v.filter !== false && tableInit.modify_url !== false) {
                            v.clickBack = v.clickBack || false;
                            admin.table.listenSwitch({filter: v.filter, url: tableInit.modify_url, tableId: tableId, modifyReload: modifyReload}, v.clickBack);
                        }
                    });
                }
            },
            renderOperat(data, elem) {
                for (dk in data) {
                    var col = data[dk];
                    var operat = col[col.length - 1].operat;
                    if (operat !== undefined) {
                        var check = false;
                        for (key in operat) {
                            var item = operat[key];
                            if (typeof item === 'string') {
                                if (admin.checkAuth(item, elem)) {
                                    check = true;
                                    break;
                                }
                            } else {
                                for (k in item) {
                                    var v = item[k];
                                    if (v.auth !== undefined && admin.checkAuth(v.auth, elem)) {
                                        check = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (!check) {
                            data[dk].pop()
                        }
                    }
                }
                return data;
            },
            buildToolbarHtml: function (toolbar, tableId) {
                var html = '';
                toolbar.class = toolbar.class || '';
                toolbar.icon = toolbar.icon || '';
                toolbar.auth = toolbar.auth || '';
                toolbar.url = toolbar.url || '';
                toolbar.extend = toolbar.extend || '';
                toolbar.method = toolbar.method || 'open';
                toolbar.field = toolbar.field || 'id';
                toolbar.title = toolbar.title || toolbar.text;
                toolbar.text = toolbar.text || toolbar.title;
                toolbar.checkbox = toolbar.checkbox || false;

                var formatToolbar = toolbar;
                formatToolbar.icon = formatToolbar.icon !== '' ? '<i class="' + formatToolbar.icon + '"></i> ' : '';
                formatToolbar.class = formatToolbar.class !== '' ? 'class="' + formatToolbar.class + '" ' : '';
                if (toolbar.method === 'open') {
                    formatToolbar.method = formatToolbar.method !== '' ? 'data-open="' + formatToolbar.url + '" data-title="' + formatToolbar.title + '" ' : '';
                } else {
                    formatToolbar.method = formatToolbar.method !== '' ? 'data-request="' + formatToolbar.url + '" data-title="' + formatToolbar.title + '" ' : '';
                }
                formatToolbar.checkbox = toolbar.checkbox ? ' data-checkbox="true" ' : '';
                formatToolbar.tableId = tableId !== undefined ? ' data-table="' + tableId + '" ' : '';
                html = '<button ' + formatToolbar.class + formatToolbar.method + formatToolbar.extend + formatToolbar.checkbox +  formatToolbar.tableId + '>' + formatToolbar.icon + formatToolbar.text + '</button>';

                return html;
            },
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
                url = url.indexOf("?") !== -1 ? url + '&' + field + '=' + data[field] : url + '?' + field + '=' + data[field];
                return url;
            },
            formatCols: function (cols, init) {
                for (i in cols) {
                    var col = cols[i];
                    for (index in col) {
                        var val = col[index];

                        // 判断是否包含初始化数据
                        if (val.init === undefined) {
                            cols[i][index]['init'] = init;
                        }

                        // 格式化列操作栏
                        if (val.templet === admin.table.tool && val.operat === undefined) {
                            cols[i][index]['operat'] = ['edit', 'delete'];
                        }

                        // 判断是否包含开关组件
                        if (val.templet === admin.table.switch && val.filter === undefined) {
                            cols[i][index]['filter'] = val.field;
                        }

                        // 判断是否含有搜索下拉列表
                        if (val.selectList !== undefined && val.search === undefined) {
                            cols[i][index]['search'] = 'select';
                        }

                        // 判断是否初始化对齐方式
                        if (val.align === undefined) {
                            cols[i][index]['align'] = 'center';
                        }

                        // 部分字段开启排序
                        var sortDefaultFields = ['id', 'sort'];
                        if (val.sort === undefined && sortDefaultFields.indexOf(val.field) >= 0) {
                            cols[i][index]['sort'] = true;
                        }

                        // 初始化图片高度
                        if (val.templet === admin.table.image && val.imageHeight === undefined) {
                            cols[i][index]['imageHeight'] = 40;
                        }

                        // 判断是否多层对象
                        if (val.field !== undefined && val.field.split(".").length > 1) {
                            if (val.templet === undefined) {
                                cols[i][index]['templet'] = admin.table.value;
                            }
                        }

                        // 判断是否列表数据转换
                        if (val.selectList !== undefined && val.templet === undefined) {
                            cols[i][index]['templet'] = admin.table.list;
                        }

                    }
                }
                return cols;
            },
            tool: function (data, option) {
                option.operat = option.operat || ['edit', 'delete'];
                var elem = option.init.table_elem || init.table_elem;
                var html = '';
                $.each(option.operat, function (i, item) {
                    if (typeof item === 'string') {
                        switch (item) {
                            case 'edit':
                                var operat = {
                                    class: 'layui-btn layui-btn-success layui-btn-xs',
                                    method: 'open',
                                    field: 'id',
                                    icon: '',
                                    text: '编辑',
                                    title: '编辑信息',
                                    auth: 'edit',
                                    url: option.init.edit_url,
                                    extend: ""
                                };
                                operat.url = admin.table.toolSpliceUrl(operat.url, operat.field, data);
                                if (admin.checkAuth(operat.auth, elem)) {
                                    html += admin.table.buildOperatHtml(operat);
                                }
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
                                operat.url = admin.table.toolSpliceUrl(operat.url, operat.field, data);
                                if (admin.checkAuth(operat.auth, elem)) {
                                    html += admin.table.buildOperatHtml(operat);
                                }
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
                            operat.url = admin.table.toolSpliceUrl(operat.url, operat.field, data);
                            if (admin.checkAuth(operat.auth, elem)) {
                                html += admin.table.buildOperatHtml(operat);
                            }
                        });
                    }
                });
                return html;
            },
            list: function (data, option) {
                option.selectList = option.selectList || {};
                var field = option.field;
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    var value = undefined;
                }
                if (option.selectList[value] === undefined || option.selectList[value] === '' || option.selectList[value] === null) {
                    return value;
                } else {
                    return option.selectList[value];
                }
            },
            image: function (data, option) {
                option.imageWidth = option.imageWidth || 200;
                option.imageHeight = option.imageHeight || 40;
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

                if (value === undefined || value===null) {
                    return '<img style="max-width: ' + option.imageWidth + 'px; max-height: ' + option.imageHeight + 'px;" src="' + value + '" data-image="' + title + '">';
                } else {
                    var values = value.split(option.imageSplit),
                        valuesHtml = [];
                    values.forEach((value, index) => {
                        valuesHtml.push('<img style="max-width: ' + option.imageWidth + 'px; max-height: ' + option.imageHeight + 'px;" src="' + value + '" data-image="' + title + '">');
                    });
                    return valuesHtml.join(option.imageJoin);
                }
            },
            url: function (data, option) {
                var field = option.field;
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    var value = undefined;
                }
                return '<a class="layuimini-table-url" href="' + value + '" target="_blank" class="label bg-green">' + value + '</a>';
            },
            switch: function (data, option) {
                var field = option.field;
                option.filter = option.filter || option.field || null;
                option.checked = option.checked || 1;
                option.tips = option.tips || '开|关';
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    var value = undefined;
                }
                var checked = value === option.checked ? 'checked' : '';
                return laytpl('<input type="checkbox" name="' + option.field + '" value="' + data.id + '" lay-skin="switch" lay-text="' + option.tips + '" lay-filter="' + option.filter + '" ' + checked + ' >').render(data);
            },
            price: function (data, option) {
                var field = option.field;
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    var value = undefined;
                }
                return '<span>￥' + value + '</span>';
            },
            percent: function (data, option) {
                var field = option.field;
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    var value = undefined;
                }
                return '<span>' + value + '%</span>';
            },
            icon: function (data, option) {
                var field = option.field;
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    var value = undefined;
                }
                return '<i class="' + value + '"></i>';
            },
            text: function (data, option) {
                var field = option.field;
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    var value = undefined;
                }
                return '<span class="line-limit-length">' + value + '</span>';
            },
            value: function (data, option) {
                var field = option.field;
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    var value = undefined;
                }
                return '<span>' + value + '</span>';
            },
            rewards: function (data, option) {
                let cfgs = option.selectList || '';
                if (cfgs == '') {
                    return admin.msg.error('解析奖励失败，selectList不能为空！');
                }

                var field    = option.field;
                var rew_type = option.rew_type || 'item';
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    return admin.msg.error('解析奖励失败，'+e);
                }

                let rewHtml = '';

                switch (rew_type) {
                    case 'item':
                        $.each($.parseJSON(value), function (itemid, itemcnt) {
                    
                            if (cfgs[itemid] == undefined) {
                                
                                return true;
                            }
        
                            let cfg  = cfgs[itemid];
                            rewHtml += '<p>id: '+cfg.id+' | name: '+cfg.name+' | count: '+itemcnt+'</p><hr/>';
                        });
                    break;

                    case 'hero':
                        $.parseJSON(value).forEach(heroid => {
                            if (cfgs[heroid] == undefined) {
                                
                                return true;
                            }
        
                            let cfg    = cfgs[heroid];
                            let rarity = admin.table.rarityName(data, option);
                            rewHtml   += '<p>id: '+cfg.id+' | name: '+cfg.name+' | rarity: '+rarity+'</p><hr/>';
                        });
                    break;
                
                    default:
                        return admin.msg.error('未定义的类型 ['+rew_type+']');
                }

                return rewHtml.substr(0, rewHtml.length - 5);
            },
            rarityName: function (data, option) {

                var field    = option.field;
                var rew_type = option.rew_type || 'item';
                try {
                    var value = eval("data." + field);
                } catch (e) {
                    return admin.msg.error('解析奖励失败，'+e);
                }

                switch (value) {
                    case 2:
                        return 'R';
                    case 3:
                        return 'SR';
                    case 4:
                        return 'SSR';
                    default:
                        return 'N';
                }
            },
            listenEdit: function (tableInit, layFilter, tableId, modifyReload) {
                tableInit.modify_url = tableInit.modify_url || false;
                tableId = tableId || init.table_render_id;
                if (tableInit.modify_url !== false) {
                    table.on('edit(' + layFilter + ')', function (obj) {
                        var value = obj.value,
                            data = obj.data,
                            id = data.id,
                            field = obj.field;
                        var _data = {
                            id: id,
                            field: field,
                            value: value,
                        };

                        // 请求服务器，提交修改
                        let request_post = function(is_msg) {
                            admin.request.post({
                                url: tableInit.modify_url,
                                prefix: true,
                                data: _data,
                            }, function (res) {
                                if (is_msg) {
                                    admin.msg.success(res.msg, function () {
                                        if (modifyReload) {
                                            table.reload(tableId);
                                        }
                                    });
                                }else {
                                    if (modifyReload) {
                                        table.reload(tableId);
                                    }
                                }
                            }, function (res) {
                                admin.msg.error(res.msg, function () {
                                    table.reload(tableId);
                                });
                            }, function () {
                                table.reload(tableId);
                            });
                        };

                        // 判断修改是否需要确定
                        if ( tableInit.edit_confirm ) {

                            let edit_confirm = tableInit.edit_confirm;
                            // 确认弹框
                            admin.msg.confirm( edit_confirm.title, function(params){
                                
                                // 是否使用data
                                if (edit_confirm.is_data) {
                                    _data = data;
                                }

                                // 请求服务器，提交修改
                                request_post(edit_confirm.is_msg);
                                
                            }, function(err) {

                                table.reload(tableId);
                            });

                        }else {

                            // 请求服务器，提交修改
                            request_post();
                        }
                    });
                }
            },
            listenSwitch: function (option, ok) {
                option.filter = option.filter || '';
                option.url = option.url || '';
                option.field = option.field || option.filter || '';
                option.tableId = option.tableId || init.table_render_id;
                option.modifyReload = option.modifyReload || false;
                form.on('switch(' + option.filter + ')', function (obj) {
                    var checked = obj.elem.checked ? 1 : 0;
                    if (typeof ok === 'function') {
                        return ok({
                            id: obj.value,
                            checked: checked,
                        });
                    } else {

                        let request_post = function() {
                            let data = {
                                id: obj.value,
                                field: option.field,
                                value: checked,
                                server_id: $('#c-server_id').val()
                            };

                            admin.request.post({
                                url: option.url,
                                prefix: true,
                                data: data,
                            }, function (res) {
                                if (option.modifyReload) {
                                    table.reload(option.tableId);
                                }
                            }, function (res) {
                                admin.msg.error(res.msg, function () {
                                    table.reload(option.tableId);
                                });
                            }, function () {
                                table.reload(option.tableId);
                            });
                        };

                        // 检查是否确认弹框
                        if (admin.table.config.switch_confirm) {
                            let confirm_msg    = checked ? '恢复状态' : '冻结状态';
                            let switch_confirm = admin.table.config.switch_confirm;

                            // 确认弹框
                            admin.msg.confirm( switch_confirm.title + confirm_msg + '吗？', function(){
                                request_post();
                            }, function(err) {
                                table.reload(option.tableId);
                            });
                        }else {
                            request_post();
                        }
                        
                    }
                });
            },
            listenToolbar: function (layFilter, tableId) {
                table.on('toolbar(' + layFilter + ')', function (obj) {
                    // 搜索表单的显示
                    switch (obj.event) {
                        // 搜索
                        case 'TABLE_SEARCH':
                            admin.table.switchToolbar(tableId);
                        break;
                        
                        // 导出
                        case 'TABLE_EXPORT':
                            let url = $(this).attr('data-url');
                            if (!url) {
                                return false;
                            }
                            let index = admin.msg.confirm('根据查询进行导出，确定导出？', function () {
                                let search_pms = admin.table.config.search_pms;
                                if (typeof search_pms.filter == 'string') {
                                    url += '?filter=' + search_pms.filter;
                                    url += '&op=' + search_pms.op;
                                }
                                window.location = admin.url(url);
                                layer.close(index);
                            });
                        break;
                    }
                });
            },
            switchToolbar: function (tableId, isHide = false) {
                var searchFieldsetId = 'searchFieldset_' + tableId;
                var _that = $("#" + searchFieldsetId);
                if (isHide) {
                    _that.addClass('layui-hide');
                }else {
                    if (_that.hasClass("layui-hide")) {
                        _that.removeClass('layui-hide');
                    } else {
                        _that.addClass('layui-hide');
                    }
                }
            },
            listenTableSearch: function (tableId) {
                form.on('submit(' + tableId + '_filter)', function (data) {
                    var dataField = data.field;
                    var formatFilter = {},
                        formatOp = {};
                    $.each(dataField, function (key, val) {
                        if (val !== '') {
                            formatFilter[key] = val;
                            var op = $('#c-' + key).attr('data-search-op');
                            op = op || '%*%';
                            formatOp[key] = op;
                        }
                    });

                    admin.table.config.search_pms = {
                        filter: JSON.stringify(formatFilter),
                        op: JSON.stringify(formatOp)
                    };

                    table.reload(tableId, {
                        page: {
                            curr: 1
                        }, 
                        where: admin.table.config.search_pms
                    }, 'data');
                    return false;
                });
            },
        },
        browseTable: {
            render: function (options) {
                options.init = options.init || init;
                let elem   = options.elem || options.init.table_elem;
                let data   = options.data || options.init.index_data;
                let head   = options.head || options.init.index_head;

                let headHtml = '';

                if (head) {
                    head.forEach(element => {
                        headHtml += '<th width="'+(element.width || 0)+'">'+element.title+'</th>';
                    });
                    headHtml = '<tr>'+headHtml+'</tr>';
                }

                let contentHtml = '';

                data.forEach(element => {
                    contentHtml += '<tr>';
                    contentHtml += '<td width="'+(element.field_width || 0)+'">'+element.field+'</td>';
                    contentHtml += '<td width="'+(element.title_width || 0)+'">'+element.title+'</td>';
                    contentHtml += '<td width="'+(element.value_width || 0)+'">'+element.value+'</td>';
                    contentHtml += '</tr>';
                });

                if (!contentHtml) {
                    contentHtml += '<tr align="center">';
                    contentHtml += '<td colspan="3">无数据</td>';
                    contentHtml += '</tr>';
                }

                $(elem).html('<thead>'+headHtml+'</thead><tbody>'+contentHtml+'</tbody>');
            },
            clean: function (options) {
                options.init = options.init || init;
                let elem     = options.elem || options.init.table_elem;
                $(elem).html('');
            },
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
        open: function (title, url, width, height, isResize) {

            isResize = isResize === undefined ? true : isResize;
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
            if (admin.checkMobile() || width === undefined || height === undefined) {
                layer.full(index);
            }
            if (isResize) {
                $(window).on("resize", function () {
                    layer.full(index);
                })
            }
        },
        listen: function (preposeCallback, ok, no, ex) {

            // 监听表单是否为必填项
            admin.api.formRequired();

            // 监听表单提交事件
            admin.api.formSubmit(preposeCallback, ok, no, ex);

            // 初始化图片显示以及监听上传事件
            if (admin.config.listen_upload) {

                admin.api.upload();
            }

            // 监听富文本初始化
            admin.api.editor();

            // 监听下拉选择生成
            admin.api.select();

            // 监听时间控件生成
            admin.api.date();

            // 初始化layui表单
            form.render();

            // 表格修改
            $("body").on("mouseenter", ".table-edit-tips", function () {
                var openTips = layer.tips('点击行内容可以进行修改', $(this), {tips: [2, '#e74c3c'], time: 4000});
            });

            // 监听弹出层的打开
            $('body').on('click', '[data-open]', function () {

                var clienWidth = $(this).attr('data-width'),
                    clientHeight = $(this).attr('data-height'),
                    dataFull = $(this).attr('data-full'),
                    checkbox = $(this).attr('data-checkbox'),
                    url = $(this).attr('data-open'),
                    tableId = $(this).attr('data-table');

                if(checkbox === 'true'){
                    tableId = tableId || init.table_render_id;
                    var checkStatus = table.checkStatus(tableId),
                        data = checkStatus.data;
                    if (data.length <= 0) {
                        admin.msg.error('请勾选需要操作的数据');
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
                    if (width >= admin.config.open_width && height >= admin.config.open_height) {
                        clienWidth = admin.config.open_width + 'px';
                        clientHeight = admin.config.open_height + 'px';
                    } else {
                        clienWidth = '100%';
                        clientHeight = '100%';
                    }
                }

                // 全屏
                if (admin.config.open_full || dataFull === 'true') {
                    clienWidth = '100%';
                    clientHeight = '100%';
                }

                admin.open(
                    $(this).attr('data-title'),
                    admin.url(url),
                    clienWidth,
                    clientHeight,
                );
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
            
            // 放大一组图片
            $('body').on('click', '[data-images]', function () {
                var title = $(this).attr('data-images'),
                    // 从当前元素向上找layuimini-upload-show找到第一个后停止, 再找其所有子元素li
                    doms = $(this).closest(".layuimini-upload-show").children("li"),
                    // 被点击的图片地址
                    now_src = $(this).attr('src'),
                    alt = $(this).attr('alt'),
                    data = [];
                $.each(doms, function(key, value){
                    var src = $(value).find('img').attr('src');
                    if(src != now_src){
                        // 压入其他图片地址
                        data.push({
                            "alt": alt,
                            "pid": Math.random(),
                            "src": src,
                            "thumb": src
                        });
                    }else{
                        // 把当前图片插入到头部
                        data.unshift({
                            "alt": alt,
                            "pid": Math.random(),
                            "src": now_src,
                            "thumb": now_src
                        });
                    }
                });
                var photos = {
                    "title": title,
                    "id": Math.random(),
                    "data": data,
                };
                layer.photos({
                    photos: photos,
                    anim: 5
                });
                return false;
            });

            // 监听动态表格刷新
            $('body').on('click', '[data-table-refresh]', function () {
                var tableId = $(this).attr('data-table-refresh');
                if (tableId === undefined || tableId === '' || tableId == null) {
                    tableId = init.table_render_id;
                }
                table.reload(tableId);
            });

            // 监听搜索表格重置
            $('body').on('click', '[data-table-reset]', function () {
                var tableId = $(this).attr('data-table-reset');
                if (tableId === undefined || tableId === '' || tableId == null) {
                    tableId = init.table_render_id;
                }
                table.reload(tableId, {
                    page: {
                        curr: 1
                    }
                    , where: {
                        filter: '{}',
                        op: '{}'
                    }
                }, 'data');
            });

            // 监听请求
            $('body').on('click', '[data-request]', function () {
                var title = $(this).attr('data-title'),
                    url = $(this).attr('data-request'),
                    field = $(this).attr('data-field') || 'id',
                    close = $(this).attr('data-close') || false,
                    addons = $(this).attr('data-addons'),
                    direct = $(this).attr('data-direct'),
                    tableId = $(this).attr('data-table'),
                    checkbox = $(this).attr('data-checkbox');

                title = title || '确定进行该操作？';

                if (direct === 'true') {
                    admin.msg.confirm(title, function () {
                        window.location.href = url;
                    });
                    return false;
                }

                var postData = {};
                if(checkbox === 'true'){
                    tableId = tableId || init.table_render_id;
                    var checkStatus = table.checkStatus(tableId),
                        data = checkStatus.data;
                    if (data.length <= 0) {
                        admin.msg.error('请勾选需要操作的数据');
                        return false;
                    }
                    var ids = [];
                    $.each(data, function (i, v) {
                        ids.push(v[field]);
                    });
                    postData[field] = ids;
                }

                if (addons !== true && addons !== 'true') {
                    url = admin.url(url);
                }
                tableId = tableId || init.table_render_id;
                admin.msg.confirm(title, function () {
                    admin.request.post({
                        url: url,
                        data: postData,
                    }, function (res) {
                        admin.msg.success(res.msg, function () {
                            if (close != false) {
                                admin.api.closeCurrentOpen({
                                    refreshFrame: true
                                });
                            }else {
                                table.reload(tableId);
                            }
                        });
                    })
                });
                return false;
            });

            // 数据表格多删除
            $('body').on('click', '[data-table-delete]', function () {
                var tableId = $(this).attr('data-table-delete'),
                    url = $(this).attr('data-url');
                tableId = tableId || init.table_render_id;
                url = url !== undefined ? admin.url(url) : window.location.href;
                var checkStatus = table.checkStatus(tableId),
                    data = checkStatus.data;
                if (data.length <= 0) {
                    admin.msg.error('请勾选需要删除的数据');

                    return false;
                }
                var ids = [];
                $.each(data, function (i, v) {
                    ids.push(v.id);
                });
                admin.msg.confirm('确定删除？', function () {
                    admin.request.post({
                        url: url,
                        data: {
                            id: ids
                        },
                    }, function (res) {
                        admin.msg.success(res.msg, function () {
                            table.reload(tableId);
                            admin.api.upload();// 初始化图片显示以及监听上传事件
                        });
                    });
                });
                return false;
            });

            // 数据表格多冻结
            $('body').on('click', '[data-table-freeze]', function () {
                var tableId = $(this).attr('data-table-freeze'),
                    url = $(this).attr('data-url');
                tableId = tableId || init.table_render_id;
                url = url !== undefined ? admin.url(url) : window.location.href;
                var checkStatus = table.checkStatus(tableId),
                    data = checkStatus.data;
                if (data.length <= 0) {
                    admin.msg.error('请勾选需要冻结的数据');
                    return false;
                }
                var ids = [];
                $.each(data, function (i, v) {
                    ids.push(v.id);
                });
                admin.msg.confirm('确定冻结该数据吗？', function () {
                    admin.request.post({
                        url: url,
                        data: {
                            id: ids,
                            status: 2,// 冻结
                            server_id: $('#c-server_id').val()
                        },
                    }, function (res) {
                        admin.msg.success(res.msg, function () {
                            table.reload(tableId);
                        });
                    });
                });
                return false;
            });
        },
        api: {
            closeCurrentOpen: function (option) {
                option = option || {};
                option.refreshTable = option.refreshTable || false;
                option.refreshFrame = option.refreshFrame || false;
                if (option.refreshTable === true) {
                    option.refreshTable = init.table_render_id;
                }
                var index = parent.layer.getFrameIndex(window.name);
                parent.layer.close(index);
                if (option.refreshTable !== false) {
                    parent.layui.table.reload(option.refreshTable);
                }
                if (option.refreshFrame) {
                    parent.location.reload();
                }
                return false;
            },
            getConfigData: function (option, ok, no, ex) {
                option = option || {};
                option.getConfigUrl = option.getConfigUrl || '';
                option.getConfigData = option.getConfigData || [];
                admin.request.post({
                    url: option.getConfigUrl,
                    data: option.getConfigData,
                    prefix: true,
                }, function (res) {
                    if ( res.code != 0 && res.data == null ) {
                        admin.msg.error( res.msg );
                        return false;
                    }
                    return ok( res.data );
                }, no, ex);
                return false;
            },
            refreshFrame: function () {
                parent.location.reload();
                return false;
            },
            refreshTable: function (tableName) {
                tableName = tableName || 'currentTable';
                table.reload(tableName);
            },
            fieldRequiredVerify: function (fields = [], rtype = 'name') {
                if (fields.length == 0) {
                    return true;
                }

                if (typeof fields != Object) fields = [fields];

                // 验证字段的值
                let field_vals = [];

                // 遍历需要验证的列表
                for (let idx = 0; idx < fields.length; idx++) {
                    let vobj  = '';
                    let field = fields[idx];

                    switch (rtype) {
                        case 'id':
                            vobj = '#' + field;
                        break;

                        case 'name':
                            vobj = '[name="' + field + '"]';
                        break;

                        case 'class':
                            vobj = '.' + field;
                        break;
                    
                        default:
                            admin.msg.error('指定字段规则验证失败，rtype参数不能为空');
                            return false;
                        break;
                    }

                    let verify = $(vobj).attr('lay-verify');

                    // todo 必填项处理
                    if (verify === 'required') {
                        let verify_val = $(vobj).val();

                        if (!verify_val) {
                            let reqtext = $(vobj).attr('lay-reqtext');
                            admin.msg.config.icon = 5;
                            admin.msg.config.anim = 6;
                            admin.msg.error(reqtext);
                            $(vobj).addClass('layui-form-danger');
                            return false;
                        }

                        field_vals[field] = verify_val;
                        $(vobj).removeClass('layui-form-danger');
                    }
                }

                return field_vals;
            },
            formRequiredVerify: function () {
                let verifyList = document.querySelectorAll('[lay-verify]');
                if (verifyList.length == 0) {
                    return true;
                }

                // 遍历需要验证的列表
                for (let idx = 0; idx < verifyList.length; idx++) {
                    let vobj   = verifyList[idx];
                    let verify = $(vobj).attr('lay-verify');

                    // todo 必填项处理
                    if (verify === 'required') {
                        let verify_val = $(vobj).val();

                        if (!verify_val) {
                            let reqtext = $(vobj).attr('lay-reqtext');
                            admin.msg.config.icon = 5;
                            admin.msg.config.anim = 6;
                            admin.msg.error(reqtext);
                            $(vobj).addClass('layui-form-danger');
                            return false;
                        }

                        $(vobj).removeClass('layui-form-danger');
                    }
                }

                return true;
            },
            formRequired: function () {
                var verifyList = document.querySelectorAll("[lay-verify]");
                
                if (verifyList.length > 0) {
                    $.each(verifyList, function (i, v) {
                        var verify = $(this).attr('lay-verify');

                        // todo 必填项处理
                        if (verify === 'required') {
                            var label = $(this).parent().prev();
                            if (label.is('label') && !label.hasClass('required')) {
                                label.addClass('required');
                            }
                            if ($(this).attr('lay-reqtext') === undefined && $(this).attr('placeholder') !== undefined) {
                                $(this).attr('lay-reqtext', $(this).attr('placeholder'));
                            }
                            if ($(this).attr('placeholder') === undefined && $(this).attr('lay-reqtext') !== undefined) {
                                $(this).attr('placeholder', $(this).attr('lay-reqtext'));
                            }
                        }

                    });
                }
            },
            formRewards: function(option) {

                // 初始化参数
                option          = option || {};
                option.elem     = option.elem || '.layui-form';
                option.data     = option.data || [];
                option.methods  = option.methods || {
                    monitor_rew: function () {
                        let thit     = this;
                        let rew_list = [];
                        thit.rew_list.forEach(rval => {

                            let rid = rval.id;
                            thit.rew_fields.forEach(fkey => {
                                let kname  = 'key_' + fkey + '_' + rid;
                                rval[fkey] = $('[name="' + kname + '"]').val();
                            });
                            rew_list.push(rval);
                        });

                        rew_vue.rew_list = rew_list;
                    },
                    delete_rew: function (index) {

                        if (this.rew_list.length < 2) {

                            layer.msg('不能全部删除', {
                                anim: 6,
                                time: 3000
                            });
                            return false;
                        }

                        let thit = this;
                        thit.monitor_rew();

                        layer.msg('确认要删除吗？', {
                            time: 3000000, // 30s后自动关闭
                            btn: ['删除', '取消'],
                            yes: function (obj) {
                                thit.rew_list.splice(index, 1);
                                layer.close(obj);
                                setTimeout(function () {
                                    form.render();
                                }, 5)
                            }
                        });
                    },
                    add_rew: function (add_count) {

                        let thit       = this;
                        let new_row    = Number(add_count);
                        let rewit_lent = Number(thit.rew_list.length);
                        if (rewit_lent > 0) {

                            rewit_lent = Number($(option.rew_elem).val());
                        }

                        for (var rit = (rewit_lent + 1); rit <= (rewit_lent + new_row); rit++) {

                            let new_data = {
                                id: rit
                            };

                            thit.rew_fields.forEach(fkey => {
                                let kname = 'key_' + fkey;
                                new_data[fkey]  = '';
                                new_data[kname] = kname + '_' + rit;
                            });

                            thit.rew_list.push(new_data);
                        }

                        // 修改奖励数量
                        $(option.rew_elem).val(rit);

                        setTimeout(function () {
                            form.render();
                        }, 50);

                        return false;
                    },
                    init_rew: function (data) {

                        data = data || [];
                        let rewit_lent = Number(data.length);
                        
                        if (rewit_lent <= 0) {

                            return false;
                        }

                        let rit  = 0;
                        let thit = this;

                        $.each($.parseJSON(data), function(key, val) {

                            rit++;
                            let new_data = {
                                id: rit,
                            };

                            switch (thit.rew_type) {
                                case 'items':
                                    new_data[thit.rew_fields[0]] = key;
                                    new_data[thit.rew_fields[1]] = val;
                                break;

                                case 'heros':
                                    new_data[thit.rew_fields[0]] = val;
                                break
                            
                                default:
                                    admin.msg.error('未定义的奖励类型 ['+thit.rew_type+']');
                                break;
                            }
                            
                            thit.rew_fields.forEach(fkey => {
                                let kname = 'key_' + fkey;
                                new_data[kname] = kname + '_' + rit;
                            });

                            thit.rew_list.push(new_data);
                        });

                        // 修改奖励数量
                        $(option.rew_elem).val(rit);

                        setTimeout(function () {
                            form.render();
                        }, 50);

                        return false;
                    }
                };
                option.rew_elem = option.rew_elem || '#rew_num';

                // 实例化VUE（奖励）
                let rew_vue = new vue({
                    el: option.elem,
                    data: option.data,
                    methods: option.methods
                });

                return rew_vue;
            },
            formSubmit: function (preposeCallback, ok, no, ex) {
                var formList = document.querySelectorAll("[lay-submit]");

                // 表单提交自动处理
                if (formList.length > 0) {
                    $.each(formList, function (i, v) {
                        var filter = $(this).attr('lay-filter'),
                            type = $(this).attr('data-type'),
                            refresh = $(this).attr('data-refresh'),
                            confirm = $(this).attr('title-confirm'),
                            url = $(this).attr('lay-submit');

                        // 表格搜索不做自动提交
                        if (type === 'tableSearch') {
                            return false;
                        }
                        // 判断是否需要刷新表格
                        if (refresh === 'false') {
                            refresh = false;
                        } else {
                            refresh = true;
                        }
                        // 自动添加layui事件过滤器
                        if (filter === undefined || filter === '') {
                            filter = 'save_form_' + (i + 1);
                            $(this).attr('lay-filter', filter)
                        }

                        if (url === undefined || url === '' || url === null) {
                            url = window.location.href;
                        } else {
                            if (url !== 'false') {
                                url = admin.url(url);
                            }
                        }

                        form.on('submit(' + filter + ')', function (data) {
                            var dataField = data.field;

                            // 富文本数据处理
                            var editorList = document.querySelectorAll(".editor");
                            if (editorList.length > 0) {
                                $.each(editorList, function (i, v) {
                                    var name = $(this).attr("name");
                                    dataField[name] = CKEDITOR.instances[name].getData();
                                });
                            }

                            if (typeof preposeCallback === 'function') {
                                dataField = preposeCallback(dataField);
                            }

                            if (confirm != undefined && confirm != '') {
                                
                                admin.msg.confirm(confirm, function () {

                                    admin.api.form(url, dataField, ok, no, ex, refresh);
                                });

                            }else {

                                admin.api.form(url, dataField, ok, no, ex, refresh);
                            }

                            return false;
                        });
                    });
                }
            },
            dateFormat: function (timestamp, formats) {
                // formats格式包括
                // 1. Y-m-d
                // 2. Y-m-d H:i:s
                // 3. Y年m月d日
                // 4. Y年m月d日 H时i分
                // ea.api.dateFormat(target_val.end_time)
                formats = formats || 'Y-m-d H:i:s';

                // 判断是否为10位时间戳，乘以1000因为 js是以毫秒计算的
                timestamp = timestamp.toString().length == 10 ? (timestamp * 1000) : timestamp;

                var zero = function (value) {
                    if (value < 10) {
                        return '0' + value;
                    }
                    return value;
                };

                var myDate = timestamp? new Date(timestamp): new Date();

                var year = myDate.getFullYear();
                var month = zero(myDate.getMonth() + 1);
                var day = zero(myDate.getDate());

                var hour = zero(myDate.getHours());
                var minite = zero(myDate.getMinutes());
                var second = zero(myDate.getSeconds());

                return formats.replace(/Y|m|d|H|i|s/ig, function (matches) {
                    return ({
                        Y: year,
                        m: month,
                        d: day,
                        H: hour,
                        i: minite,
                        s: second
                    })[matches];
                });
            },
            rangeDate: function(option) {
                option = option || {};
                let type = option.type || 'datetime';
                let end_elem = option.end_elem || '[name="end_date"]';
                let start_elem = option.start_elem || '[name="start_date"]';

                // 执行一个laydate实例
                var end_time = laydate.render({
                    elem: end_elem, // 指定元素
                    type: type,// 日期时间选择器
                    min: $( start_elem ).val()
                });

                // 执行一个laydate实例
                laydate.render({
                    elem: start_elem,// 指定元素
                    type: type,// 日期时间选择器
                    done: function(value, date, endDate){
                        // 别问为什么，问就是插件的BUG！！！！
                        date.month            = ( date.month - 1 );
                        end_time.config.min   = date; // 开始日选好后，重置结束日的最小日期
                        end_time.config.start = date // 将结束日的初始值设定为开始日
                    }
                });
            },
            dateTime: function (date) {
                let date_obj = date ? new Date(date) : new Date();
                return Math.floor(date_obj.getTime() / 1000);
            },
            upload: function (ok, no) {
                var uploadList = document.querySelectorAll("[data-upload]");
                var uploadSelectList = document.querySelectorAll("[data-upload-select]");

                if (uploadList.length > 0) {
                    $.each(uploadList, function (i, v) {
                        let exts          = $(this).attr('data-upload-exts'),
                            uploadUrl     = $(this).attr('data-upload-url'),
                            uploadSign    = $(this).attr('data-upload-sign'),
                            uploadName    = $(this).attr('data-upload'),
                            uploadNumber  = $(this).attr('data-upload-number'),
                            uploadrefresh = $(this).attr('data-upload-refresh');

                        let elem = 'input[name="' + uploadName + '"]', uploadElem = this;

                        // 检查默认值
                        exts          = exts || init.upload_exts;
                        uploadUrl     = uploadUrl || init.upload_url;
                        uploadSign    = uploadSign || '|';
                        uploadNumber  = uploadNumber || 'one';
                        uploadrefresh = uploadrefresh || false;

                        ok = ok || function (res) {
                            return true;
                        };

                        // 监听上传事件
                        upload.render({
                            elem: this,
                            url: admin.url(uploadUrl),
                            accept: 'file',
                            exts: exts,
                            // 让多图上传模式下支持多选操作
                            multiple: (uploadNumber !== 'one') ? true : false,
                            before: function(obj){
                                index = admin.msg.loading(); //上传loading
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
                                        admin.msg.alert(res.msg, function() {
                                            if (uploadrefresh) {
                                                table.reload(uploadrefresh);
                                                admin.api.upload(ok);// 初始化图片显示以及监听上传事件
                                            }
                                        }, 1);
                                    }
                                }else {
                                    admin.msg.error(res.msg);
                                }

                                return false;
                            },error: function(index, upload){

                                layer.closeAll('loading'); // 关闭loading
                                admin.msg.error('上传失败');
                                return no();
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
                                    liHtml += '<li><a><img src="' + v + '" data-image  onerror="this.src=\'' + BASE_URL + 'index/images/upload-icons/' + uploadIcon + '.png\';this.onerror=null"></a><small class="uploads-delete-tip bg-red badge" data-upload-delete="' + uploadName + '" data-upload-url="' + v + '" data-upload-sign="' + uploadSign + '">×</small></li>\n';
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
                        var confirm = admin.msg.confirm('确定删除？', function () {
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
                            admin.msg.close(confirm);
                        });
                        return false;
                    });
                }

                if (uploadSelectList.length > 0) {
                    $.each(uploadSelectList, function (i, v) {
                        var exts = $(this).attr('data-upload-exts'),
                            uploadName = $(this).attr('data-upload-select'),
                            uploadNumber = $(this).attr('data-upload-number'),
                            uploadSign = $(this).attr('data-upload-sign');
                        exts = exts || init.upload_exts;
                        uploadNumber = uploadNumber || 'one';
                        uploadSign = uploadSign || '|';
                        var selectCheck = uploadNumber === 'one' ? 'radio' : 'checkbox';
                        var elem = "input[name='" + uploadName + "']",
                            uploadElem = $(this).attr('id');

                        tableSelect.render({
                            elem: "#" + uploadElem,
                            checkedKey: 'id',
                            searchType: 'more',
                            searchList: [
                                {searchKey: 'title', searchPlaceholder: '请输入文件名'},
                            ],
                            table: {
                                url: admin.url('ajax/getUploadFiles'),
                                cols: [[
                                    {type: selectCheck},
                                    {field: 'id', title: 'ID'},
                                    {field: 'url', minWidth: 80, search: false, title: '图片信息', imageHeight: 40, align: "center", templet: admin.table.image},
                                    {field: 'original_name', width: 150, title: '文件原名', align: "center"},
                                    {field: 'mime_type', width: 120, title: 'mime类型', align: "center"},
                                    {field: 'create_time', width: 200, title: '创建时间', align: "center", search: 'range'},
                                ]]
                            },
                            done: function (e, data) {
                                var urlArray = [];
                                $.each(data.data, function (index, val) {
                                    urlArray.push(val.url)
                                });
                                var url = urlArray.join(uploadSign);
                                admin.msg.success('选择成功', function () {
                                    $(elem).val(url);
                                    $(elem).trigger("input");
                                });
                            }
                        })

                    });

                }
            },
            editor: function () {
                var editorList = document.querySelectorAll(".editor");
                if (editorList.length > 0) {
                    $.each(editorList, function (i, v) {
                        CKEDITOR.replace(
                            $(this).attr("name"),
                            {
                                height: $(this).height(),
                                filebrowserImageUploadUrl: admin.url('ajax/uploadEditor'),
                            });
                    });
                }
            },
            select: function () {
                var selectList = document.querySelectorAll("[data-select]");
                $.each(selectList, function (i, v) {
                    var url = $(this).attr('data-select'),
                        selectFields = $(this).attr('data-fields'),
                        value = $(this).attr('data-value'),
                        that = this,
                        html = '<option value=""></option>';
                    var fields = selectFields.replace(/\s/g, "").split(',');
                    if (fields.length !== 2) {
                        return admin.msg.error('下拉选择字段有误');
                    }
                    admin.request.get(
                        {
                            url: url,
                            data: {
                                selectFields: selectFields
                            },
                        }, function (res) {
                            var list = res.data;
                            list.forEach(val => {
                                var key = val[fields[0]];
                                if (value !== undefined && key.toString() === value) {
                                    html += '<option value="' + key + '" selected="">' + val[fields[1]] + '</option>';
                                } else {
                                    html += '<option value="' + key + '">' + val[fields[1]] + '</option>';
                                }
                            });
                            $(that).html(html);
                            form.render();
                        }
                    );
                });
            },
            empty: function (val) {
                switch (val) {
                    case '':
                        return true;

                    case null:
                        return true;

                    case undefined:
                        return true;

                    case 'null':
                        return true;

                    case []:
                        return true;

                    case {}:
                        return true;
                
                    default:
                        return false;
                }
            },
            date: function () {
                var dateList = document.querySelectorAll("[data-date]");
                if (dateList.length > 0) {
                    $.each(dateList, function (i, v) {
                        var format = $(this).attr('data-date'),
                            type = $(this).attr('data-date-type'),
                            range = $(this).attr('data-date-range');
                        if(type === undefined || type === '' || type ===null){
                            type = 'datetime';
                        }
                        var options = {
                            elem: this,
                            type: type,
                        };
                        if (format !== undefined && format !== '' && format !== null) {
                            options['format'] = format;
                        }
                        if (range !== undefined) {
                            if(range === null || range === ''){
                                range = '-';
                            }
                            options['range'] = range;
                        }
                        laydate.render(options);
                    });
                }
            },
            form: function (url, data, ok, no, ex, refreshTable) {
                if (refreshTable === undefined) {
                    refreshTable = true;
                }
                if (url === 'false') {
                    return ok();
                }
                ok = ok || function (res) {
                    res.msg = res.msg || '';
                    admin.msg.success(res.msg, function () {
                        admin.api.closeCurrentOpen({
                            refreshTable: refreshTable
                        });
                    });
                    return false;
                };
                admin.request.post({
                    url: url,
                    data: data,
                }, ok, no, ex);
                return false;
            },
        },
    };
    return admin;
    
});
