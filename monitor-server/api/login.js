var mysqlClient = require('../libs/mysqlClient');
var redisClient = require('../libs/redisClient');

function Service() {
    //getUserInfo
    this.list = function(params, callback) {
        callback(params['*session']);
    }
    //login
    this.create = function(params, callback) {
        mysqlClient.getObject('t_user', { name: params.username, password: params.password }, function(data) {
            if (data) {
                redisClient.set(params['*session'].sid, data);
                callback({ result: true, token: params['*session'].sid });
            } else {
                callback({ error: '用户名或密码不正确' });
            }
        });
    }
    //logout
    this.delete = function(id, params, callback) {
        redisClient.del(params['*session'].sid);
        callback({ result: true });
    }
}
exports.service = Service;