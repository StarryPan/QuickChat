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
};

module.exports = common;