var common = {
    jsonStr: function (cmd, rs) {

        let js_obj = {
            "cmd": cmd,
            "rs": rs
        };
        return JSON.stringify(js_obj);
    },
    errorStr: function (msg, code = 1, data) {
        let js_obj = {
            "code": code,
            "msg": msg,
            "data": data,
        };
        return js_obj;
    },
    isEmpty: function (arr, param) {

        for (const key in arr) {

            let val = arr[key];
            
            if (val == param) {

                return false;
            }
        }

        return true;

        // return (arr.indexOf(param) < 0);
    },
    getFormatDate: function (date, part) {
        date = date || new Date();
        part = part || '-';

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        var currentdate = year + part + month + part + strDate;
        return currentdate;
    },
    createFolder: function(folder){
        // 文件系统包
        var fs = require('fs');

        // 创建文件夹 使用此代码就是为了让我们查找磁盘中是否有该文件夹，如果没有，可以自动创建，而不是我们提前手动创建好。如果不使用此代码，则我们再使用该文件夹之前，需要手动创建好当前问价夹
        try{
            // 测试 path 指定的文件或目录的用户权限,我们用来检测文件是否存在
            // 如果文件路径不存在将会抛出错误"no such file or directory"
            fs.accessSync(folder);
        }catch(e){
            // 文件夹不存在，以同步的方式创建文件目录。
            fs.mkdirSync(folder);
        }

        return true;
    },
};

module.exports = common;