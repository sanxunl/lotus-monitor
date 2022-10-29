const nodeInfo = require('../dao/nodeInfo');

function Service() {
    this.process = function(params, callback) {
        if (params && params.count_pending > 0) {
            nodeInfo.getById(params.n_id, (nodeRes) => {
                if (nodeRes) {
                    let res = '[' + nodeRes.ip + '] 节点本地堵塞消息数为' + params.count_pending + ', 请尽快排查！';
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