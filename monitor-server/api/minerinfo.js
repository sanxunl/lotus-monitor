const dao = require('../dao/minerInfo');

function Service() {
    this.list = function(params, callback) {
        dao.getList(params, callback);
    }
    this.retrieve = function(id, params, callback) {
        dao.getById(id, callback);
    }
}
exports.service = Service;