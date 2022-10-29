const wechatClient = require('./libs/wechatClient');
const mysql = require('./libs/mysqlClient');
const alert = require('./alert/index');
const nodeInfo = require('./dao/nodeInfo');
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware2')
const config = require('config');
const validator = require('./libs/validator');
const _events = ['list', 'retrieve', 'putCollection', 'update', 'create', 'post', 'deleteCollection', 'delete'];
const session = require('restify-session')({
    sidHeader: 'authorization',
    connection: config.dbConfig.redis
});
const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: ['*'],
    allowHeaders: ['authorization']
})


exports.init = (server) => {
    server.use(session.sessionManager);
    server.use(restify.plugins.dateParser());
    server.use(restify.plugins.queryParser({ mapParams: true }));
    server.use(restify.plugins.gzipResponse());
    server.use(restify.plugins.bodyParser({ mapParams: true }));
    server.pre(cors.preflight);
    server.use(cors.actual);

    server.get('/api/:resources', send);
    server.get('/api/:resources/:id', send);
    server.post('/api/:resources', send);
    server.post('/api/:resources/:id', send);
    server.put('/api/:resources', send);
    server.put('/api/:resources/:id', send);
    server.del('/api/:resources', send);
    server.del('/api/:resources/:id', send);

    server.get('/api/version', (req, res, next) => {
        respond(req, res, { version: config.version });
    });

    server.post('/save/:table/:idname', function(req, res, next) {
        let params = req.params;
        let data = req.body;
        let idvalue = data[params.idname];
        let idParams = {};
        idParams[params.idname] = idvalue;
        if (idvalue) {
            mysql.updateObject(params.table, data, idParams, () => {
                console.log(params.table + ' updated')
            });
        } else {
            mysql.addObject(params.table, data, () => {
                console.log(params.table + ' inserted')
            });
        }
        res.send({ res: true });
        return next();
    });

    server.post('/save/:table', function(req, res, next) {
        let params = req.params;
        let data = req.body;
        mysql.addObject(params.table, data, () => {
            console.log(params.table + ' inserted')
            alert.sendMsg(params.table, data);
        });
        res.send({ res: true });
        return next();
    });

    server.post('/savedatas/:table', function(req, res, next) {
        let params = req.params;
        let datas = req.body;
        if (datas) {
            datas = JSON.parse(datas);
            if (datas && datas.length > 0) {
                for (const i in datas) {
                    let data = datas[i];
                    mysql.addObject(params.table, data, () => {
                        console.log(params.table + 'inserted')
                    });
                }
            }
        }
        res.send({ res: true });
        return next();
    });

    server.post('/alert', function(req, res, next) {
        console.log('alert', req.params, req.body)
        let data = req.body;
        nodeInfo.getById(data.n_id, (nodeRes) => {
            if (nodeRes.is_alert) {
                let params = '[' + nodeRes.ip + '] ' + data.text;
                wechatClient.sendMsg(params);
            }
        });
        res.send({ res: true });
        return next();
    });

    server.get('/config/:id', function(req, res, next) {
        let params = req.params;
        nodeInfo.getById(params.id, (data) => {
            res.setHeader("Content-Type", "text/json;charset=UTF-8");
            res.end(JSON.stringify(data));
        });
    });
}

function send(req, res, next) {
    var resources = req.params.resources;
    if (resources) {
        var method = req.method.toUpperCase();
        var event = emitEvent(method, req.params.id);
        if (supportEvent(event, req)) {
            return invoke(req, event, (result) => {
                respond(req, res, result);
            });
        } else {
            var errorstr = 'No supported event found!';
            return errorstr;
        }
    } else {
        return 'No supported resources found!';
    }
}

function invoke(req, event, callback) {
    var method = req.method.toUpperCase();
    var checkedresult = true;
    if (method == 'PUT' || method == 'POST') {
        var valiconf = loadModule('./validate/' + req.params[0] + '.json');
        if (valiconf) {
            var result = validator.validate(req.params, valiconf);
            if (result) {
                checkedresult = false;
                callback({
                    error: result
                });
            }
        }
    }
    if (checkedresult) {
        //加载对应的资源处理Module
        var module = loadModule('./api/' + req.params.resources);
        if (module) {
            var service = new module.service();
            var fn = service[event];
            var id = req.params.id;
            delete req.params.resources;
            delete req.params.id;
            req.params['*session'] = req.session;
            if (id) {
                fn(id, req.params, function(result) {
                    callback(result);
                });
            } else {
                fn(req.params, function(result) {
                    callback(result);
                });
            }
        } else {
            var errorstr = 'No module found!';
            return errorstr;
        }
    }

}

function emitEvent(method, id) {
    var localEvent;
    switch (method) {
        case 'GET': //查询
            localEvent = id ? 'retrieve' : 'list';
            break;
        case 'PUT': //修改
            localEvent = id ? 'update' : 'putCollection';
            break;
        case 'POST': //增加
            localEvent = id ? 'post' : 'create';
            break;
        case 'DELETE': //删除
            localEvent = id ? 'delete' : 'deleteCollection';
            break;
    }
    return localEvent;
}

function supportEvent(event, req) {
    var result = false;
    _events.forEach(function(_event) {
        if (event === _event) {
            result = true;
        }
    });
    return result;
}

function respond(req, res, result) {
    var stringfyResult = JSON.stringify(result);
    res.setHeader("Content-Type", "text/json;charset=UTF-8");
    res.setHeader("authorization", req.session.sid);
    res.end(stringfyResult);
    // return next();
}

function gotoLogin(res) {
    res.setHeader("Content-Type", "text/json;charset=UTF-8");
    res.status(401);
    //跳转到登录页面
    // res.redirect(401, 'www.foo.com/login', next);
    res.end();
}

function loadModule(path) {
    try {
        return require(path);
    } catch (err) {
        return null;
    }
}