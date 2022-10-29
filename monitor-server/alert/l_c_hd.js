const nodeInfo = require('../dao/nodeInfo');

function Service() {
    this.process = function(params, callback) {
        if (params && params.use_pct) {
            let use_pct = Number(params.use_pct.replace('%', ''));
            if (use_pct > 75) {
                nodeInfo.getById(params.n_id, (nodeRes) => {
                    if (nodeRes) {
                        let res = '[' + nodeRes.ip + '] 磁盘使用率为' + params.use_pct + ', 请尽快排查！';
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