const nodeInfo = require('../dao/nodeInfo');
const format = require('date-format');

function Service() {
    this.process = function(params, callback) {
        let nowDate = new Date();
        let startDate = format('yyyy-MM-dd', new Date());
        if (nowDate.getHours() < 8 || (nowDate.getHours() == 8 && nowDate.getMinutes() < 30)) {
            startDate = format('yyyy-MM-dd', new Date(nowDate.getTime() - (1000 * 60 * 60 * 24)));
        }
        let startTime = new Date(startDate + ' 08:30:00');
        let diff = (nowDate.getTime() - startTime.getTime()) / 1000 / 60;
        let count = parseInt((diff * 2) + '');
        let diffCount = count - params.count_mineone;
        if (params && Number(params.m_id) > 1 && count > params.count_mineone && diffCount > 10) {
            nodeInfo.getById(params.m_id, (nodeRes) => {
                if (nodeRes) {
                    let res = '[' + nodeRes.ip + '] miner winning block选举数过低, 为' + params.count_mineone + ', 请尽快排查！';
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