const dao = require('../dao/cpulogs');

function Service() {
    this.list = function(params, callback) {
        dao.getList(params, callback);
    }
    this.retrieve = function(id, params, callback) {
        dao.getById(id, callback);
    }
}
exports.service = Service;