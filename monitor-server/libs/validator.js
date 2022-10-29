/*
(1) required:true             必输字段

(2) email:true                必须输入正确格式的电子邮件
(3) url:true                  必须输入正确格式的网址
(4) date:true                 必须输入正确格式的日期 日期校验ie6出错，慎用
(5) dateISO:true              必须输入正确格式的日期(ISO)，例如：2009-06-23，1998/01/22 只验证格式，不验证有效性
(6) number:true               必须输入合法的数字(负数，小数)
(7) digits:true               必须输入整数
(8) creditcard:               必须输入合法的信用卡号
(9) equalTo:"#field"          输入值必须和#field相同
(10)accept:                   输入拥有合法后缀名的字符串（上传文件的后缀）

(11)maxlength:5               输入长度最多是5的字符串(汉字算一个字符)
(12)minlength:10              输入长度最小是10的字符串(汉字算一个字符)
(13)rangelength:[5,10]        输入长度必须介于 5 和 10 之间的字符串")(汉字算一个字符)
(14)range:[5,10]              输入值必须介于 5 和 10 之间
(15)max:5                     输入值不能大于5
(16)min:10                    输入值不能小于10
*/

var util = require('util');
var messages = {
    required: "必选字段",
    email: "请输入正确格式的电子邮件",
    date: "请输入合法的日期",
    datetime: "请输入合法的时间.",
    number: "请输入合法的数字",
    digits: "只能输入整数",
    equalTo: "请再次输入相同的值",
    maxlength: "请输入一个 长度最多是 %s 的字符串",
    minlength: "请输入一个 长度最少是 %s 的字符串",
    rangelength: "请输入一个长度介于 %s 和 %s 之间的字符串",
    range: "请输入一个介于 %s 和 %s 之间的值",
    max: "请输入一个最大为 %s 的值",
    min: "请输入一个最小为 %s 的值",
    phonenumber: "請輸入11位数字的手机号",
    alipay: "请输入正确格式的支付宝账号"
}

var methods = {
    email: function (value, rulevalue) {
        if (rulevalue) {
            var checkEmail = /^[-_A-Za-z0-9]+@([_A-Za-z0-9]+\.)+[A-Za-z0-9]{2,3}$/;
            return checkEmail.test(value);
        } else {
            return true;
        }
    },
    date: function (value, rulevalue) {
        if (rulevalue) {
            return util.isDate(value);
        } else {
            return true;
        }
    },
    datetime: function (value, rulevalue) {
        if (rulevalue) {
            return util.isDate(value);
        } else {
            return true;
        }
    },
    number: function (value, rulevalue) {
        if (rulevalue) {
            return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
        } else {
            return true;
        }
    },
    alipay: function (value, rulevalue) {
        if (rulevalue) {
            var checkEmail = /^[-_A-Za-z0-9]+@([_A-Za-z0-9]+\.)+[A-Za-z0-9]{2,3}$/;
            var checkphone = /^1\d{10}$/;
            if (!checkEmail.test(value)) {
                return checkEmail.test(value);
            } else {
                if (!checkphone.test(value)) {
                    return checkphone.test(value);
                }
            }
        } else {
            return true;
        }
    },
    digits: function (value, rulevalue) {
        if (rulevalue) {
            return /^\d+$/.test(value);
        } else {
            return true;
        }
    },
    equalTo: function (value, rulevalue) {
        return value.length == rulevalue;
    },
    maxlength: function (value, rulevalue) {
        return value.length <= rulevalue;
    },
    minlength: function (value, rulevalue) {
        return value.length >= rulevalue;
    },
    rangelength: function (value, rulevalue) {
        return value.length >= rulevalue[0] && value.length <= rulevalue[1];
    },
    range: function (value, rulevalue) {
        return value >= rulevalue[0] && value <= rulevalue[1];
    },
    max: function (value, rulevalue) {
        return value <= rulevalue;
    },
    min: function (value, rulevalue) {
        return value >= rulevalue;
    },
    phonenumber: function (value, rulevalue) {
        if (rulevalue) {
            var reg = /^1\d{10}$/;
            return reg.test(value);
        } else {
            return true;
        }
    }
}

exports.validate = function (data, rules) {
    var result = {};
    for (x in rules) {
        var rule = rules[x];
        if (!data[x]) {
            if (rule.required) {
                result[x] = messages.required;
                return result;
            }
        } else {
            for (index in rule) {
                if (index != 'required' && index != 'String') {
                    if (!methods[index](data[x], rule[index])) {
                        var s = messages[index];
                        var len = s.match(/%s/g);
                        if (len) {
                            len = len.length;
                        } else {
                            len = 0;
                        }
                        if (len == 2) {
                            result[x] = util.format(messages[index], rule[index][0], rule[index][1]);;
                        } else if (len == 1) {
                            result[x] = util.format(messages[index], rule[index]);
                        } else {
                            result[x] = messages[index];
                        }
                        return result;
                    }
                }
            }
        }
    }
    return null;
}
