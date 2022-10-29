var mysqlClient = require('../libs/mysqlClient');

function Service() {
    this.list = function(params, callback) {
        var sql = mysqlClient.buildQuerySql('t_user', params, true);
        mysqlClient.queryPage(sql, null, params.pageNumber, params.pageSize, callback);
    }
    this.retrieve = function(id, params, callback) {
        mysqlClient.getObject('t_user', { id: id }, callback);
    }
    this.create = function(params, callback) {
        mysqlClient.addObject('t_user', params, callback);
    }
    this.update = function(id, params, callback) {
        mysqlClient.getObject('t_user', { id: id }, function(data) {
            if (data) {
                mysqlClient.updateObject('t_user', params, { id: id }, callback);
            } else {
                callback({ error: '没有数据' });
            }
        });
    }
    this.delete = function(id, params, callback) {
        mysqlClient.deleteObject('t_user', { id: id }, callback);
    }
}
exports.service = Service;