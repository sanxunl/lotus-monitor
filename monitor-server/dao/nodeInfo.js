const mysqlClient = require('../libs/mysqlClient');

exports.getList = function(callback) {
    let sql = mysqlClient.buildQuerySql('b_n_info', {}, false);
    mysqlClient.queryList(sql, null, callback);
}

exports.getById = function(id, callback) {
    mysqlClient.getObject('b_n_info', { id }, callback);
}

exports.save = function(params, callback) {
    mysqlClient.addObject('b_n_info', params, callback);
}

exports.update = function(id, params, callback) {
    mysqlClient.getObject('b_n_info', { id: id }, function(data) {
        if (data) {
            mysqlClient.updateObject('b_n_info', params, { id: id }, callback);
        } else {
            callback({ error: '没有数据' });
        }
    });
}
