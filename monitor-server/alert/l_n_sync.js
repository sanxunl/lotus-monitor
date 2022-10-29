const nodeInfo = require('../dao/nodeInfo');

function Service() {
    this.process = function(params, callback) {
        if (params && !params.is_done && params.max_diff >= 2) {
            nodeInfo.getById(params.n_id, (nodeRes) => {
                if (nodeRes) {
                    let res = '[' + nodeRes.ip + '] 节点同步高度差为' + params.max_diff + ', 请尽快排查！';
                    callback({ msg: res, is_alert: nodeRes.is_alert });
                } else {
                    callback({ msg: '' });
                }
            })
        } else {
            callback({ msg: '' });
        }
    }
}

exports.service = Service;