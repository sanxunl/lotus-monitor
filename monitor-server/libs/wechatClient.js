const axios = require('axios');
const config = require('config').wxConfig;
const redisClient = require('./redisClient');

exports.sendMsg = function(msg) {
    getToken(token => {
        if (token) {
            let data = {
                touser: '@all',
                msgtype: 'text',
                agentid: config.agentid,
                text: { content: msg }
            }
            let url = 'https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=' + token;
            console.log(url, data);
            axios.post(url, data).then(function(response) {
                console.log(response.data);
            }).catch(function(error) {
                console.log(error);
            });
        }
    });
}

function getToken(callback) {
    redisClient.get('wx_token', res => {
        console.log('wx_token', res);
        if (res && res.access_token) {
            let update_time = res.update_time;
            let curr_time = new Date().getTime();
            if (curr_time - update_time > 7000000) {
                getTokenFromServer(callback)
            } else {
                callback(res.access_token);
            }
        } else {
            getTokenFromServer(callback)
        }
    });
}

function getTokenFromServer(callback) {
    let corpid = config.corpid;
    let secret = config.secret;
    axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=' + corpid + '&corpsecret=' + secret).then(function(response) {
        // handle success
        console.log(response.data);
        let data = response.data;
        if (data.errcode == 0) {
            updateTokenToFile(data);
            callback(data.access_token)
        } else {
            callback(null)
        }
    }).catch(function(error) {
        console.log(error);
        callback(null)
    });
}

function updateTokenToFile(data) {
    let params = { access_token: data && data.access_token ? data.access_token : '', update_time: new Date().getTime() };
    redisClient.setWithExTime('wx_token', params, 7000000);
}