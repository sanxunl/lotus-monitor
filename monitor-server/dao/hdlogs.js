const mysqlClient = require('../libs/mysqlClient');

exports.getList = function(params, callback) {
    let sql = 'SELECT * FROM l_c_hd ';
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
    let sql = 'SELECT * FROM l_c_hd where n_id=' +  mysqlClient.escape(id) + ' order by id desc limit 1';
    mysqlClient.queryList(sql, null, (res => {
        if(res && res.length > 0) {
            callback(res[0]);
        } else {
            callback({});
        }
    }));
}