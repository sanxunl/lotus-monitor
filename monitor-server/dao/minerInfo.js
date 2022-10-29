const mysqlClient = require('../libs/mysqlClient');

exports.getList = function(params, callback) {
    let sql = 'SELECT * FROM l_m_info ';
    let where = '';
    if (params.n_id) {
        where = 'n_id=' + mysqlClient.escape(params.n_id);
    }
    if (params.start && params.end) {
        if (where) {
            where += ' and ';
        }
        where += 'created_time > ' + mysqlClient.escape(params.start) + ' AND  created_time < ' + mysqlClient.escape(params.end)
    }
    if (where) {
        sql += ' where ' + where;
    }
    mysqlClient.queryList(sql, null, callback);
}

exports.getById = function(id, callback) {
    mysqlClient.getObject('l_m_info', { id }, callback);
}