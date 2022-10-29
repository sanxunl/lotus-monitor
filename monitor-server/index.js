require('console-stamp')(console, {
    format: ':date(yyyy-mm-dd HH:MM:ss.l)'
});
const restify = require('restify');
const config = require('config');
console.log(config);
const server = restify.createServer();
//初始化api服务
const apiServer = require('./apiServer');
apiServer.init(server);

//监听端口
server.listen(config.get('server.port'), function() {
    console.log('%s listening at %s', server.name, server.url);
});