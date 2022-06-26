// 基于Nodejs Web 的开发框架（老框架了 目前无人维护）
var express = require('express');
var app = express();

// 模块提供了一些用于处理文件路径的小工具，我们可以通过以下方式引入该模块
var path = require("path");


// 获取服务器配置
const config = require('./common/config/server');
const app_host = config.host;// 服务器地址
const app_port = config.app_port;// 访问端口


/**
 * 测试接口
 */
app.get('/hello', function (req, res, next) {
    // res.end(req.file.buffer);
    // console.log(req.file.buffer.toString().length);
    // console.log('hello-- req: ', req);
    // console.log('hello-- res: ', res);
    // console.log('hello-- next: ', next);
    
    res.end('ok');
});


/**
 * 允许跨域访问
 * 使用的是cors解决跨域问题，当我们再本地直接请求该接口的时候，可以直接请求
 */
app.all('*', function(req, res, next) { 
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Headers", "X-Requested-With"); 
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS"); 
    res.header("X-Powered-By",' 3.2.1') 
    res.header("Content-Type", "application/json;charset=utf-8"); 
    next(); 
});

/**
 * 获取头像
 */
app.get('/getUploadHeards', function (req, res, next) {
    
    let data = [];

    for (let i = 1; i <= 22; i++) {
        
        data.push({id: 1, url: 'http://' + app_host + ':' + app_port + '/static/images/heads/head'+i+'.jpg', create_time: '2020-04-01'});
    }

    res.header("Access-Control-Allow-Origin", "*"); 
    res.json({
        'code': 0,
        'msg' : '成功',
        'count': data.length,
        'data': data,
    });
});

/**
 * 上传接口
 */
var upload = require('./js/upload');
app.use('/upload', upload);

/**
 * 允许访问静态文件（图片，文件，视频）
 */
// app.use(express.static(__dirname));
app.use('/static',express.static(path.resolve(__dirname,'./public/static')));


// 监听接口
app.listen(app_port, () => {
    console.log('AppServer is running at http://' + app_host + ':' + app_port);
    console.log('\n\n---------------------------------------');
    console.log('---------------------------------------\n\n');
});