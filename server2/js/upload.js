// 基于Nodejs Web 的开发框架（老框架了 目前无人维护）
var express = require('express');
var router = express.Router();

// 文件上传模块multer、文件下载
var multer = require('multer');


// 获取服务器配置
const config = require('../common/config/server');
const app_host = config.host;// 服务器地址
const app_port = config.app_port;// 访问端口


// 获取当前日期
const common = require('./common');
const nowDate = common.getFormatDate();
const uploadFolder = './public/static/upload/' + nowDate;

// 创建文件夹
common.createFolder(uploadFolder);



// 使用硬盘存储模式设置存放接收到的文件的路径以及文件名
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 保存的路径，备注：需要自己创建
        cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
        // 将保存文件名设置为 字段名 + 时间戳，比如 logo-1478521468943
        let suffix = file.mimetype.split('/')[1];//获取文件格式
        cb(null, file.fieldname + '-' + Date.now() + '.' + suffix);
        // 将保存文件名设置为 时间戳 + 文件原始名，比如 151342376785-123.jpg
        // cb(null, Date.now() + "-" + file.originalname); 
    }
});

// 创建 multer 对象
var upload = multer({ storage: storage });


/* POST upload listing. */
router.post('/', upload.single('file'), function (req, res, next) {
    var file = req.file;
    console.log('文件类型：%s', file.mimetype);
    console.log('原始文件名：%s', file.originalname);
    console.log('文件大小：%s', file.size);
    console.log('文件保存路径：%s', file.path);

    // 接收文件成功后返回数据给前端
    res.json({
        'code': 0,
        'msg': '上传成功',
        'data': {
            'url': 'http://' + app_host + ':' + app_port + '/static/upload/' + nowDate + '/' + file.filename,
            'path': file.path,
        },
    });
});

// 导出模块（在 app.js 中引入）
module.exports = router;