const nodeInfo = require('../dao/nodeInfo');

function Service() {
    this.process = function(params, callback) {
        if (params && params.total && params.used) {
            let total = Number(params.total);
            let used = Number(params.used);
            let pct = (used / total * 100).toFixed(1);
            if (pct > 75) {
                nodeInfo.getById(params.n_id, (nodeRes) => {
                    if (nodeRes) {
                        let res = '[' + nodeRes.ip + '] 内存使用率为' + pct + ', 请尽快排查！';
                        callback({ msg: res, is_alert: nodeRes.is_alert });
                    } else {
                        callback({ msg: '' });
                    }
                })
            }
        } else {
            callback({ msg: '' });
        }
    }
}

exports.service = Service;