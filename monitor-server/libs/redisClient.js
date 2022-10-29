var redis = require("redis");
const config = require('config');
var client = redis.createClient(config.dbConfig.redis);
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();
const defaultExpireTime = 86400;

exports.keys = async (key, callback) => {
    const value = await client.keys(key);
    callback(value);
}

exports.get = async (key, callback) => {
    let value = await client.get(key);
    if (value) {
        try {
            value = JSON.parse(value);
        } catch (err1) {
            value = null;
        }
    }
    callback(value);
}

exports.set = (key, value) => {
    client.set(key, JSON.stringify(value), 'EX', defaultExpireTime);
}

exports.setWithExTime = (key, value, expireTime) => {
    client.set(key, JSON.stringify(value), 'EX', expireTime);
}

exports.del = (key) => {
    client.del(key);
}
