var config = require('config');
var mysql = require('mysql');

var options = {
    host: config.dbConfig.mysql.host,
    port: config.dbConfig.mysql.port,
    database: config.dbConfig.mysql.dbName,
    user: config.dbConfig.mysql.userName,
    password: config.dbConfig.mysql.password,
    charset: 'UTF8',
    connectionLimit: 5,
    supportBigNumbers: true,
    bigNumberStrings: true
}

var pool = mysql.createPool(options);

function isArray(arr) {
    return Object.prototype.toString.call(arr) === "[object Array]";
}

//执行所有sql语句
function execQuery(sql, values, callback) {
    var errinfo;
    pool.getConnection(function(err, connection) {
        if (err) {
            errinfo = 'DB-获取数据库连接异常！';
            console.error(errinfo);
            throw errinfo;
        } else {
            var isarr = isArray(values);
            for (var key in values) {
                if (isarr) {
                    var value = values[key];
                    for (var item in value) {
                        if (item[0] == "*") {
                            delete value[item];
                        }
                    }
                } else {
                    if (key[0] == "*") {
                        delete values[key];
                    }
                }
            }
            var querys = connection.query(sql, values, function(err, rows) {
                release(connection);
                if (err) {
                    errinfo = 'DB-SQL语句执行错误:' + err;
                    console.error(errinfo);
                    throw errinfo;
                } else if (callback) {
                    callback(rows);
                }
            });
            console.log(querys.sql);
        }
    });
}

function release(connection) {
    try {
        connection.release(function(error) {
            if (error) {
                console.error('DB-关闭数据库连接异常！');
            }
        });
    } catch (err) {}
}

function execUpdate(sql, values, callback) {
    execQuery(sql, values, function(result) {
        if (callback) {
            var affectedRows = 0;
            var insertId = 0;
            if (result) {
                affectedRows = result.affectedRows
                if (result.insertId) {
                    insertId = result.insertId;
                }
            }
            callback({
                affectedRows: affectedRows,
                insertId: insertId
            });
        }
    });
}

//执行sql语句，返回影响条数
exports.update = function(sql, values, callback) {
    execUpdate(sql, values, callback);
}

//执行sql 事务
exports.execQueryTrans = function(sqls, callback) {
    var errinfo;
    pool.getConnection(function(err, connection) {
        if (err) {
            errinfo = 'DB-获取数据库连接异常！';
            console.error(errinfo);
            throw errinfo;
        }
        connection.beginTransaction(function(err) {
            if (err) {
                errinfo = 'DB-开启事务异常！';
                console.error(errinfo);
                release(connection);
                throw errinfo;
            } else {
                var index = 0;
                var count = sqls.length;
                var affectedRows = 0;
                execTrans(connection, sqls, count, index, affectedRows, function(result) {
                    callback({
                        affectedRows: result
                    });
                });
            }
        });
    });
}

function execTrans(connection, sqls, count, index, affectedRows, callback) {
    var sql = sqls[index];
    var querys = connection.query(sql, function(err, result) {
        if (err) {
            connection.rollback(function() {
                console.log(sql);
                console.error(err);
                callback(0);
                release(connection);
            });
        } else {
            if (result) {
                affectedRows += result.affectedRows
            }
            index++;
            if (index < count) {
                execTrans(connection, sqls, count, index, affectedRows, callback);
            } else {
                connection.commit(function(err) {
                    if (err) {
                        connection.rollback(function() {
                            console.error('DB-commit事务回滚异常！');
                            callback(0);
                            release(connection);
                        });
                    } else {
                        release(connection);
                        callback(affectedRows);
                    }
                });
            }
        }
    });
    console.log(querys.sql);
}


//查询分页
exports.queryPage = function(sql, values, page, size, callback) {
    if (!size) {
        size = 10;
    }
    if (page || page > 0) {
        page--;
    } else {
        page = 0;
    }
    execQuery(sql + ' LIMIT ' + page * size + ',' + size, values, function(rresult) {
        var index = sql.toLocaleUpperCase().lastIndexOf(' FROM');
        var endindex = sql.toLocaleUpperCase().lastIndexOf(' ORDER');
        //如果是有order的分页查询，去掉后边排序统计个数
        if (endindex == -1) {
            sql = 'SELECT COUNT(*) count ' + sql.substring(index);
        } else {
            sql = 'SELECT COUNT(*) count ' + sql.substring(index, endindex);
        }
        execQuery(sql, values, function(cresult) {
            if (callback) {
                var pagenum = 0;
                if (parseInt(cresult[0].count) > 0) {
                    var pagenum = cresult[0].count / size;
                    if (pagenum < 1) {
                        pagenum = 1;
                    } else if (cresult[0].count % size > 0) {
                        pagenum++;
                    }
                }
                callback({
                    total: cresult[0].count,
                    pageNum: pagenum,
                    rows: rresult
                });
            }
        });
    });
}

//重写查询分页(sql语句不截取)
exports.queryPage2 = function(sql, values, page, size, callback) {
    if (!size) {
        size = 10;
    }
    if (page || page > 0) {
        page--;
    } else {
        page = 0;
    }
    execQuery(sql + ' LIMIT ' + page * size + ',' + size, values, function(rresult) {
        sql = 'SELECT COUNT(*) count FROM ' + '(' + sql + ') as newname ';
        execQuery(sql, values, function(cresult) {
            if (callback) {
                var pagenum = 0;
                if (parseInt(cresult[0].count) > 0) {
                    var pagenum = cresult[0].count / size;
                    if (pagenum < 1) {
                        pagenum = 1;
                    } else if (cresult[0].count % size > 0) {
                        pagenum++;
                    }
                }
                callback({
                    total: cresult[0].count,
                    pageNum: pagenum,
                    rows: rresult
                });
            }
        });
    });
}

//查询列表
exports.queryList = function(sql, values, callback) {
    execQuery(sql, values, function(result) {
        if (callback) {
            callback(result);
        }
    });
}

//查询单条记录
exports.queryObject = function(sql, values, callback) {
    execQuery(sql, values, function(result) {
        if (callback) {
            if (result && result.length > 0) {
                callback(result[0]);
            } else {
                callback(null);
            }
        }
    });
}

exports.getObject = function(tablename, values, callback) {
    var sql = "SELECT * FROM ?? WHERE ";
    var where = "";
    for (var vkey in values) {
        if (where) {
            where += " AND "
        }
        where += pool.escapeId(vkey) + "=" + pool.escape(values[vkey]);
    }
    sql += where;
    execQuery(sql, [tablename], function(result) {
        if (callback) {
            if (result && result.length > 0) {
                callback(result[0]);
            } else {
                callback(null);
            }
        }
    });
}

//添加一条记录
exports.addObject = function(tablename, values, callback) {
    var sql = 'INSERT INTO ?? SET ?';
    execUpdate(sql, [tablename, values], callback);
}

//更新记录
exports.updateObject = function(tablename, values, id, callback) {
    var sql = "UPDATE ?? SET ? WHERE ";
    var where = "";
    for (var vkey in id) {
        if (where) {
            where += " AND "
        }
        where += pool.escapeId(vkey) + "=" + pool.escape(id[vkey]);
    }
    sql += where;
    execUpdate(sql, [tablename, values], callback);
}

//删除记录
exports.deleteObject = function(tablename, values, callback) {
    var sql = 'DELETE FROM ' + pool.escapeId(tablename) + ' WHERE ';
    var where = "";
    for (var vkey in values) {
        if (where) {
            where += " AND "
        }
        where += pool.escapeId(vkey) + "=" + pool.escape(values[vkey]);
    }
    sql += where;
    execUpdate(sql, null, callback);
}

function setFilter(table, params) {
    if (params && params['*session']) {
        var user = params['*session'].user;
        if (user && user.orgid)
            var orgid = user.orgid;
        var datafilters = filters.datafilters;
        if (!params[datafilters[table]]) {
            if (datafilters[table]) {
                params[datafilters[table]] = orgid;
            }
        }
    }
}

//构建查询语句
exports.buildQuerySql = function(tablename, values, islike) {
    var where = "";
    var order = "";
    for (x in values) {
        if (x != "page" && x != "size" && x != "pageNumber" && x != "pageSize" && x[0] != "*") {
            if (x == "sort") {
                var desc = values['order'] ? values['order'] : "asc";
                order = " ORDER BY " + pool.escapeId(values[x]) + " " + desc;
            } else if (x != "order") {
                var value = values[x];
                if (value) {
                    if (where != "") {
                        where += " and ";
                    }
                    value = pool.escape(value);
                    if (islike) {
                        where += x + " like '%" + value.substring(1, value.length - 1) + "%'";
                    } else {
                        where += x + " = " + value;
                    }
                }
            }
        }
    }
    var sql = "SELECT * FROM " + tablename;
    if (where != "") {
        sql += " WHERE " + where;
    }
    if (order != "") {
        sql += order;
    }
    return sql;
}


//重写buildQuerySql方法
exports.buildQuerySql2 = function(sqls, values, islike) {
    var where = "";
    var order = "";
    for (x in values) {
        if (x != "page" && x != "size" && x != "pageNumber" && x != "pageSize" && x[0] != "*") {
            if (x == "sort") {
                var desc = values['order'] ? values['order'] : "asc";
                order = " ORDER BY " + pool.escapeId(values[x]) + " " + desc;
            } else if (x != "order") {
                var value = values[x];
                if (value) {
                    if (where != "") {
                        where += " and ";
                    }
                    value = pool.escape(value);
                    if (islike) {
                        where += x + " like '%" + value.substring(1, value.length - 1) + "%'";
                    } else {
                        where += x + " = " + value;
                    }
                }
            }
        }
    }
    var sql = sqls;
    if (where != "") {
        sql += " WHERE " + where;
    }
    if (order != "") {
        sql += order;
    }
    return sql;
}


exports.buildInsertSql = function(tablename, values) {
    var value = "";
    var idx = "";
    var sql = "INSERT INTO " + tablename + "(";
    for (idx in values) {
        if (idx[0] == "*") {
            continue;
        }
        sql += pool.escapeId(idx);
        sql += ",";

        value += pool.escape(values[idx]);
        value += ",";
    }
    sql = sql.slice(0, sql.length - 1);
    sql += ") VALUES (";
    sql += value;
    sql = sql.slice(0, sql.length - 1);
    sql += ");";
    return sql;
}

exports.buildUpdateSql = function(tablename, values) {
    var sql = "UPDATE " + tablename + " SET ";
    var value = "";
    var idx = "";

    for (idx in values) {
        if (idx[0] == "*") {
            continue;
        }
        if (idx == "cr_create_date" || idx == "create_time") {
            continue;
        }
        sql += pool.escapeId(idx) + "=" + pool.escape(values[idx]) + ","
    }

    sql = sql.slice(0, sql.length - 1);
    return sql;
}

exports.escapeId = function(key) {
    return pool.escapeId(key);
}

exports.escape = function(value) {
    return pool.escape(value);
}