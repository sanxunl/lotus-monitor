const wechatClient = require('../libs/wechatClient');

exports.sendMsg = function(table, data) {
    var module = loadModule('./' + table);
    if (module) {
        var service = new module.service();
        var fn = service['process'];
        fn(data, function(res) {
            console.log(res);
            if (res.msg && res.is_alert) {
                wechatClient.sendMsg(res.msg);
            }
        });
    }
}

function loadModule(path) {
    try {
        return require(path);
    } catch (err) {
        return null;
    }
}