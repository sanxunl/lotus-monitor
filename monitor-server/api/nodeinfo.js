const nodeInfo = require('../dao/nodeInfo');

function Service() {
    this.list = function(params, callback) {
        nodeInfo.getList(callback);
    }
    this.retrieve = function(id, params, callback) {
        nodeInfo.getById(id, callback);
    }
    this.create = function(params, callback) {
        nodeInfo.save(params, callback);
    }
    this.update = function(id, params, callback) {
        nodeInfo.update(id, params, callback);
    }
}
exports.service = Service;