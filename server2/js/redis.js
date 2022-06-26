// 定义实例
var locat_instance;



// redis连接
var redisConnect = function (option) {

    var redis = require('redis'),
        cfgs  = require('../config/config.js'),
        client = redis.createClient(parseInt( cfgs.red_port ), cfgs.red_addr);

    //连接错误处理
    client.on("error", function (error) {

        console.log('Redis client Error: ', error);
    });

    // client.on('ready', function (res) {
    //     console.log('ready');
    // });

    // client.on('end', function (err) {
    //     console.log('end');
    // });

    // client.on('error', function (err) {
    //     console.log(err);
    // });

    // client.on('connect', function () {
    //     console.log('redis connect success!');
    // });

    if ( cfgs.red_pwd != "" ) {

        // redis验证 （如果client没有开启验证，此配置可以不写）
        client.auth( cfgs.red_pwd, function(){  
    
            console.log('通过认证');  
        });
    }
    
    // 选择库
    client.select(cfgs.red_db);

    return client;
};

var redis = function () {
    
};

redis.prototype.instance = function () {
  
    if (!locat_instance) {

        console.log('!!!!!!!!!!! 重新连接Redis');
        locat_instance = redisConnect();
    }

    return locat_instance;
};


module.exports = redis;